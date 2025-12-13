import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';

// ============ Reference DTOs ============

/**
 * Minimal instructor info for course listings
 */
export class InstructorRefDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Nguyễn Văn A' })
    name!: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    photoURL?: string;

    @ApiPropertyOptional({ example: 'Senior Developer với 10 năm kinh nghiệm' })
    bio?: string;
}

/**
 * Minimal category info for course references
 */
export class CategoryRefDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'JavaScript' })
    name!: string;

    @ApiProperty({ example: 'javascript' })
    slug!: string;
}

/**
 * Lesson summary for course detail (public info only)
 */
export class LessonSummaryDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Giới thiệu khóa học' })
    title!: string;

    @ApiProperty({ example: 'gioi-thieu-khoa-hoc' })
    slug!: string;

    @ApiProperty({ example: 1 })
    order!: number;

    @ApiProperty({ example: 600, description: 'Duration in seconds' })
    duration!: number;

    @ApiProperty({ example: true })
    isFree!: boolean;
}

// ============ Course DTOs ============

/**
 * DTO for course listing (GET /courses, GET /courses/featured)
 * Optimized for list view with essential info
 */
export class CourseListItemDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Khóa học JavaScript từ cơ bản đến nâng cao' })
    title!: string;

    @ApiProperty({ example: 'khoa-hoc-javascript-tu-co-ban-den-nang-cao' })
    slug!: string;

    @ApiPropertyOptional({ example: 'Học JS từ A-Z với các dự án thực tế' })
    shortDesc?: string;

    @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
    thumbnail?: string;

    @ApiProperty({ example: 599000 })
    price!: number;

    @ApiPropertyOptional({ example: 399000 })
    discountPrice?: number;

    @ApiPropertyOptional({ example: 'beginner' })
    level?: string;

    @ApiProperty({ example: 3600, description: 'Total duration in seconds' })
    duration!: number;

    @ApiProperty({ enum: CourseStatus, example: 'PUBLISHED' })
    status!: CourseStatus;

    @ApiPropertyOptional()
    publishedAt?: Date;

    @ApiProperty({ type: InstructorRefDto })
    instructor!: InstructorRefDto;

    @ApiPropertyOptional({ type: CategoryRefDto })
    category?: CategoryRefDto;

    @ApiProperty({ example: 10, description: 'Number of lessons' })
    lessonCount!: number;

    @ApiProperty({ example: 150, description: 'Number of enrollments' })
    enrollmentCount!: number;

    @ApiProperty({ example: 25, description: 'Number of reviews' })
    reviewCount!: number;

    @ApiPropertyOptional({ example: 4.5, description: 'Average rating (1-5)' })
    rating?: number;
}

/**
 * DTO for course detail page (GET /courses/:slug)
 * Includes full description and lessons summary
 */
export class CourseDetailDto extends CourseListItemDto {
    @ApiProperty({ example: 'Mô tả chi tiết về khóa học...' })
    description!: string;

    @ApiProperty({ type: [LessonSummaryDto] })
    lessons!: LessonSummaryDto[];

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

/**
 * DTO for course management (POST/PUT response, instructor dashboard)
 * Full entity representation
 */
export class CourseDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Khóa học JavaScript' })
    title!: string;

    @ApiProperty({ example: 'khoa-hoc-javascript' })
    slug!: string;

    @ApiProperty({ example: 'Mô tả chi tiết...' })
    description!: string;

    @ApiPropertyOptional({ example: 'Mô tả ngắn' })
    shortDesc?: string;

    @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
    thumbnail?: string;

    @ApiProperty({ example: 599000 })
    price!: number;

    @ApiPropertyOptional({ example: 399000 })
    discountPrice?: number;

    @ApiProperty({ enum: CourseStatus, example: 'DRAFT' })
    status!: CourseStatus;

    @ApiPropertyOptional({ example: 'beginner' })
    level?: string;

    @ApiProperty({ example: 0 })
    duration!: number;

    @ApiProperty({ example: 1 })
    instructorId!: number;

    @ApiPropertyOptional({ example: 1 })
    categoryId?: number;

    @ApiPropertyOptional()
    publishedAt?: Date;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

/**
 * Paginated response for course listing
 */
export class PaginatedCoursesDto {
    @ApiProperty({ type: [CourseListItemDto] })
    data!: CourseListItemDto[];

    @ApiProperty({ example: 100 })
    total!: number;

    @ApiProperty({ example: 1 })
    page!: number;

    @ApiProperty({ example: 10 })
    limit!: number;

    @ApiProperty({ example: 10 })
    totalPages!: number;
}
