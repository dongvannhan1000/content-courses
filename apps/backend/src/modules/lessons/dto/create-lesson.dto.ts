import { IsString, IsOptional, IsInt, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType } from '@prisma/client';

export class CreateLessonDto {
    @ApiProperty()
    @IsString()
    title!: string;

    @ApiProperty()
    @IsString()
    slug!: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ enum: LessonType })
    @IsEnum(LessonType)
    @IsOptional()
    type?: LessonType;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    content?: string;

    @ApiPropertyOptional()
    @IsInt()
    @IsOptional()
    duration?: number;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isFree?: boolean;

    @ApiProperty()
    @IsInt()
    courseId!: number;
}
