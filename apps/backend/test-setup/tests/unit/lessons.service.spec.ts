import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { LessonsService } from '../../../src/modules/lessons/lessons.service';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import { Role, LessonType, EnrollmentStatus } from '@prisma/client';

describe('LessonsService', () => {
    let service: LessonsService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockPrismaService = {
        lesson: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            aggregate: jest.fn(),
        },
        course: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        enrollment: {
            findUnique: jest.fn(),
        },
    };

    const mockCourse = {
        id: 1,
        instructorId: 1,
    };

    const mockLesson = {
        id: 1,
        title: 'Lesson 1',
        slug: 'lesson-1',
        description: 'Description',
        type: LessonType.VIDEO,
        content: 'Content',
        order: 0,
        duration: 600,
        isFree: false,
        isPublished: true,
        courseId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        course: mockCourse,
        media: [],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LessonsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<LessonsService>(LessonsService);
        prismaService = module.get(PrismaService);

        jest.clearAllMocks();
    });

    describe('findByCourse', () => {
        it('should return published lessons for anonymous users', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.lesson.findMany.mockResolvedValue([mockLesson]);

            const result = await service.findByCourse(1);

            expect(result).toHaveLength(1);
            expect(mockPrismaService.lesson.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isPublished: true,
                    }),
                }),
            );
        });

        it('should return all lessons for course owner', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.lesson.findMany.mockResolvedValue([mockLesson]);

            await service.findByCourse(1, 1, Role.INSTRUCTOR);

            expect(mockPrismaService.lesson.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.not.objectContaining({
                        isPublished: true,
                    }),
                }),
            );
        });

        it('should throw NotFoundException when course not found', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(null);

            await expect(service.findByCourse(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findBySlug', () => {
        it('should return lesson detail for free lesson', async () => {
            mockPrismaService.lesson.findFirst.mockResolvedValue({
                ...mockLesson,
                isFree: true,
            });

            const result = await service.findBySlug(1, 'lesson-1');

            expect(result.title).toBe('Lesson 1');
        });

        it('should throw ForbiddenException for paid lesson without enrollment', async () => {
            mockPrismaService.lesson.findFirst.mockResolvedValue(mockLesson);
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

            await expect(
                service.findBySlug(1, 'lesson-1', 2, Role.USER),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should return lesson for enrolled user', async () => {
            mockPrismaService.lesson.findFirst.mockResolvedValue(mockLesson);
            mockPrismaService.enrollment.findUnique.mockResolvedValue({
                status: EnrollmentStatus.ACTIVE,
            });

            const result = await service.findBySlug(1, 'lesson-1', 2, Role.USER);

            expect(result.title).toBe('Lesson 1');
        });

        it('should throw NotFoundException when lesson not found', async () => {
            mockPrismaService.lesson.findFirst.mockResolvedValue(null);

            await expect(service.findBySlug(1, 'nonexistent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        const createDto = {
            title: 'New Lesson',
            slug: 'new-lesson',
            description: 'Description',
        };

        it('should create lesson successfully for course owner', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.lesson.findFirst.mockResolvedValueOnce(null); // slug check
            mockPrismaService.lesson.findFirst.mockResolvedValueOnce({ order: 2 }); // last order
            mockPrismaService.lesson.create.mockResolvedValue({
                ...mockLesson,
                ...createDto,
            });
            mockPrismaService.lesson.aggregate.mockResolvedValue({ _sum: { duration: 600 } });
            mockPrismaService.course.update.mockResolvedValue(mockCourse);

            const result = await service.create(1, createDto as any, 1, Role.INSTRUCTOR);

            expect(result.title).toBe('New Lesson');
        });

        it('should throw ForbiddenException for non-owner', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

            await expect(
                service.create(1, createDto as any, 999, Role.INSTRUCTOR),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ConflictException for duplicate slug', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.lesson.findFirst.mockResolvedValue(mockLesson); // slug exists

            await expect(
                service.create(1, createDto as any, 1, Role.INSTRUCTOR),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('should update lesson successfully', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.lesson.update.mockResolvedValue({
                ...mockLesson,
                title: 'Updated',
            });

            const result = await service.update(1, { title: 'Updated' }, 1, Role.INSTRUCTOR);

            expect(result.title).toBe('Updated');
        });

        it('should throw NotFoundException when lesson not found', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(null);

            await expect(
                service.update(999, { title: 'Test' }, 1, Role.INSTRUCTOR),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete lesson successfully', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.lesson.delete.mockResolvedValue(mockLesson);
            mockPrismaService.lesson.aggregate.mockResolvedValue({ _sum: { duration: 0 } });
            mockPrismaService.course.update.mockResolvedValue(mockCourse);

            await service.delete(1, 1, Role.INSTRUCTOR);

            expect(mockPrismaService.lesson.delete).toHaveBeenCalled();
        });

        it('should throw ForbiddenException for non-owner', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

            await expect(service.delete(1, 999, Role.INSTRUCTOR)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('reorder', () => {
        it('should reorder lessons successfully', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.lesson.update.mockResolvedValue(mockLesson);
            mockPrismaService.lesson.findMany.mockResolvedValue([mockLesson]);

            const result = await service.reorder(1, [1, 2, 3], 1, Role.INSTRUCTOR);

            expect(result).toBeDefined();
            expect(mockPrismaService.lesson.update).toHaveBeenCalledTimes(3);
        });
    });
});
