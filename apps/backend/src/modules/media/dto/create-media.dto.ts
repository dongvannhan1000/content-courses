import { IsString, IsOptional, IsInt, IsEnum, IsNotEmpty, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * DTO for creating media record after successful upload
 * Frontend calls this AFTER uploading file to Bunny/R2
 */
export class CreateMediaDto {
    @ApiProperty({ enum: MediaType, example: 'VIDEO' })
    @IsEnum(MediaType)
    type!: MediaType;

    @ApiProperty({
        example: 'videos/lesson-1/abc123.mp4',
        description: 'Key returned from presigned-url endpoint'
    })
    @IsString()
    @IsNotEmpty()
    key!: string;

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
