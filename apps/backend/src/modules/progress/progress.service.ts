import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EnrollmentStatus } from '@prisma/client';
import { UpdateProgressDto } from './dto/update-progress.dto';
import {
    ProgressDto,
    CourseProgressDto,
    LessonProgressSummaryDto,
} from './dto/progress-response.dto';

@Injectable()
export class ProgressService {
    private readonly logger = new Logger(ProgressService.name);

    constructor(private prisma: PrismaService) { }

    // ============ Placeholder Methods (for future expansion) ============

    /**
     * Get progress for a single lesson
     * Placeholder: Returns default values or empty progress
     */
    async getByLesson(userId: number, courseId: number, lessonId: number): Promise<ProgressDto> {
        this.logger.log(`[Placeholder] Getting lesson progress: user=${userId}, lesson=${lessonId}`);

        // Verify enrollment
        await this.verifyEnrollment(userId, courseId);

        // Verify lesson belongs to course
        const lesson = await this.prisma.lesson.findFirst({
            where: { id: lessonId, courseId },
        });
        if (!lesson) {
            throw new NotFoundException(`Lesson with ID ${lessonId} not found in course ${courseId}`);
        }

        // Find or return default progress
        const progress = await this.prisma.progress.findUnique({
            where: { userId_lessonId: { userId, lessonId } },
        });

        if (!progress) {
            return {
                id: 0, // No progress record yet
                lessonId,
                isCompleted: false,
                watchedSeconds: 0,
                lastPosition: 0,
            };
        }

        return this.mapToProgressDto(progress);
    }

    /**
     * Update progress for a lesson (watch position)
     * Placeholder: Upserts progress but doesn't trigger any side effects
     */
    async updateProgress(
        userId: number,
        courseId: number,
        lessonId: number,
        dto: UpdateProgressDto,
    ): Promise<ProgressDto> {
        this.logger.log(`[Placeholder] Updating lesson progress: user=${userId}, lesson=${lessonId}, data=${JSON.stringify(dto)}`);

        // Verify enrollment
        await this.verifyEnrollment(userId, courseId);

        // Verify lesson belongs to course
        const lesson = await this.prisma.lesson.findFirst({
            where: { id: lessonId, courseId },
        });
        if (!lesson) {
            throw new NotFoundException(`Lesson with ID ${lessonId} not found in course ${courseId}`);
        }

        // Upsert progress
        const progress = await this.prisma.progress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            update: {
                watchedSeconds: dto.watchedSeconds,
                lastPosition: dto.lastPosition,
            },
            create: {
                userId,
                lessonId,
                watchedSeconds: dto.watchedSeconds ?? 0,
                lastPosition: dto.lastPosition ?? 0,
            },
        });

        return this.mapToProgressDto(progress);
    }

    // ============ Full Implementation Methods ============

    /**
     * Mark a lesson as complete
     * - Sets isCompleted = true
     * - Recalculates enrollment progress
     * - Auto-complete enrollment if all lessons done
     */
    async markComplete(userId: number, courseId: number, lessonId: number): Promise<ProgressDto> {
        this.logger.log(`Marking lesson complete: user=${userId}, course=${courseId}, lesson=${lessonId}`);

        // Verify enrollment
        await this.verifyEnrollment(userId, courseId);

        // Verify lesson belongs to course and is published
        const lesson = await this.prisma.lesson.findFirst({
            where: { id: lessonId, courseId, isPublished: true },
        });
        if (!lesson) {
            throw new NotFoundException(`Published lesson with ID ${lessonId} not found in course ${courseId}`);
        }

        // Upsert progress with completion
        const progress = await this.prisma.progress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            update: {
                isCompleted: true,
                completedAt: new Date(),
            },
            create: {
                userId,
                lessonId,
                isCompleted: true,
                completedAt: new Date(),
            },
        });

        // Recalculate enrollment progress
        await this.recalculateEnrollmentProgress(userId, courseId);

        this.logger.log(`Lesson marked complete: user=${userId}, lesson=${lessonId}`);
        return this.mapToProgressDto(progress);
    }

    /**
     * Get course progress summary
     * - Total lessons count
     * - Completed lessons count
     * - Progress percentage
     * - Per-lesson completion status
     */
    async getCourseProgress(userId: number, courseId: number): Promise<CourseProgressDto> {
        this.logger.log(`Getting course progress: user=${userId}, course=${courseId}`);

        // Verify enrollment
        await this.verifyEnrollment(userId, courseId);

        // Get all published lessons with their progress (N+1 prevention)
        const lessons = await this.prisma.lesson.findMany({
            where: { courseId, isPublished: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                title: true,
                order: true,
                progress: {
                    where: { userId },
                    select: { isCompleted: true },
                },
            },
        });

        const totalLessons = lessons.length;
        const completedLessons = lessons.filter(l => l.progress[0]?.isCompleted).length;
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        const lessonSummaries: LessonProgressSummaryDto[] = lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            isCompleted: lesson.progress[0]?.isCompleted ?? false,
        }));

        this.logger.log(`Course progress: ${completedLessons}/${totalLessons} (${progressPercent}%)`);

        return {
            courseId,
            totalLessons,
            completedLessons,
            progressPercent,
            lessons: lessonSummaries,
        };
    }

    // ============ Helper Methods ============

    /**
     * Recalculate and update enrollment progress based on completed lessons
     */
    private async recalculateEnrollmentProgress(userId: number, courseId: number): Promise<void> {
        // Count total published lessons
        const totalLessons = await this.prisma.lesson.count({
            where: { courseId, isPublished: true },
        });

        if (totalLessons === 0) return;

        // Count completed lessons for this user
        const completedLessons = await this.prisma.progress.count({
            where: {
                userId,
                isCompleted: true,
                lesson: { courseId, isPublished: true },
            },
        });

        const progressPercent = Math.round((completedLessons / totalLessons) * 100);

        // Update enrollment
        const updateData: any = { progressPercent };

        // Auto-complete enrollment if 100%
        if (progressPercent === 100) {
            updateData.status = EnrollmentStatus.COMPLETED;
            updateData.completedAt = new Date();
            this.logger.log(`Auto-completing enrollment: user=${userId}, course=${courseId}`);
        }

        await this.prisma.enrollment.update({
            where: { userId_courseId: { userId, courseId } },
            data: updateData,
        });

        this.logger.log(`Enrollment progress updated: user=${userId}, course=${courseId}, progress=${progressPercent}%`);
    }

    /**
     * Verify user has active enrollment in course
     */
    private async verifyEnrollment(userId: number, courseId: number): Promise<void> {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (!enrollment) {
            throw new ForbiddenException('You must be enrolled in this course to track progress');
        }

        if (enrollment.status !== EnrollmentStatus.ACTIVE && enrollment.status !== EnrollmentStatus.COMPLETED) {
            throw new ForbiddenException('Your enrollment is not active');
        }
    }

    private mapToProgressDto(progress: any): ProgressDto {
        return {
            id: progress.id,
            lessonId: progress.lessonId,
            isCompleted: progress.isCompleted,
            watchedSeconds: progress.watchedSeconds,
            lastPosition: progress.lastPosition,
            completedAt: progress.completedAt ?? undefined,
        };
    }
}
