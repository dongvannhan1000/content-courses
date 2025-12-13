import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType } from '@prisma/client';

// ============ Media Reference DTO ============

/**
 * Media info for lesson content
 */
export class MediaDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ enum: ['VIDEO', 'DOCUMENT', 'IMAGE'] })
    type!: string;

    @ApiPropertyOptional({ example: 'Video bài giảng' })
    title?: string;

    @ApiProperty({ example: 'https://example.com/video.mp4' })
    url!: string;

    @ApiPropertyOptional({ example: 'video.mp4' })
    filename?: string;

    @ApiPropertyOptional({ example: 'video/mp4' })
    mimeType?: string;

    @ApiPropertyOptional({ example: 1024000 })
    size?: number;

    @ApiPropertyOptional({ example: 600, description: 'Duration in seconds' })
    duration?: number;

    @ApiProperty({ example: 0 })
    order!: number;
}

// ============ Lesson DTOs ============

/**
 * DTO for lesson listing (GET /courses/:courseId/lessons)
 * No content, just metadata for course detail page
 */
export class LessonListItemDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Giới thiệu khóa học' })
    title!: string;

    @ApiProperty({ example: 'gioi-thieu-khoa-hoc' })
    slug!: string;

    @ApiPropertyOptional({ example: 'Tổng quan về những gì bạn sẽ học' })
    description?: string;

    @ApiProperty({ enum: LessonType, example: 'VIDEO' })
    type!: LessonType;

    @ApiProperty({ example: 1 })
    order!: number;

    @ApiProperty({ example: 600, description: 'Duration in seconds' })
    duration!: number;

    @ApiProperty({ example: true })
    isFree!: boolean;

    @ApiProperty({ example: true })
    isPublished!: boolean;
}

/**
 * DTO for lesson detail (GET /courses/:courseId/lessons/:slug)
 * Includes content and media (only for enrolled users or free lessons)
 */
export class LessonDetailDto extends LessonListItemDto {
    @ApiPropertyOptional({ example: '<p>Nội dung bài học...</p>' })
    content?: string;

    @ApiProperty({ type: [MediaDto] })
    media!: MediaDto[];

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

/**
 * DTO for lesson management (CREATE/UPDATE response)
 */
export class LessonDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Giới thiệu khóa học' })
    title!: string;

    @ApiProperty({ example: 'gioi-thieu-khoa-hoc' })
    slug!: string;

    @ApiPropertyOptional({ example: 'Tổng quan về những gì bạn sẽ học' })
    description?: string;

    @ApiProperty({ enum: LessonType, example: 'VIDEO' })
    type!: LessonType;

    @ApiPropertyOptional({ example: '<p>Nội dung bài học...</p>' })
    content?: string;

    @ApiProperty({ example: 1 })
    order!: number;

    @ApiProperty({ example: 600 })
    duration!: number;

    @ApiProperty({ example: true })
    isFree!: boolean;

    @ApiProperty({ example: false })
    isPublished!: boolean;

    @ApiProperty({ example: 1 })
    courseId!: number;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}
