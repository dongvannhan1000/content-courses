import { IsString, IsOptional, IsInt, IsEnum, IsNotEmpty, MaxLength, Min, ValidateIf, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * DTO for creating media record
 * 
 * For VIDEO/DOCUMENT/IMAGE: use presigned-url flow
 * For YOUTUBE_EMBED: just provide the YouTube URL directly
 */
export class CreateMediaDto {
    @ApiProperty({
        enum: MediaType,
        example: 'VIDEO',
        description: 'VIDEO | DOCUMENT | IMAGE (presigned-url flow) or YOUTUBE_EMBED (direct URL)'
    })
    @IsEnum(MediaType)
    type!: MediaType;

    @ApiPropertyOptional({
        example: 'videos/lesson-1/abc123.mp4',
        description: 'Key from presigned-url endpoint (required for VIDEO/DOCUMENT/IMAGE)',
    })
    @ValidateIf((o) => o.type !== 'YOUTUBE_EMBED')
    @IsString()
    @IsNotEmpty()
    key?: string;

    @ApiPropertyOptional({
        example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        description: 'YouTube URL (required for YOUTUBE_EMBED)',
    })
    @ValidateIf((o) => o.type === 'YOUTUBE_EMBED')
    @IsString()
    @IsNotEmpty()
    @Matches(
        /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/,
        { message: 'Invalid YouTube URL format' }
    )
    youtubeUrl?: string;

    @ApiPropertyOptional({ example: 'Video bài giảng phần 1' })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({ example: 'video-bai-1.mp4' })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    filename?: string;

    @ApiPropertyOptional({ example: 'video/mp4' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    mimeType?: string;

    @ApiPropertyOptional({ example: 10485760, description: 'File size in bytes' })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    size?: number;

    @ApiPropertyOptional({ example: 600, description: 'Duration in seconds (for video)' })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    duration?: number;

    @ApiPropertyOptional({ example: 0, description: 'Order in media list' })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    order?: number;
}
