import { IsInt, IsOptional, IsEnum, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EnrollmentStatus } from '@prisma/client';

/**
 * DTO for enrolling in a course
 * Used by: POST /enrollments
 */
export class EnrollDto {
    @ApiProperty({ example: 1, description: 'Course ID to enroll in' })
    @IsInt()
    courseId!: number;
}

/**
 * DTO for updating learning progress
 * Used by: PATCH /enrollments/:id/progress
 */
export class UpdateProgressDto {
    @ApiProperty({ example: 50, description: 'Progress percentage 0-100', minimum: 0, maximum: 100 })
    @IsInt()
    @Min(0)
    @Max(100)
    progressPercent!: number;
}

/**
 * DTO for admin enrollment update
 * Used by: PATCH /enrollments/admin/:id
 */
export class AdminUpdateEnrollmentDto {
    @ApiPropertyOptional({ enum: EnrollmentStatus, example: 'COMPLETED' })
    @IsOptional()
    @IsEnum(EnrollmentStatus)
    status?: EnrollmentStatus;

    @ApiPropertyOptional({ example: '2025-12-31T00:00:00.000Z', description: 'New expiration date' })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

/**
 * DTO for admin enrollment query (pagination + filters)
 * Used by: GET /enrollments/admin
 */
export class EnrollmentQueryDto {
    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ enum: EnrollmentStatus, description: 'Filter by status' })
    @IsOptional()
    @IsEnum(EnrollmentStatus)
    status?: EnrollmentStatus;

    @ApiPropertyOptional({ example: 1, description: 'Filter by course ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    courseId?: number;

    @ApiPropertyOptional({ example: 1, description: 'Filter by user ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    userId?: number;
}
