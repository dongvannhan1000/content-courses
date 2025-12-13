import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '@prisma/client';

// ============ Reference DTOs ============

/**
 * Instructor reference for course display
 */
export class InstructorRefDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Nguyen Van A' })
    name!: string;
}

/**
 * Course reference for enrollment display
 */
export class CourseRefDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Khóa học React' })
    title!: string;

    @ApiProperty({ example: 'khoa-hoc-react' })
    slug!: string;

    @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg' })
    thumbnail?: string;

    @ApiProperty({ type: InstructorRefDto })
    instructor!: InstructorRefDto;
}

// ============ Enrollment DTOs ============

/**
 * DTO for enrollment listing (GET /enrollments)
 * Used for: User's "My Courses" dashboard
 */
export class EnrollmentListItemDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ enum: EnrollmentStatus, example: 'ACTIVE' })
    status!: EnrollmentStatus;

    @ApiProperty({ example: 25, description: 'Learning progress 0-100' })
    progressPercent!: number;

    @ApiProperty()
    enrolledAt!: Date;

    @ApiProperty({ type: CourseRefDto })
    course!: CourseRefDto;
}

/**
 * DTO for enrollment detail (GET /enrollments/:id or check)
 * Used for: Course detail page enrollment check, Admin detail view
 */
export class EnrollmentDetailDto extends EnrollmentListItemDto {
    @ApiPropertyOptional({ description: 'Expiration date if applicable' })
    expiresAt?: Date;

    @ApiPropertyOptional({ description: 'Completion date' })
    completedAt?: Date;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

/**
 * DTO for enrollment check response (GET /enrollments/:courseId/check)
 * Used for: Frontend to determine what button to show
 */
export class EnrollmentCheckDto {
    @ApiProperty({ example: true })
    enrolled!: boolean;

    @ApiPropertyOptional({ enum: EnrollmentStatus, example: 'ACTIVE' })
    status?: EnrollmentStatus;

    @ApiPropertyOptional({ example: 25 })
    progressPercent?: number;

    @ApiPropertyOptional({ example: 1 })
    enrollmentId?: number;
}

/**
 * DTO for paginated enrollments (Admin listing)
 */
export class PaginatedEnrollmentsDto {
    @ApiProperty({ type: [EnrollmentDetailDto] })
    enrollments!: EnrollmentDetailDto[];

    @ApiProperty({ example: 100 })
    total!: number;

    @ApiProperty({ example: 1 })
    page!: number;

    @ApiProperty({ example: 10 })
    limit!: number;

    @ApiProperty({ example: 10 })
    totalPages!: number;
}
