import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CourseStatus, Role } from '@prisma/client';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto, SortBy, SortOrder } from './dto/course-query.dto';
import {
    CourseListItemDto,
    CourseDetailDto,
    CourseDto,
    PaginatedCoursesDto,
    InstructorRefDto,
    CategoryRefDto,
    LessonSummaryDto,
} from './dto/course-response.dto';

// Cache keys
const CACHE_KEY_FEATURED = 'courses:featured';
const CACHE_KEY_COURSE_DETAIL = 'courses:detail';
const CACHE_TTL_FEATURED = 300000; // 5 minutes
const CACHE_TTL_COURSE_DETAIL = 300000; // 5 minutes

@Injectable()
export class CoursesService {
    private readonly logger = new Logger(CoursesService.name);

    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    // ============ Public Endpoints ============

    /**
     * Get all published courses with filters, pagination, and sorting
     * Used for: Course listing page, search results
     * 
     * N+1 Prevention: Uses Prisma include with select and _count
     */
    async findAll(query: CourseQueryDto): Promise<PaginatedCoursesDto> {
        this.logger.log(`Finding courses with filters: category=${query.category}, level=${query.level}, search=${query.search}, page=${query.page}`);
        const {
            category,
            level,
            minPrice,
            maxPrice,
            search,
            instructorId,
            sortBy = SortBy.NEWEST,
            sortOrder = SortOrder.DESC,
            page = 1,
            limit = 10,
        } = query;

        // Build where clause
        const where: any = {
            status: CourseStatus.PUBLISHED,
        };

        if (category) {
            where.category = { slug: category };
        }
        if (level) {
            // Case-insensitive match: 'beginner' -> 'Beginner', etc.
            where.level = { equals: level, mode: 'insensitive' };
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (instructorId) {
            where.instructorId = instructorId;
        }

        // Build orderBy clause
        let orderBy: any = { createdAt: 'desc' };
        switch (sortBy) {
            case SortBy.NEWEST:
                orderBy = { createdAt: sortOrder };
                break;
            case SortBy.PRICE:
                orderBy = { price: sortOrder };
                break;
            case SortBy.POPULAR:
                // Order by enrollment count - requires raw query or computed field
                orderBy = { createdAt: sortOrder }; // Fallback for now
                break;
            case SortBy.RATING:
                // Order by average rating - requires computed field
                orderBy = { createdAt: sortOrder }; // Fallback for now
                break;
        }

        // Execute count and find in parallel
        const [total, courses] = await Promise.all([
            this.prisma.course.count({ where }),
            this.prisma.course.findMany({
                where,
                include: {
                    instructor: {
                        select: { id: true, name: true, photoURL: true },
                    },
                    category: {
                        select: { id: true, name: true, slug: true },
                    },
                    _count: {
                        select: { lessons: true, enrollments: true, reviews: true },
                    },
                    reviews: {
                        select: { rating: true },
                        where: { isApproved: true },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy,
            }),
        ]);

        const data = courses.map((course) => this.mapToListItem(course));

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get featured courses (newest published, limited)
     * Used for: Homepage featured section
     */
    async findFeatured(limit: number = 6): Promise<CourseListItemDto[]> {
        const cacheKey = `${CACHE_KEY_FEATURED}:${limit}`;

        // Check cache first
        const cached = await this.cacheManager.get<CourseListItemDto[]>(cacheKey);
        if (cached) {
            this.logger.log(`Getting featured courses (from cache, limit: ${limit})`);
            return cached;
        }

        this.logger.log(`Getting featured courses (from database, limit: ${limit})`);
        const courses = await this.prisma.course.findMany({
            where: { status: CourseStatus.PUBLISHED },
            include: {
                instructor: {
                    select: { id: true, name: true, photoURL: true },
                },
                category: {
                    select: { id: true, name: true, slug: true },
                },
                _count: {
                    select: { lessons: true, enrollments: true, reviews: true },
                },
                reviews: {
                    select: { rating: true },
                    where: { isApproved: true },
                },
            },
            orderBy: { publishedAt: 'desc' },
            take: limit,
        });

        const result = courses.map((course) => this.mapToListItem(course));

        // Store in cache
        await this.cacheManager.set(cacheKey, result, CACHE_TTL_FEATURED);

        return result;
    }

    /**
     * Get course detail by slug
     * Used for: Course detail page
     */
    async findBySlug(slug: string): Promise<CourseDetailDto> {
        const cacheKey = `${CACHE_KEY_COURSE_DETAIL}:${slug}`;

        // Check cache first
        const cached = await this.cacheManager.get<CourseDetailDto>(cacheKey);
        if (cached) {
            this.logger.log(`Getting course by slug: ${slug} (from cache)`);
            return cached;
        }

        this.logger.log(`Getting course by slug: ${slug} (from database)`);
        const course = await this.prisma.course.findUnique({
            where: { slug },
            include: {
                instructor: {
                    select: { id: true, name: true, photoURL: true, bio: true },
                },
                category: {
                    select: { id: true, name: true, slug: true },
                },
                lessons: {
                    where: { isPublished: true },
                    select: { id: true, title: true, slug: true, order: true, duration: true, isFree: true },
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { lessons: true, enrollments: true, reviews: true },
                },
                reviews: {
                    select: { rating: true },
                    where: { isApproved: true },
                },
            },
        });

        if (!course) {
            throw new NotFoundException(`Course with slug "${slug}" not found`);
        }

        // Only show published courses publicly
        if (course.status !== CourseStatus.PUBLISHED) {
            throw new NotFoundException(`Course with slug "${slug}" not found`);
        }

        const result = this.mapToDetail(course);

        // Store in cache
        await this.cacheManager.set(cacheKey, result, CACHE_TTL_COURSE_DETAIL);

        return result;
    }

    // ============ Instructor/Admin Endpoints ============

    /**
     * Get courses by instructor
     * Used for: Instructor dashboard "My Courses"
     */
    async findByInstructor(instructorId: number): Promise<CourseListItemDto[]> {
        this.logger.log(`Getting courses for instructor: ${instructorId}`);
        const courses = await this.prisma.course.findMany({
            where: { instructorId },
            include: {
                instructor: {
                    select: { id: true, name: true, photoURL: true },
                },
                category: {
                    select: { id: true, name: true, slug: true },
                },
                _count: {
                    select: { lessons: true, enrollments: true, reviews: true },
                },
                reviews: {
                    select: { rating: true },
                    where: { isApproved: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return courses.map((course) => this.mapToListItem(course));
    }

    /**
     * Get ALL courses (for ADMIN dashboard)
     * Used for: Admin can see and manage all courses
     */
    async findAllForManagement(): Promise<CourseListItemDto[]> {
        this.logger.log(`Getting all courses for admin management`);
        const courses = await this.prisma.course.findMany({
            include: {
                instructor: {
                    select: { id: true, name: true, photoURL: true },
                },
                category: {
                    select: { id: true, name: true, slug: true },
                },
                _count: {
                    select: { lessons: true, enrollments: true, reviews: true },
                },
                reviews: {
                    select: { rating: true },
                    where: { isApproved: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return courses.map((course) => this.mapToListItem(course));
    }

    /**
     * Get course by ID for management (any status)
     * Used for: Instructor/Admin edit course drawer
     */
    async findByIdForManagement(id: number, userId: number, userRole: Role): Promise<CourseDetailDto> {
        this.logger.log(`Getting course ${id} for management by user: ${userId} (role: ${userRole})`);
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                instructor: {
                    select: { id: true, name: true, photoURL: true, bio: true },
                },
                category: {
                    select: { id: true, name: true, slug: true },
                },
                lessons: {
                    select: { id: true, title: true, slug: true, order: true, duration: true, isFree: true },
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { lessons: true, enrollments: true, reviews: true },
                },
                reviews: {
                    select: { rating: true },
                    where: { isApproved: true },
                },
            },
        });

        if (!course) {
            throw new NotFoundException(`Course with ID ${id} not found`);
        }

        // Check ownership (instructor can only edit own courses, admin can edit any)
        if (userRole !== Role.ADMIN && course.instructorId !== userId) {
            throw new ForbiddenException('You can only edit your own courses');
        }

        return this.mapToDetail(course);
    }

    /**
     * Create a new course
     * Used for: Instructor/Admin create course
     */
    async create(dto: CreateCourseDto, userId: number, userRole: Role): Promise<CourseDto> {
        this.logger.log(`Creating course: ${dto.title} by user: ${userId} (role: ${userRole})`);
        // Check slug uniqueness
        const existing = await this.prisma.course.findUnique({
            where: { slug: dto.slug },
        });
        if (existing) {
            throw new ConflictException(`Course with slug "${dto.slug}" already exists`);
        }

        // Validate categoryId if provided
        if (dto.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
            }
        }

        const course = await this.prisma.course.create({
            data: {
                title: dto.title,
                slug: dto.slug,
                description: dto.description,
                shortDesc: dto.shortDesc,
                thumbnail: dto.thumbnail,
                price: dto.price,
                discountPrice: dto.discountPrice,
                level: dto.level,
                categoryId: dto.categoryId,
                instructorId: userId,
                status: CourseStatus.DRAFT,
            },
        });

        return this.mapToCourseDto(course);
    }

    /**
     * Update an existing course
     * Used for: Instructor/Admin update course
     */
    async update(id: number, dto: UpdateCourseDto, userId: number, userRole: Role): Promise<CourseDto> {
        this.logger.log(`Updating course: ${id} by user: ${userId} (role: ${userRole})`);
        const course = await this.prisma.course.findUnique({ where: { id } });

        if (!course) {
            throw new NotFoundException(`Course with ID ${id} not found`);
        }

        // Check ownership (instructor can only update own courses, admin can update any)
        if (userRole !== Role.ADMIN && course.instructorId !== userId) {
            throw new ForbiddenException('You can only update your own courses');
        }

        // Check slug uniqueness if updating slug
        if (dto.slug && dto.slug !== course.slug) {
            const existing = await this.prisma.course.findUnique({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new ConflictException(`Course with slug "${dto.slug}" already exists`);
            }
        }

        // Validate categoryId if provided
        if (dto.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
            }
        }

        const updated = await this.prisma.course.update({
            where: { id },
            data: {
                title: dto.title,
                slug: dto.slug,
                description: dto.description,
                shortDesc: dto.shortDesc,
                thumbnail: dto.thumbnail,
                price: dto.price,
                discountPrice: dto.discountPrice,
                level: dto.level,
                categoryId: dto.categoryId,
            },
        });

        // Invalidate course detail cache
        await this.cacheManager.del(`${CACHE_KEY_COURSE_DETAIL}:${course.slug}`);
        if (dto.slug && dto.slug !== course.slug) {
            await this.cacheManager.del(`${CACHE_KEY_COURSE_DETAIL}:${dto.slug}`);
        }
        this.logger.log(`Course detail cache invalidated for: ${course.slug}`);

        return this.mapToCourseDto(updated);
    }

    /**
     * Submit course for review (DRAFT -> PENDING)
     * Used for: Instructor submit for admin review
     */
    async submitForReview(id: number, userId: number, userRole: Role): Promise<CourseDto> {
        this.logger.log(`Submitting course ${id} for review by user: ${userId} (role: ${userRole})`);
        const course = await this.prisma.course.findUnique({ where: { id } });

        if (!course) {
            throw new NotFoundException(`Course with ID ${id} not found`);
        }

        // Check ownership
        if (userRole !== Role.ADMIN && course.instructorId !== userId) {
            throw new ForbiddenException('You can only submit your own courses');
        }

        if (course.status !== CourseStatus.DRAFT) {
            throw new ConflictException('Only DRAFT courses can be submitted for review');
        }

        // ADMIN can directly publish, INSTRUCTOR needs approval
        const newStatus = userRole === Role.ADMIN ? CourseStatus.PUBLISHED : CourseStatus.PENDING;
        const publishedAt = userRole === Role.ADMIN ? new Date() : null;

        const updated = await this.prisma.course.update({
            where: { id },
            data: {
                status: newStatus,
                publishedAt,
            },
        });

        // Invalidate featured courses cache when status changes to PUBLISHED
        if (newStatus === CourseStatus.PUBLISHED) {
            await this.invalidateFeaturedCache();
        }

        return this.mapToCourseDto(updated);
    }

    /**
     * Update course status (Admin only)
     * Used for: Admin approve/reject course
     */
    async updateStatus(id: number, status: CourseStatus): Promise<CourseDto> {
        this.logger.log(`Updating course ${id} status to: ${status}`);
        const course = await this.prisma.course.findUnique({ where: { id } });

        if (!course) {
            throw new NotFoundException(`Course with ID ${id} not found`);
        }

        const updateData: any = { status };

        // Set publishedAt when publishing
        if (status === CourseStatus.PUBLISHED && !course.publishedAt) {
            updateData.publishedAt = new Date();
        }

        const updated = await this.prisma.course.update({
            where: { id },
            data: updateData,
        });

        // Invalidate featured courses cache when status changes
        if (status === CourseStatus.PUBLISHED || course.status === CourseStatus.PUBLISHED) {
            await this.invalidateFeaturedCache();
        }

        return this.mapToCourseDto(updated);
    }

    /**
     * Delete a course
     * Used for: Instructor/Admin delete course
     */
    async delete(id: number, userId: number, userRole: Role): Promise<void> {
        this.logger.log(`Deleting course: ${id} by user: ${userId} (role: ${userRole})`);
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                _count: { select: { enrollments: true } },
            },
        });

        if (!course) {
            throw new NotFoundException(`Course with ID ${id} not found`);
        }

        // Check ownership
        if (userRole !== Role.ADMIN && course.instructorId !== userId) {
            throw new ForbiddenException('You can only delete your own courses');
        }

        // Prevent deleting courses with enrollments
        if (course._count.enrollments > 0) {
            throw new ConflictException(
                `Cannot delete course with ${course._count.enrollments} enrollments. Archive the course instead.`
            );
        }

        await this.prisma.course.delete({ where: { id } });

        // Invalidate featured courses cache if was published
        if (course.status === CourseStatus.PUBLISHED) {
            await this.invalidateFeaturedCache();
        }
    }

    // ============ Helper Methods ============

    /**
     * Invalidate featured courses cache
     * Called when courses are published, unpublished, or deleted
     */
    private async invalidateFeaturedCache(): Promise<void> {
        // Delete common featured cache keys (for typical limit values)
        const commonLimits = [3, 6, 10, 12];
        await Promise.all(
            commonLimits.map(limit => this.cacheManager.del(`${CACHE_KEY_FEATURED}:${limit}`))
        );
        this.logger.log('Featured courses cache invalidated');
    }

    private mapToListItem(course: any): CourseListItemDto {
        const avgRating = course.reviews.length > 0
            ? course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / course.reviews.length
            : undefined;

        return {
            id: course.id,
            title: course.title,
            slug: course.slug,
            shortDesc: course.shortDesc ?? undefined,
            thumbnail: course.thumbnail ?? undefined,
            price: Number(course.price),
            discountPrice: course.discountPrice ? Number(course.discountPrice) : undefined,
            level: course.level ?? undefined,
            duration: course.duration,
            status: course.status,
            publishedAt: course.publishedAt ?? undefined,
            instructor: {
                id: course.instructor.id,
                name: course.instructor.name ?? 'Unknown',
                photoURL: course.instructor.photoURL ?? undefined,
            },
            category: course.category
                ? { id: course.category.id, name: course.category.name, slug: course.category.slug }
                : undefined,
            lessonCount: course._count.lessons,
            enrollmentCount: course._count.enrollments,
            reviewCount: course._count.reviews,
            rating: avgRating ? Math.round(avgRating * 10) / 10 : undefined,
        };
    }

    private mapToDetail(course: any): CourseDetailDto {
        const listItem = this.mapToListItem(course);

        return {
            ...listItem,
            description: course.description,
            lessons: course.lessons.map((lesson: any) => ({
                id: lesson.id,
                title: lesson.title,
                slug: lesson.slug,
                order: lesson.order,
                duration: lesson.duration,
                isFree: lesson.isFree,
            })),
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
        };
    }

    private mapToCourseDto(course: any): CourseDto {
        return {
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description,
            shortDesc: course.shortDesc ?? undefined,
            thumbnail: course.thumbnail ?? undefined,
            price: Number(course.price),
            discountPrice: course.discountPrice ? Number(course.discountPrice) : undefined,
            status: course.status,
            level: course.level ?? undefined,
            duration: course.duration,
            instructorId: course.instructorId,
            categoryId: course.categoryId ?? undefined,
            publishedAt: course.publishedAt ?? undefined,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
        };
    }
}
