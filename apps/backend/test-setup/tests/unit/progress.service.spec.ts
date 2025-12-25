import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProgressService } from '../../../src/modules/progress/progress.service';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import { EnrollmentStatus } from '@prisma/client';

describe('ProgressService', () => {
    let service: ProgressService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockPrismaService = {
        progress: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            count: jest.fn(),
        },
        lesson: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        enrollment: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockEnrollment = {
        userId: 1,
        courseId: 1,
        status: EnrollmentStatus.ACTIVE,
    };

    const mockLesson = {
        id: 1,
        courseId: 1,
        title: 'Lesson 1',
        order: 1,
        isPublished: true,
    };

    const mockProgress = {
        id: 1,
        userId: 1,
        lessonId: 1,
        isCompleted: false,
        watchedSeconds: 120,
        lastPosition: 120,
        completedAt: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProgressService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<ProgressService>(ProgressService);
        prismaService = module.get(PrismaService);

        jest.clearAllMocks();
    });

    describe('getByLesson', () => {
        it('should return lesson progress when exists', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.lesson.findFirst.mockResolvedValue(mockLesson);
            mockPrismaService.progress.findUnique.mockResolvedValue(mockProgress);

            const result = await service.getByLesson(1, 1, 1);

            expect(result.watchedSeconds).toBe(120);
            expect(result.isCompleted).toBe(false);
        });

        it('should return default progress when no record exists', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.lesson.findFirst.mockResolvedValue(mockLesson);
            mockPrismaService.progress.findUnique.mockResolvedValue(null);

            const result = await service.getByLesson(1, 1, 1);

            expect(result.id).toBe(0);
            expect(result.isCompleted).toBe(false);
            expect(result.watchedSeconds).toBe(0);
        });

        it('should throw ForbiddenException when not enrolled', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

            await expect(service.getByLesson(1, 1, 1)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw NotFoundException when lesson not found', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.lesson.findFirst.mockResolvedValue(null);

            await expect(service.getByLesson(1, 1, 999)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('updateProgress', () => {
        it('should update progress successfully', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.lesson.findFirst.mockResolvedValue(mockLesson);
            mockPrismaService.progress.upsert.mockResolvedValue({
                ...mockProgress,
                watchedSeconds: 300,
                lastPosition: 300,
            });

            const result = await service.updateProgress(1, 1, 1, {
                watchedSeconds: 300,
                lastPosition: 300,
            });

            expect(result.watchedSeconds).toBe(300);
        });

        it('should throw ForbiddenException when enrollment is not active', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue({
                ...mockEnrollment,
                status: EnrollmentStatus.EXPIRED,
            });

            await expect(
                service.updateProgress(1, 1, 1, { watchedSeconds: 100 }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('markComplete', () => {
        it('should mark lesson as complete', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.lesson.findFirst.mockResolvedValue(mockLesson);
            mockPrismaService.progress.upsert.mockResolvedValue({
                ...mockProgress,
                isCompleted: true,
                completedAt: new Date(),
            });
            mockPrismaService.lesson.count.mockResolvedValue(5);
            mockPrismaService.progress.count.mockResolvedValue(1);
            mockPrismaService.enrollment.update.mockResolvedValue(mockEnrollment);

            const result = await service.markComplete(1, 1, 1);

            expect(result.isCompleted).toBe(true);
            expect(mockPrismaService.enrollment.update).toHaveBeenCalled();
        });

        it('should auto-complete enrollment when all lessons done', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.lesson.findFirst.mockResolvedValue(mockLesson);
            mockPrismaService.progress.upsert.mockResolvedValue({
                ...mockProgress,
                isCompleted: true,
            });
            mockPrismaService.lesson.count.mockResolvedValue(5);
            mockPrismaService.progress.count.mockResolvedValue(5); // All 5 completed
            mockPrismaService.enrollment.update.mockResolvedValue({
                ...mockEnrollment,
                status: EnrollmentStatus.COMPLETED,
            });

            await service.markComplete(1, 1, 1);

            expect(mockPrismaService.enrollment.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: EnrollmentStatus.COMPLETED,
                        progressPercent: 100,
                    }),
                }),
            );
        });

        it('should throw NotFoundException for unpublished lesson', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.lesson.findFirst.mockResolvedValue(null);

            await expect(service.markComplete(1, 1, 1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getCourseProgress', () => {
        it('should return course progress summary', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.lesson.findMany.mockResolvedValue([
                { id: 1, title: 'L1', order: 1, progress: [{ isCompleted: true }] },
                { id: 2, title: 'L2', order: 2, progress: [{ isCompleted: false }] },
                { id: 3, title: 'L3', order: 3, progress: [] },
            ]);

            const result = await service.getCourseProgress(1, 1);

            expect(result.totalLessons).toBe(3);
            expect(result.completedLessons).toBe(1);
            expect(result.progressPercent).toBe(33);
            expect(result.lessons).toHaveLength(3);
        });

        it('should return 0% when no lessons completed', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.lesson.findMany.mockResolvedValue([
                { id: 1, title: 'L1', order: 1, progress: [] },
            ]);

            const result = await service.getCourseProgress(1, 1);

            expect(result.progressPercent).toBe(0);
        });

        it('should return 0% when no lessons', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.lesson.findMany.mockResolvedValue([]);

            const result = await service.getCourseProgress(1, 1);

            expect(result.totalLessons).toBe(0);
            expect(result.progressPercent).toBe(0);
        });
    });
});
