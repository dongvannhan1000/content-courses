import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsNotEmpty, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateLessonDto {
    @ApiProperty({ example: 'Giới thiệu khóa học' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @ApiProperty({ example: 'gioi-thieu-khoa-hoc' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    slug!: string;

    @ApiPropertyOptional({ example: 'Bạn sẽ học được những gì...' })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    description?: string;

    @ApiPropertyOptional({ enum: LessonType, default: 'VIDEO' })
    @IsEnum(LessonType)
    @IsOptional()
    type?: LessonType;

    @ApiPropertyOptional({ example: '<p>Nội dung bài học...</p>' })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiPropertyOptional({ example: 0, description: 'Order in lesson list (0-based)' })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    order?: number;

    @ApiPropertyOptional({ example: 600, description: 'Duration in seconds' })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    duration?: number;

    @ApiPropertyOptional({ example: false, description: 'Is lesson free for preview?' })
    @IsBoolean()
    @IsOptional()
    isFree?: boolean;

    @ApiPropertyOptional({ example: false, description: 'Is lesson published?' })
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;
}

