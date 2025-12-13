import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';

/**
 * Response DTO for media item
 */
export class MediaResponseDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ enum: MediaType, example: 'VIDEO' })
    type!: MediaType;

    @ApiPropertyOptional({ example: 'Video bài giảng' })
    title?: string;

    @ApiProperty({ example: 'https://cdn.example.com/videos/abc123.mp4' })
    url!: string;

    @ApiPropertyOptional({ example: 'video-bai-1.mp4' })
    filename?: string;

    @ApiPropertyOptional({ example: 'video/mp4' })
    mimeType?: string;

    @ApiPropertyOptional({ example: 10485760 })
    size?: number;

    @ApiPropertyOptional({ example: 600, description: 'Duration in seconds' })
    duration?: number;

    @ApiProperty({ example: 0 })
    order!: number;

    @ApiProperty({ example: 1 })
    lessonId!: number;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

/**
 * Response DTO for signed URL
 */
export class SignedUrlResponseDto {
    @ApiProperty({
        example: 'https://cdn.example.com/videos/abc123.mp4?token=xyz&expires=1234567890',
        description: 'Signed URL with expiration for private content'
    })
    signedUrl!: string;

    @ApiProperty({
        example: 3600,
        description: 'URL expiration in seconds'
    })
    expiresIn!: number;
}
