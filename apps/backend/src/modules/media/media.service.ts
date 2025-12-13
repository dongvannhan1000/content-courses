import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { MediaType, Role } from '@prisma/client';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaResponseDto, SignedUrlResponseDto } from './dto/media-response.dto';
import { PresignedUrlRequestDto, PresignedUrlResponseDto } from './dto/presigned-url.dto';
import { randomUUID } from 'crypto';

// Configuration (should come from environment in production)
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || 'https://cdn.example.bunny.net';
const BUNNY_STORAGE_URL = process.env.BUNNY_STORAGE_URL || 'https://storage.bunnycdn.com';
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || 'library-id';
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://r2.example.com';
const R2_BUCKET = process.env.R2_BUCKET || 'media-bucket';

@Injectable()
export class MediaService {
    constructor(private prisma: PrismaService) { }

    // ============ READ Operations ============

    /**
     * Get all media for a lesson
     * Public if lesson is published, owner/admin can see all
     */
    async findByLesson(
        lessonId: number,
        userId?: number,
        userRole?: Role,
    ): Promise<MediaResponseDto[]> {
        // Check if lesson exists and get ownership info
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: { select: { instructorId: true } },
            },
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        // Check access: public only sees published lessons
        const isOwner = userId && lesson.course.instructorId === userId;
        const isAdmin = userRole === Role.ADMIN;

        if (!lesson.isPublished && !isOwner && !isAdmin) {
            throw new NotFoundException('Lesson not found');
        }

        const media = await this.prisma.media.findMany({
            where: { lessonId },
            orderBy: { order: 'asc' },
        });

        return media.map(this.mapToResponse);
    }

    /**
     * Get media by ID
     */
    async findById(id: number): Promise<MediaResponseDto> {
        const media = await this.prisma.media.findUnique({
            where: { id },
        });

        if (!media) {
            throw new NotFoundException('Media not found');
        }

        return this.mapToResponse(media);
    }

    // ============ PRESIGNED URL (Step 1 of Direct Upload) ============

    /**
     * Generate presigned URL for direct upload
     * Only course owner/admin can upload
     */
    async generatePresignedUrl(
        lessonId: number,
        dto: PresignedUrlRequestDto,
        userId: number,
        userRole: Role,
    ): Promise<PresignedUrlResponseDto> {
        // Verify ownership
        await this.verifyLessonOwnership(lessonId, userId, userRole);

        const uuid = randomUUID();
        const extension = dto.filename.split('.').pop() || '';
        const key = `lesson-${lessonId}/${uuid}.${extension}`;

        if (dto.type === MediaType.VIDEO) {
            // Bunny Stream presigned URL (placeholder)
            return {
                uploadUrl: `${BUNNY_STORAGE_URL}/${BUNNY_LIBRARY_ID}/videos/${key}`,
                key,
                publicUrl: `${BUNNY_CDN_URL}/${key}`,
            };
        } else {
            // R2 presigned URL (placeholder)
            return {
                uploadUrl: `${R2_PUBLIC_URL}/${R2_BUCKET}/${key}?presigned=true`,
                key,
                publicUrl: `${R2_PUBLIC_URL}/${key}`,
            };
        }
    }

    // ============ CREATE (Step 2 of Direct Upload OR YouTube Embed) ============

    /**
     * Create media record
     * - For VIDEO/DOCUMENT/IMAGE: after upload to Bunny/R2
     * - For YOUTUBE_EMBED: directly with YouTube URL
     */
    async create(
        lessonId: number,
        dto: CreateMediaDto,
        userId: number,
        userRole: Role,
    ): Promise<MediaResponseDto> {
        // Verify ownership
        await this.verifyLessonOwnership(lessonId, userId, userRole);

        // Get current max order
        const maxOrderMedia = await this.prisma.media.findFirst({
            where: { lessonId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });
        const nextOrder = dto.order ?? (maxOrderMedia ? maxOrderMedia.order + 1 : 0);

        // Build URL based on media type
        let url: string;
        if (dto.type === MediaType.YOUTUBE_EMBED) {
            // YouTube: convert to embed URL format
            url = this.normalizeYoutubeUrl(dto.youtubeUrl!);
        } else if (dto.type === MediaType.VIDEO) {
            url = `${BUNNY_CDN_URL}/${dto.key}`;
        } else {
            url = `${R2_PUBLIC_URL}/${dto.key}`;
        }

        const media = await this.prisma.media.create({
            data: {
                type: dto.type,
                url,
                title: dto.title,
                filename: dto.filename,
                mimeType: dto.mimeType,
                size: dto.size,
                duration: dto.duration,
                order: nextOrder,
                lessonId,
            },
        });

        // Update lesson duration if video (not YouTube, since duration may not be accurate)
        if (dto.type === MediaType.VIDEO && dto.duration) {
            await this.updateLessonDuration(lessonId);
        }

        return this.mapToResponse(media);
    }

    /**
     * Normalize YouTube URL to embed format
     * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
     */
    private normalizeYoutubeUrl(url: string): string {
        let videoId: string | null = null;

        // Match youtube.com/watch?v=ID
        const watchMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
        if (watchMatch) videoId = watchMatch[1];

        // Match youtu.be/ID
        const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
        if (shortMatch) videoId = shortMatch[1];

        // Match youtube.com/embed/ID
        const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)/);
        if (embedMatch) videoId = embedMatch[1];

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }

        // Fallback: return as-is
        return url;
    }

    // ============ UPDATE ============

    /**
     * Update media metadata
     */
    async update(
        mediaId: number,
        dto: UpdateMediaDto,
        userId: number,
        userRole: Role,
    ): Promise<MediaResponseDto> {
        const media = await this.prisma.media.findUnique({
            where: { id: mediaId },
            include: {
                lesson: {
                    select: {
                        id: true,
                        course: { select: { instructorId: true } },
                    },
                },
            },
        });

        if (!media) {
            throw new NotFoundException('Media not found');
        }

        // Verify ownership
        await this.verifyLessonOwnership(media.lessonId, userId, userRole);

        const updated = await this.prisma.media.update({
            where: { id: mediaId },
            data: {
                title: dto.title,
                order: dto.order,
                duration: dto.duration,
            },
        });

        // Update lesson duration if duration changed
        if (dto.duration !== undefined && media.type === MediaType.VIDEO) {
            await this.updateLessonDuration(media.lessonId);
        }

        return this.mapToResponse(updated);
    }

    // ============ DELETE ============

    /**
     * Delete media (also deletes from storage)
     */
    async delete(
        mediaId: number,
        userId: number,
        userRole: Role,
    ): Promise<void> {
        const media = await this.prisma.media.findUnique({
            where: { id: mediaId },
            include: {
                lesson: {
                    select: {
                        id: true,
                        course: { select: { instructorId: true } },
                    },
                },
            },
        });

        if (!media) {
            throw new NotFoundException('Media not found');
        }

        // Verify ownership
        await this.verifyLessonOwnership(media.lessonId, userId, userRole);

        // Delete from storage (placeholder - implement actual deletion)
        await this.deleteFromStorage(media.url, media.type);

        // Delete from database
        await this.prisma.media.delete({ where: { id: mediaId } });

        // Update lesson duration
        if (media.type === MediaType.VIDEO) {
            await this.updateLessonDuration(media.lessonId);
        }
    }

    // ============ REORDER ============

    /**
     * Reorder media within a lesson
     */
    async reorder(
        lessonId: number,
        mediaIds: number[],
        userId: number,
        userRole: Role,
    ): Promise<MediaResponseDto[]> {
        // Verify ownership
        await this.verifyLessonOwnership(lessonId, userId, userRole);

        // Verify all media belong to this lesson
        const existingMedia = await this.prisma.media.findMany({
            where: { lessonId },
            select: { id: true },
        });
        const existingIds = new Set(existingMedia.map(m => m.id));

        for (const id of mediaIds) {
            if (!existingIds.has(id)) {
                throw new BadRequestException(`Media ${id} does not belong to this lesson`);
            }
        }

        // Update order for each media
        await Promise.all(
            mediaIds.map((id, index) =>
                this.prisma.media.update({
                    where: { id },
                    data: { order: index },
                }),
            ),
        );

        return this.findByLesson(lessonId, userId, userRole);
    }

    // ============ SIGNED URL (for private content) ============

    /**
     * Generate signed URL for private content viewing
     * Only enrolled users or owner can get signed URL
     */
    async generateSignedUrl(
        mediaId: number,
        userId?: number,
        userRole?: Role,
    ): Promise<SignedUrlResponseDto> {
        const media = await this.prisma.media.findUnique({
            where: { id: mediaId },
            include: {
                lesson: {
                    select: {
                        id: true,
                        isFree: true,
                        course: {
                            select: {
                                id: true,
                                instructorId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!media) {
            throw new NotFoundException('Media not found');
        }

        const lesson = media.lesson;
        const isOwner = userId && lesson.course.instructorId === userId;
        const isAdmin = userRole === Role.ADMIN;

        // Check access for non-free lessons
        if (!lesson.isFree && !isOwner && !isAdmin) {
            // Check enrollment
            if (!userId) {
                throw new ForbiddenException('Authentication required');
            }

            const enrollment = await this.prisma.enrollment.findFirst({
                where: {
                    userId,
                    courseId: lesson.course.id,
                    status: 'ACTIVE',
                },
            });

            if (!enrollment) {
                throw new ForbiddenException('Enrollment required to view this content');
            }
        }

        // Generate signed URL (placeholder - implement actual signing)
        const expiresIn = 3600; // 1 hour
        const timestamp = Math.floor(Date.now() / 1000) + expiresIn;

        return {
            signedUrl: `${media.url}?token=signed&expires=${timestamp}`,
            expiresIn,
        };
    }

    // ============ HELPER METHODS ============

    /**
     * Verify lesson ownership through lesson -> course -> instructor
     */
    private async verifyLessonOwnership(
        lessonId: number,
        userId: number,
        userRole: Role,
    ): Promise<void> {
        // Admin can do anything
        if (userRole === Role.ADMIN) return;

        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: { select: { instructorId: true } },
            },
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        if (lesson.course.instructorId !== userId) {
            throw new ForbiddenException('You are not the owner of this course');
        }
    }

    /**
     * Update lesson total duration based on video media
     */
    private async updateLessonDuration(lessonId: number): Promise<void> {
        const mediaList = await this.prisma.media.findMany({
            where: {
                lessonId,
                type: MediaType.VIDEO,
            },
            select: { duration: true },
        });

        const totalDuration = mediaList.reduce(
            (sum, m) => sum + (m.duration || 0),
            0,
        );

        await this.prisma.lesson.update({
            where: { id: lessonId },
            data: { duration: totalDuration },
        });
    }

    /**
     * Delete file from storage (placeholder)
     */
    private async deleteFromStorage(url: string, type: MediaType): Promise<void> {
        // TODO: Implement actual deletion from Bunny Stream / R2
        console.log(`[Placeholder] Deleting ${type} from storage: ${url}`);

        if (type === MediaType.VIDEO) {
            // Bunny Stream deletion
            // await this.deleteBunnyVideo(url);
        } else {
            // R2 deletion
            // await this.deleteR2Object(url);
        }
    }

    /**
     * Map database entity to response DTO
     */
    private mapToResponse(media: any): MediaResponseDto {
        return {
            id: media.id,
            type: media.type,
            title: media.title,
            url: media.url,
            filename: media.filename,
            mimeType: media.mimeType,
            size: media.size,
            duration: media.duration,
            order: media.order,
            lessonId: media.lessonId,
            createdAt: media.createdAt,
            updatedAt: media.updatedAt,
        };
    }
}
