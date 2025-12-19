import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============ Lesson Progress DTOs ============

export class ProgressDto {
    @ApiProperty({ description: 'Progress ID', example: 1 })
    id!: number;

    @ApiProperty({ description: 'Lesson ID', example: 1 })
    lessonId!: number;

    @ApiProperty({ description: 'Whether the lesson is completed', example: false })
    isCompleted!: boolean;

    @ApiProperty({ description: 'Total seconds watched', example: 300 })
    watchedSeconds!: number;

    @ApiProperty({ description: 'Last watched position in seconds', example: 150 })
    lastPosition!: number;

    @ApiPropertyOptional({ description: 'When the lesson was completed' })
    completedAt?: Date;
}

// ============ Course Progress DTOs ============

export class LessonProgressSummaryDto {
    @ApiProperty({ description: 'Lesson ID', example: 1 })
    id!: number;

    @ApiProperty({ description: 'Lesson title', example: 'Giới thiệu khóa học' })
    title!: string;

    @ApiProperty({ description: 'Lesson order', example: 0 })
    order!: number;

    @ApiProperty({ description: 'Whether this lesson is completed', example: true })
    isCompleted!: boolean;
}

export class CourseProgressDto {
    @ApiProperty({ description: 'Course ID', example: 1 })
    courseId!: number;

    @ApiProperty({ description: 'Total published lessons in course', example: 10 })
    totalLessons!: number;

    @ApiProperty({ description: 'Number of completed lessons', example: 3 })
    completedLessons!: number;

    @ApiProperty({ description: 'Progress percentage (0-100)', example: 30 })
    progressPercent!: number;

    @ApiProperty({ description: 'Per-lesson progress summary', type: [LessonProgressSummaryDto] })
    lessons!: LessonProgressSummaryDto[];
}
