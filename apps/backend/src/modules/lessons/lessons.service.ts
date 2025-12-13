import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Role, LessonType, EnrollmentStatus } from '@prisma/client';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import {
    LessonListItemDto,
    LessonDetailDto,
    LessonDto,
    MediaDto,
} from './dto/lesson-response.dto';

@Injectable()
export class LessonsService {
    constructor(private prisma: PrismaService) { }

    // ============ Public/Semi-Public Endpoints ============

    /**
     * Get lessons by course
     * - Public: only published lessons (no content)
     * - Owner/Admin: all lessons
     */
    async findByCourse(
        courseId: number,
        userId?: number,
        userRole?: Role,
    ): Promise<LessonListItemDto[]> {
        // Check if user is course owner
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: { instructorId: true },
        });

        if (!course) {
            throw new NotFoundException(`Course with ID ${courseId} not found`);
        }

        const isOwner = userId && (course.instructorId === userId || userRole === Role.ADMIN);

        const lessons = await this.prisma.lesson.findMany({
            where: {
                courseId,
                ...(isOwner ? {} : { isPublished: true }),
            },
            orderBy: { order: 'asc' },
        });

        return lessons.map((lesson) => this.mapToListItem(lesson));
    }

    /**
     * Get lesson detail by slug
     * - Free lesson: anyone can view content
     * - Paid lesson: enrolled users or owner can view content
     */
    async findBySlug(
        courseId: number,
        slug: string,
        userId?: number,
        userRole?: Role,
    ): Promise<LessonDetailDto> {
        const lesson = await this.prisma.lesson.findFirst({
            where: { courseId, slug },
            include: {
                media: { orderBy: { order: 'asc' } },
                course: { select: { instructorId: true } },
            },
        });

        if (!lesson) {
            throw new NotFoundException(`Lesson with slug "${slug}" not found in course ${courseId}`);
        }

        // Check if user can view content
        const isOwner = userId && (lesson.course.instructorId === userId || userRole === Role.ADMIN);

        // Non-owner cannot see unpublished lessons
        if (!lesson.isPublished && !isOwner) {
            throw new NotFoundException(`Lesson with slug "${slug}" not found in course ${courseId}`);
        }

        // Check access to content (only for non-free, non-owner)
        if (!lesson.isFree && !isOwner) {
            const hasAccess = await this.checkEnrollment(courseId, userId);
            if (!hasAccess) {
                throw new ForbiddenException('You must enroll in this course to access this lesson');
            }
        }

        return this.mapToDetail(lesson);
    }

    // ============ Protected Endpoints (Course Owner/Admin) ============

    /**
     * Create a new lesson
     */
    async create(
        courseId: number,
        dto: CreateLessonDto,
        userId: number,
        userRole: Role,
    ): Promise<LessonDto> {
        // Check course ownership
        await this.verifyCourseOwnership(courseId, userId, userRole);

        // Check slug uniqueness within course
        const existing = await this.prisma.lesson.findFirst({
            where: { courseId, slug: dto.slug },
        });
        if (existing) {
            throw new ConflictException(`Lesson with slug "${dto.slug}" already exists in this course`);
        }

        // Get next order if not specified
        let order = dto.order;
        if (order === undefined) {
            const lastLesson = await this.prisma.lesson.findFirst({
                where: { courseId },
                orderBy: { order: 'desc' },
                select: { order: true },
            });
            order = (lastLesson?.order ?? -1) + 1;
        }

        const lesson = await this.prisma.lesson.create({
            data: {
                title: dto.title,
                slug: dto.slug,
                description: dto.description,
                type: dto.type ?? LessonType.VIDEO,
                content: dto.content,
                order,
                duration: dto.duration ?? 0,
                isFree: dto.isFree ?? false,
                isPublished: dto.isPublished ?? false,
                courseId,
            },
        });

        // Update course total duration
        await this.updateCourseDuration(courseId);

        return this.mapToLessonDto(lesson);
    }

    /**
     * Update a lesson
     */
    async update(
        lessonId: number,
        dto: UpdateLessonDto,
        userId: number,
        userRole: Role,
    ): Promise<LessonDto> {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { select: { instructorId: true } } },
        });

        if (!lesson) {
            throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
        }

        // Check ownership
        await this.verifyCourseOwnership(lesson.courseId, userId, userRole);

        // Check slug uniqueness if updating slug
        if (dto.slug && dto.slug !== lesson.slug) {
            const existing = await this.prisma.lesson.findFirst({
                where: { courseId: lesson.courseId, slug: dto.slug },
            });
            if (existing) {
                throw new ConflictException(`Lesson with slug "${dto.slug}" already exists in this course`);
            }
        }

        const updated = await this.prisma.lesson.update({
            where: { id: lessonId },
            data: {
                title: dto.title,
                slug: dto.slug,
                description: dto.description,
                type: dto.type,
                content: dto.content,
                order: dto.order,
                duration: dto.duration,
                isFree: dto.isFree,
                isPublished: dto.isPublished,
            },
        });

        // Update course duration if lesson duration changed
        if (dto.duration !== undefined) {
            await this.updateCourseDuration(lesson.courseId);
        }

        return this.mapToLessonDto(updated);
    }

    /**
     * Delete a lesson
     */
    async delete(lessonId: number, userId: number, userRole: Role): Promise<void> {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { select: { instructorId: true } } },
        });

        if (!lesson) {
            throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
        }

        // Check ownership
        await this.verifyCourseOwnership(lesson.courseId, userId, userRole);

        await this.prisma.lesson.delete({ where: { id: lessonId } });

        // Update course duration
        await this.updateCourseDuration(lesson.courseId);
    }

    /**
     * Reorder lessons within a course
     */
    async reorder(
        courseId: number,
        lessonIds: number[],
        userId: number,
        userRole: Role,
    ): Promise<LessonListItemDto[]> {
        // Check ownership
        await this.verifyCourseOwnership(courseId, userId, userRole);

        // Update order for each lesson
        await Promise.all(
            lessonIds.map((id, index) =>
                this.prisma.lesson.update({
                    where: { id },
                    data: { order: index },
                }),
            ),
        );

        return this.findByCourse(courseId, userId, userRole);
    }

    // ============ Helper Methods ============

    private async verifyCourseOwnership(
        courseId: number,
        userId: number,
        userRole: Role,
    ): Promise<void> {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: { instructorId: true },
        });

        if (!course) {
            throw new NotFoundException(`Course with ID ${courseId} not found`);
        }

        if (course.instructorId !== userId && userRole !== Role.ADMIN) {
            throw new ForbiddenException('You can only manage lessons in your own courses');
        }
    }

    private async checkEnrollment(courseId: number, userId?: number): Promise<boolean> {
        if (!userId) return false;

        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });

        return enrollment?.status === EnrollmentStatus.ACTIVE;
    }

    private async updateCourseDuration(courseId: number): Promise<void> {
        const result = await this.prisma.lesson.aggregate({
            where: { courseId, isPublished: true },
            _sum: { duration: true },
        });

        await this.prisma.course.update({
            where: { id: courseId },
            data: { duration: result._sum.duration ?? 0 },
        });
    }

    private mapToListItem(lesson: any): LessonListItemDto {
        return {
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            description: lesson.description ?? undefined,
            type: lesson.type,
            order: lesson.order,
            duration: lesson.duration,
            isFree: lesson.isFree,
            isPublished: lesson.isPublished,
        };
    }

    private mapToDetail(lesson: any): LessonDetailDto {
        return {
            ...this.mapToListItem(lesson),
            content: lesson.content ?? undefined,
            media: lesson.media.map((m: any): MediaDto => ({
                id: m.id,
                type: m.type,
                title: m.title ?? undefined,
                url: m.url,
                filename: m.filename ?? undefined,
                mimeType: m.mimeType ?? undefined,
                size: m.size ?? undefined,
                duration: m.duration ?? undefined,
                order: m.order,
            })),
            createdAt: lesson.createdAt,
            updatedAt: lesson.updatedAt,
        };
    }

    private mapToLessonDto(lesson: any): LessonDto {
        return {
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            description: lesson.description ?? undefined,
            type: lesson.type,
            content: lesson.content ?? undefined,
            order: lesson.order,
            duration: lesson.duration,
            isFree: lesson.isFree,
            isPublished: lesson.isPublished,
            courseId: lesson.courseId,
            createdAt: lesson.createdAt,
            updatedAt: lesson.updatedAt,
        };
    }
}
