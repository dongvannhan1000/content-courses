import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { EnrollmentsService } from '../../../src/modules/enrollments/enrollments.service';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import { EnrollmentStatus } from '@prisma/client';

describe('EnrollmentsService', () => {
    let service: EnrollmentsService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockPrismaService = {
        enrollment: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        course: {
            findUnique: jest.fn(),
        },
    };

    const mockCourse = {
        id: 1,
        title: 'Test Course',
        slug: 'test-course',
        thumbnail: 'https://example.com/thumb.jpg',
        status: 'PUBLISHED',
        instructor: { id: 1, name: 'Instructor' },
    };

    const mockEnrollment = {
        id: 1,
        userId: 1,
        courseId: 1,
        status: EnrollmentStatus.ACTIVE,
        progressPercent: 50,
        enrolledAt: new Date(),
        expiresAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        course: mockCourse,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EnrollmentsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<EnrollmentsService>(EnrollmentsService);
        prismaService = module.get(PrismaService);

        jest.clearAllMocks();
    });

    describe('findByUser', () => {
        it('should return all enrollments for a user', async () => {
            mockPrismaService.enrollment.findMany.mockResolvedValue([mockEnrollment]);

            const result = await service.findByUser(1);

            expect(result).toHaveLength(1);
            expect(result[0].course.title).toBe('Test Course');
            expect(mockPrismaService.enrollment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 1 },
                }),
            );
        });

        it('should return empty array when user has no enrollments', async () => {
            mockPrismaService.enrollment.findMany.mockResolvedValue([]);

            const result = await service.findByUser(1);

            expect(result).toHaveLength(0);
        });
    });

    describe('checkEnrollment', () => {
        it('should return enrolled: true with details when enrolled', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);

            const result = await service.checkEnrollment(1, 1);

            expect(result.enrolled).toBe(true);
            expect(result.status).toBe(EnrollmentStatus.ACTIVE);
            expect(result.progressPercent).toBe(50);
        });

        it('should return enrolled: false when not enrolled', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

            const result = await service.checkEnrollment(1, 999);

            expect(result.enrolled).toBe(false);
            expect(result.status).toBeUndefined();
        });
    });

    describe('isEnrolled', () => {
        it('should return true when user is actively enrolled', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);

            const result = await service.isEnrolled(1, 1);

            expect(result).toBe(true);
        });

        it('should return false when enrollment is not ACTIVE', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue({
                ...mockEnrollment,
                status: EnrollmentStatus.EXPIRED,
            });

            const result = await service.isEnrolled(1, 1);

            expect(result).toBe(false);
        });

        it('should return false when not enrolled', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

            const result = await service.isEnrolled(1, 999);

            expect(result).toBe(false);
        });
    });

    describe('create', () => {
        it('should create enrollment successfully', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
            mockPrismaService.enrollment.create.mockResolvedValue(mockEnrollment);

            const result = await service.create(1, 1);

            expect(result.status).toBe(EnrollmentStatus.ACTIVE);
            expect(mockPrismaService.enrollment.create).toHaveBeenCalled();
        });

        it('should throw NotFoundException when course not found', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(null);

            await expect(service.create(1, 999)).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException for unpublished course', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue({
                ...mockCourse,
                status: 'DRAFT',
            });

            await expect(service.create(1, 1)).rejects.toThrow(ForbiddenException);
        });

        it('should throw ConflictException when already enrolled', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);

            await expect(service.create(1, 1)).rejects.toThrow(ConflictException);
        });
    });

    describe('updateProgress', () => {
        it('should update progress successfully for owner', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.enrollment.update.mockResolvedValue({
                ...mockEnrollment,
                progressPercent: 75,
            });

            const result = await service.updateProgress(1, 1, 75);

            expect(result.progressPercent).toBe(75);
        });

        it('should throw NotFoundException when enrollment not found', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

            await expect(service.updateProgress(999, 1, 75)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException when not owner', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);

            await expect(service.updateProgress(1, 999, 75)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw ForbiddenException for non-active enrollment', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue({
                ...mockEnrollment,
                status: EnrollmentStatus.COMPLETED,
            });

            await expect(service.updateProgress(1, 1, 75)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('markComplete', () => {
        it('should mark enrollment as complete for owner', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.enrollment.update.mockResolvedValue({
                ...mockEnrollment,
                status: EnrollmentStatus.COMPLETED,
                completedAt: new Date(),
                progressPercent: 100,
            });

            const result = await service.markComplete(1, 1);

            expect(result.status).toBe(EnrollmentStatus.COMPLETED);
        });

        it('should throw ForbiddenException when not owner', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);

            await expect(service.markComplete(1, 999)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('findAll (Admin)', () => {
        it('should return paginated enrollments', async () => {
            mockPrismaService.enrollment.findMany.mockResolvedValue([mockEnrollment]);
            mockPrismaService.enrollment.count.mockResolvedValue(25);

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.enrollments).toHaveLength(1);
            expect(result.total).toBe(25);
            expect(result.totalPages).toBe(3);
        });

        it('should filter by status', async () => {
            mockPrismaService.enrollment.findMany.mockResolvedValue([]);
            mockPrismaService.enrollment.count.mockResolvedValue(0);

            await service.findAll({ status: EnrollmentStatus.ACTIVE });

            expect(mockPrismaService.enrollment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: EnrollmentStatus.ACTIVE,
                    }),
                }),
            );
        });
    });

    describe('findById', () => {
        it('should return enrollment by ID', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);

            const result = await service.findById(1);

            expect(result.id).toBe(1);
        });

        it('should throw NotFoundException when not found', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

            await expect(service.findById(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('adminUpdate', () => {
        it('should update enrollment status successfully', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.enrollment.update.mockResolvedValue({
                ...mockEnrollment,
                status: EnrollmentStatus.EXPIRED,
            });

            const result = await service.adminUpdate(1, {
                status: EnrollmentStatus.EXPIRED,
            });

            expect(result.status).toBe(EnrollmentStatus.EXPIRED);
        });

        it('should set completedAt and progressPercent when marking COMPLETED', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.enrollment.update.mockResolvedValue({
                ...mockEnrollment,
                status: EnrollmentStatus.COMPLETED,
                completedAt: new Date(),
                progressPercent: 100,
            });

            await service.adminUpdate(1, { status: EnrollmentStatus.COMPLETED });

            expect(mockPrismaService.enrollment.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: EnrollmentStatus.COMPLETED,
                        completedAt: expect.any(Date),
                        progressPercent: 100,
                    }),
                }),
            );
        });

        it('should throw NotFoundException when not found', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

            await expect(
                service.adminUpdate(999, { status: EnrollmentStatus.ACTIVE }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete enrollment successfully', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
            mockPrismaService.enrollment.delete.mockResolvedValue(mockEnrollment);

            await service.delete(1);

            expect(mockPrismaService.enrollment.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it('should throw NotFoundException when not found', async () => {
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

            await expect(service.delete(999)).rejects.toThrow(NotFoundException);
        });
    });
});
