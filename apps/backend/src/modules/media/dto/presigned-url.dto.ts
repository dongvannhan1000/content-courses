import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';

/**
 * Request DTO for generating presigned URL
 */
export class PresignedUrlRequestDto {
    @ApiProperty({ example: 'video-bai-1.mp4' })
    @IsString()
    @IsNotEmpty()
    filename!: string;

    @ApiProperty({ enum: MediaType, example: 'VIDEO' })
    @IsEnum(MediaType)
    type!: MediaType;
}

/**
 * Response DTO for presigned URL
 */
export class PresignedUrlResponseDto {
    @ApiProperty({
        example: 'https://storage.bunnycdn.com/library/videos/abc123?token=xyz',
        description: 'URL để upload file trực tiếp'
    })
    uploadUrl!: string;

    @ApiProperty({
        example: 'videos/lesson-1/abc123.mp4',
        description: 'Key để save metadata sau khi upload xong'
    })
    key!: string;

    @ApiProperty({
        example: 'https://cdn.example.com/videos/lesson-1/abc123.mp4',
        description: 'URL công khai sau khi upload'
    })
    publicUrl!: string;
}
