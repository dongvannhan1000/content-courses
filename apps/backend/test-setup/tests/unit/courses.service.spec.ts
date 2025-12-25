import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { CoursesService } from '../../../src/modules/courses/courses.service';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import { CourseStatus, Role } from '@prisma/client';

describe('CoursesService', () => {
    let service: CoursesService;
    let prismaService: jest.Mocked<PrismaService>;
    let cacheManager: jest.Mocked<any>;

    const mockPrismaService = {
        course: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        category: {
            findUnique: jest.fn(),
        },
    };

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    const mockCourse = {
        id: 1,
        title: 'JavaScript Basics',
        slug: 'javascript-basics',
        description: 'Learn JavaScript from scratch',
        shortDesc: 'JS basics',
        thumbnail: 'https://example.com/thumb.jpg',
        price: 100000,
        discountPrice: 80000,
        status: CourseStatus.PUBLISHED,
        level: 'Beginner',
        duration: 3600,
        instructorId: 1,
        categoryId: 1,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        instructor: { id: 1, name: 'Instructor', photoURL: null },
        category: { id: 1, name: 'Programming', slug: 'programming' },
        _count: { lessons: 10, enrollments: 50, reviews: 20 },
        reviews: [{ rating: 5 }, { rating: 4 }],
        lessons: [
            { id: 1, title: 'Intro', slug: 'intro', order: 1, duration: 600, isFree: true },
        ],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CoursesService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        service = module.get<CoursesService>(CoursesService);
        prismaService = module.get(PrismaService);
        cacheManager = module.get(CACHE_MANAGER);

        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return paginated courses with filters', async () => {
            mockPrismaService.course.count.mockResolvedValue(25);
            mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(25);
            expect(result.totalPages).toBe(3);
            expect(mockPrismaService.course.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: CourseStatus.PUBLISHED,
                    }),
                }),
            );
        });

        it('should filter by category slug', async () => {
            mockPrismaService.course.count.mockResolvedValue(5);
            mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

            await service.findAll({ category: 'programming' });

            expect(mockPrismaService.course.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        category: { slug: 'programming' },
                    }),
                }),
            );
        });

        it('should filter by price range', async () => {
            mockPrismaService.course.count.mockResolvedValue(3);
            mockPrismaService.course.findMany.mockResolvedValue([]);

            await service.findAll({ minPrice: 50000, maxPrice: 150000 });

            expect(mockPrismaService.course.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        price: { gte: 50000, lte: 150000 },
                    }),
                }),
            );
        });

        it('should search by title and description', async () => {
            mockPrismaService.course.count.mockResolvedValue(2);
            mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

            await service.findAll({ search: 'javascript' });

            expect(mockPrismaService.course.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            { title: { contains: 'javascript', mode: 'insensitive' } },
                        ]),
                    }),
                }),
            );
        });
    });

    describe('findFeatured', () => {
        it('should return cached featured courses if available', async () => {
            const cachedCourses = [{ id: 1, title: 'Cached' }];
            mockCacheManager.get.mockResolvedValue(cachedCourses);

            const result = await service.findFeatured(6);

            expect(result).toEqual(cachedCourses);
            expect(mockPrismaService.course.findMany).not.toHaveBeenCalled();
        });

        it('should fetch from database and cache when not cached', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

            const result = await service.findFeatured(6);

            expect(result).toHaveLength(1);
            expect(mockCacheManager.set).toHaveBeenCalled();
        });
    });

    describe('findBySlug', () => {
        it('should return course detail from cache if available', async () => {
            const cachedCourse = { id: 1, title: 'Cached Course' };
            mockCacheManager.get.mockResolvedValue(cachedCourse);

            const result = await service.findBySlug('javascript-basics');

            expect(result).toEqual(cachedCourse);
        });

        it('should fetch from database when not cached', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

            const result = await service.findBySlug('javascript-basics');

            expect(result.id).toBe(1);
            expect(result.title).toBe('JavaScript Basics');
            expect(mockCacheManager.set).toHaveBeenCalled();
        });

        it('should throw NotFoundException when course not found', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.course.findUnique.mockResolvedValue(null);

            await expect(service.findBySlug('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw NotFoundException for non-published courses', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                status: CourseStatus.DRAFT,
            });

            await expect(service.findBySlug('draft-course')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        const createDto = {
            title: 'New Course',
            slug: 'new-course',
            description: 'A new course',
            price: 50000,
        };

        it('should create a new course successfully', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(null);
            mockPrismaService.course.create.mockResolvedValue({
                id: 1,
                ...createDto,
                status: CourseStatus.DRAFT,
                instructorId: 1,
            });

            const result = await service.create(createDto as any, 1, Role.INSTRUCTOR);

            expect(result.title).toBe('New Course');
            expect(result.status).toBe(CourseStatus.DRAFT);
        });

        it('should throw ConflictException when slug exists', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({ id: 99 });

            await expect(
                service.create(createDto as any, 1, Role.INSTRUCTOR),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw NotFoundException when categoryId not found', async () => {
            const dtoWithCategory = { ...createDto, categoryId: 999 };
            mockPrismaService.course.findUnique.mockResolvedValue(null);
            mockPrismaService.category.findUnique.mockResolvedValue(null);

            await expect(
                service.create(dtoWithCategory as any, 1, Role.INSTRUCTOR),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update course successfully for owner', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.course.update.mockResolvedValue({
                ...mockCourse,
                title: 'Updated Title',
            });

            const result = await service.update(
                1,
                { title: 'Updated Title' },
                1, // same as instructorId
                Role.INSTRUCTOR,
            );

            expect(result.title).toBe('Updated Title');
            expect(mockCacheManager.del).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when non-owner tries to update', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                instructorId: 1,
            });

            await expect(
                service.update(1, { title: 'Hacked' }, 999, Role.INSTRUCTOR),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should allow admin to update any course', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.course.update.mockResolvedValue(mockCourse);

            await expect(
                service.update(1, { title: 'Admin Update' }, 999, Role.ADMIN),
            ).resolves.toBeDefined();
        });

        it('should throw NotFoundException when course not found', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(null);

            await expect(
                service.update(999, { title: 'Test' }, 1, Role.INSTRUCTOR),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('submitForReview', () => {
        it('should submit DRAFT course for review (INSTRUCTOR -> PENDING)', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                status: CourseStatus.DRAFT,
                instructorId: 1,
            });
            mockPrismaService.course.update.mockResolvedValue({
                ...mockCourse,
                status: CourseStatus.PENDING,
            });

            const result = await service.submitForReview(1, 1, Role.INSTRUCTOR);

            expect(result.status).toBe(CourseStatus.PENDING);
        });

        it('should directly publish when ADMIN submits (DRAFT -> PUBLISHED)', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                status: CourseStatus.DRAFT,
            });
            mockPrismaService.course.update.mockResolvedValue({
                ...mockCourse,
                status: CourseStatus.PUBLISHED,
            });

            const result = await service.submitForReview(1, 1, Role.ADMIN);

            expect(result.status).toBe(CourseStatus.PUBLISHED);
        });

        it('should throw ConflictException for non-DRAFT courses', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                status: CourseStatus.PUBLISHED,
                instructorId: 1,
            });

            await expect(
                service.submitForReview(1, 1, Role.INSTRUCTOR),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('delete', () => {
        it('should delete course successfully when no enrollments', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                instructorId: 1,
                _count: { enrollments: 0 },
            });
            mockPrismaService.course.delete.mockResolvedValue(mockCourse);

            await service.delete(1, 1, Role.INSTRUCTOR);

            expect(mockPrismaService.course.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it('should throw ConflictException when course has enrollments', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                instructorId: 1,
                _count: { enrollments: 10 },
            });

            await expect(service.delete(1, 1, Role.INSTRUCTOR)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw ForbiddenException when non-owner tries to delete', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                instructorId: 1,
                _count: { enrollments: 0 },
            });

            await expect(service.delete(1, 999, Role.INSTRUCTOR)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should allow admin to delete any course', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                instructorId: 1,
                _count: { enrollments: 0 },
            });
            mockPrismaService.course.delete.mockResolvedValue(mockCourse);

            await expect(service.delete(1, 999, Role.ADMIN)).resolves.toBeUndefined();
        });
    });

    describe('updateStatus (Admin)', () => {
        it('should update course status to PUBLISHED', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                status: CourseStatus.PENDING,
                publishedAt: null,
            });
            mockPrismaService.course.update.mockResolvedValue({
                ...mockCourse,
                status: CourseStatus.PUBLISHED,
            });

            const result = await service.updateStatus(1, CourseStatus.PUBLISHED);

            expect(result.status).toBe(CourseStatus.PUBLISHED);
        });

        it('should throw NotFoundException when course not found', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(null);

            await expect(
                service.updateStatus(999, CourseStatus.PUBLISHED),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
