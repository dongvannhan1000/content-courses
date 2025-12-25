import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MediaService } from '../../../src/modules/media/media.service';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import { MediaType, Role } from '@prisma/client';

describe('MediaService', () => {
    let service: MediaService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockPrismaService = {
        media: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        lesson: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        enrollment: {
            findFirst: jest.fn(),
        },
    };

    const mockLesson = {
        id: 1,
        isFree: false,
        isPublished: true,
        course: { id: 1, instructorId: 1 },
    };

    const mockMedia = {
        id: 1,
        type: MediaType.VIDEO,
        title: 'Test Video',
        url: 'https://cdn.example.com/video.mp4',
        filename: 'video.mp4',
        mimeType: 'video/mp4',
        size: 1000000,
        duration: 600,
        order: 0,
        lessonId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lesson: mockLesson,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MediaService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<MediaService>(MediaService);
        prismaService = module.get(PrismaService);

        jest.clearAllMocks();
    });

    describe('findByLesson', () => {
        it('should return media for published lesson', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrismaService.media.findMany.mockResolvedValue([mockMedia]);

            const result = await service.findByLesson(1);

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe(MediaType.VIDEO);
        });

        it('should throw NotFoundException for unpublished lesson for non-owner', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue({
                ...mockLesson,
                isPublished: false,
            });

            await expect(service.findByLesson(1, 2, Role.USER)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should allow owner to access unpublished lesson media', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue({
                ...mockLesson,
                isPublished: false,
            });
            mockPrismaService.media.findMany.mockResolvedValue([mockMedia]);

            const result = await service.findByLesson(1, 1, Role.INSTRUCTOR);

            expect(result).toHaveLength(1);
        });
    });

    describe('findById', () => {
        it('should return media by ID', async () => {
            mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);

            const result = await service.findById(1);

            expect(result.id).toBe(1);
        });

        it('should throw NotFoundException when not found', async () => {
            mockPrismaService.media.findUnique.mockResolvedValue(null);

            await expect(service.findById(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('generatePresignedUrl', () => {
        it('should generate presigned URL for video', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);

            const result = await service.generatePresignedUrl(
                1,
                { filename: 'test.mp4', type: MediaType.VIDEO },
                1,
                Role.INSTRUCTOR,
            );

            expect(result.uploadUrl).toBeDefined();
            expect(result.key).toContain('lesson-1');
        });

        it('should throw ForbiddenException for non-owner', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);

            await expect(
                service.generatePresignedUrl(
                    1,
                    { filename: 'test.mp4', type: MediaType.VIDEO },
                    999,
                    Role.INSTRUCTOR,
                ),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('create', () => {
        it('should create media record successfully', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrismaService.media.findFirst.mockResolvedValue(null); // no existing media
            mockPrismaService.media.create.mockResolvedValue(mockMedia);

            const result = await service.create(
                1,
                {
                    type: MediaType.VIDEO,
                    key: 'lesson-1/video.mp4',
                    filename: 'video.mp4',
                } as any,
                1,
                Role.INSTRUCTOR,
            );

            expect(result.type).toBe(MediaType.VIDEO);
        });

        it('should create YouTube embed with normalized URL', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrismaService.media.findFirst.mockResolvedValue(null);
            mockPrismaService.media.create.mockResolvedValue({
                ...mockMedia,
                type: MediaType.YOUTUBE_EMBED,
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            });

            const result = await service.create(
                1,
                {
                    type: MediaType.YOUTUBE_EMBED,
                    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                } as any,
                1,
                Role.INSTRUCTOR,
            );

            expect(result.type).toBe(MediaType.YOUTUBE_EMBED);
        });
    });

    describe('update', () => {
        it('should update media successfully', async () => {
            mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrismaService.media.update.mockResolvedValue({
                ...mockMedia,
                title: 'Updated Title',
            });

            const result = await service.update(1, { title: 'Updated Title' }, 1, Role.INSTRUCTOR);

            expect(result.title).toBe('Updated Title');
        });

        it('should throw NotFoundException when media not found', async () => {
            mockPrismaService.media.findUnique.mockResolvedValue(null);

            await expect(
                service.update(999, { title: 'Test' }, 1, Role.INSTRUCTOR),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete media successfully', async () => {
            mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrismaService.media.delete.mockResolvedValue(mockMedia);
            mockPrismaService.media.findMany.mockResolvedValue([]);
            mockPrismaService.lesson.update.mockResolvedValue(mockLesson);

            await service.delete(1, 1, Role.INSTRUCTOR);

            expect(mockPrismaService.media.delete).toHaveBeenCalled();
        });
    });

    describe('reorder', () => {
        it('should reorder media successfully', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrismaService.media.findMany.mockResolvedValue([
                { id: 1 },
                { id: 2 },
            ]);
            mockPrismaService.media.update.mockResolvedValue(mockMedia);

            const result = await service.reorder(1, [2, 1], 1, Role.INSTRUCTOR);

            expect(mockPrismaService.media.update).toHaveBeenCalledTimes(2);
        });

        it('should throw BadRequestException for invalid media IDs', async () => {
            mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrismaService.media.findMany.mockResolvedValue([{ id: 1 }]);

            await expect(
                service.reorder(1, [1, 999], 1, Role.INSTRUCTOR),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('generateSignedUrl', () => {
        it('should generate signed URL for enrolled user', async () => {
            mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);
            mockPrismaService.enrollment.findFirst.mockResolvedValue({ status: 'ACTIVE' });

            const result = await service.generateSignedUrl(1, 2, Role.USER);

            expect(result.signedUrl).toContain('token=signed');
            expect(result.expiresIn).toBe(3600);
        });

        it('should throw ForbiddenException for unenrolled user', async () => {
            mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);
            mockPrismaService.enrollment.findFirst.mockResolvedValue(null);

            await expect(
                service.generateSignedUrl(1, 2, Role.USER),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should allow owner without enrollment', async () => {
            mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);

            const result = await service.generateSignedUrl(1, 1, Role.INSTRUCTOR);

            expect(result.signedUrl).toBeDefined();
        });
    });
});
