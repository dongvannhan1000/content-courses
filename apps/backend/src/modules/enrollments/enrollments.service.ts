import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EnrollmentStatus, Role } from '@prisma/client';
import { EnrollmentQueryDto, AdminUpdateEnrollmentDto } from './dto/enroll.dto';
import {
    EnrollmentListItemDto,
    EnrollmentDetailDto,
    EnrollmentCheckDto,
    PaginatedEnrollmentsDto,
    CourseRefDto,
    InstructorRefDto,
} from './dto/enrollment-response.dto';

@Injectable()
export class EnrollmentsService {
    constructor(private prisma: PrismaService) { }

    // ============ User Methods ============

    /**
     * Get all enrollments for a user
     * Used for: "My Courses" dashboard
     * N+1 Prevention: Single query with course and instructor includes
     */
    async findByUser(userId: number): Promise<EnrollmentListItemDto[]> {
        const enrollments = await this.prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnail: true,
                        instructor: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        });

        return enrollments.map((e) => this.mapToListItem(e));
    }

    /**
     * Check enrollment status for a course
     * Used for: Course detail page to determine button state
     */
    async checkEnrollment(userId: number, courseId: number): Promise<EnrollmentCheckDto> {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (!enrollment) {
            return { enrolled: false };
        }

        return {
            enrolled: true,
            status: enrollment.status,
            progressPercent: enrollment.progressPercent,
            enrollmentId: enrollment.id,
        };
    }

    /**
     * Check if user is actively enrolled (for access control)
     */
    async isEnrolled(userId: number, courseId: number): Promise<boolean> {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        return !!enrollment && enrollment.status === EnrollmentStatus.ACTIVE;
    }

    /**
     * Enroll user in a course
     * Used for: After successful payment or free course enrollment
     */
    async create(userId: number, courseId: number): Promise<EnrollmentDetailDto> {
        // Check if course exists
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, status: true },
        });

        if (!course) {
            throw new NotFoundException(`Course with ID ${courseId} not found`);
        }

        if (course.status !== 'PUBLISHED') {
            throw new ForbiddenException('Cannot enroll in unpublished course');
        }

        // Check if already enrolled
        const existing = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (existing) {
            throw new ConflictException('Already enrolled in this course');
        }

        const enrollment = await this.prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: EnrollmentStatus.ACTIVE,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnail: true,
                        instructor: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        return this.mapToDetail(enrollment);
    }

    /**
     * Update learning progress
     * Used for: Tracking user progress through lessons
     */
    async updateProgress(
        enrollmentId: number,
        userId: number,
        progressPercent: number,
    ): Promise<EnrollmentDetailDto> {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
        });

        if (!enrollment) {
            throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
        }

        if (enrollment.userId !== userId) {
            throw new ForbiddenException('You can only update your own enrollment progress');
        }

        if (enrollment.status !== EnrollmentStatus.ACTIVE) {
            throw new ForbiddenException('Can only update progress for active enrollments');
        }

        const updated = await this.prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { progressPercent },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnail: true,
                        instructor: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        return this.mapToDetail(updated);
    }

    /**
     * Mark enrollment as completed
     * Used for: When user finishes all lessons
     */
    async markComplete(enrollmentId: number, userId: number): Promise<EnrollmentDetailDto> {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
        });

        if (!enrollment) {
            throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
        }

        if (enrollment.userId !== userId) {
            throw new ForbiddenException('You can only complete your own enrollment');
        }

        const updated = await this.prisma.enrollment.update({
            where: { id: enrollmentId },
            data: {
                status: EnrollmentStatus.COMPLETED,
                completedAt: new Date(),
                progressPercent: 100,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnail: true,
                        instructor: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        return this.mapToDetail(updated);
    }

    // ============ Admin Methods ============

    /**
     * Get all enrollments with pagination and filters
     * Used for: Admin dashboard
     * N+1 Prevention: Single query with all relations
     */
    async findAll(query: EnrollmentQueryDto): Promise<PaginatedEnrollmentsDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.courseId) where.courseId = query.courseId;
        if (query.userId) where.userId = query.userId;

        const [enrollments, total] = await Promise.all([
            this.prisma.enrollment.findMany({
                where,
                skip,
                take: limit,
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnail: true,
                            instructor: {
                                select: { id: true, name: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.enrollment.count({ where }),
        ]);

        return {
            enrollments: enrollments.map((e) => this.mapToDetail(e)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get single enrollment by ID
     * Used for: Admin detail view
     */
    async findById(id: number): Promise<EnrollmentDetailDto> {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnail: true,
                        instructor: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        if (!enrollment) {
            throw new NotFoundException(`Enrollment with ID ${id} not found`);
        }

        return this.mapToDetail(enrollment);
    }

    /**
     * Admin update enrollment
     * Used for: Changing status, extending expiry
     */
    async adminUpdate(id: number, dto: AdminUpdateEnrollmentDto): Promise<EnrollmentDetailDto> {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id },
        });

        if (!enrollment) {
            throw new NotFoundException(`Enrollment with ID ${id} not found`);
        }

        const data: any = {};
        if (dto.status !== undefined) {
            data.status = dto.status;
            if (dto.status === EnrollmentStatus.COMPLETED) {
                data.completedAt = new Date();
                data.progressPercent = 100;
            }
        }
        if (dto.expiresAt !== undefined) {
            data.expiresAt = new Date(dto.expiresAt);
        }

        const updated = await this.prisma.enrollment.update({
            where: { id },
            data,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnail: true,
                        instructor: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        return this.mapToDetail(updated);
    }

    /**
     * Delete enrollment
     * Used for: Admin refund/cancel
     */
    async delete(id: number): Promise<void> {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id },
        });

        if (!enrollment) {
            throw new NotFoundException(`Enrollment with ID ${id} not found`);
        }

        await this.prisma.enrollment.delete({ where: { id } });
    }

    // ============ Mapping Methods ============

    private mapToListItem(enrollment: any): EnrollmentListItemDto {
        return {
            id: enrollment.id,
            status: enrollment.status,
            progressPercent: enrollment.progressPercent,
            enrolledAt: enrollment.enrolledAt,
            course: this.mapToCourseRef(enrollment.course),
        };
    }

    private mapToDetail(enrollment: any): EnrollmentDetailDto {
        return {
            ...this.mapToListItem(enrollment),
            expiresAt: enrollment.expiresAt ?? undefined,
            completedAt: enrollment.completedAt ?? undefined,
            createdAt: enrollment.createdAt,
            updatedAt: enrollment.updatedAt,
        };
    }

    private mapToCourseRef(course: any): CourseRefDto {
        return {
            id: course.id,
            title: course.title,
            slug: course.slug,
            thumbnail: course.thumbnail ?? undefined,
            instructor: this.mapToInstructorRef(course.instructor),
        };
    }

    private mapToInstructorRef(instructor: any): InstructorRefDto {
        return {
            id: instructor.id,
            name: instructor.name ?? 'Unknown',
        };
    }
}
