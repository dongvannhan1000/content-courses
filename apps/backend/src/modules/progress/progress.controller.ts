import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    ParseIntPipe,
    Request as NestRequest,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ProgressService } from './progress.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ProgressDto, CourseProgressDto } from './dto/progress-response.dto';

@ApiTags('Progress')
@ApiBearerAuth()
@Controller('courses/:courseId')
export class ProgressController {
    constructor(private readonly progressService: ProgressService) { }

    // ============ Placeholder Endpoints ============

    /**
     * GET /api/courses/:courseId/lessons/:lessonId/progress
     * Get lesson progress (placeholder)
     */
    @Get('lessons/:lessonId/progress')
    @ApiOperation({ summary: '[Placeholder] Get lesson progress for resume video' })
    @ApiParam({ name: 'courseId', description: 'Course ID', example: 1 })
    @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 1 })
    @ApiResponse({ status: 200, description: 'Lesson progress', type: ProgressDto })
    @ApiResponse({ status: 403, description: 'Not enrolled in course' })
    @ApiResponse({ status: 404, description: 'Lesson not found' })
    async getByLesson(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @NestRequest() req: Request,
    ): Promise<ProgressDto> {
        const user = req.user!;
        return this.progressService.getByLesson(user.dbId, courseId, lessonId);
    }

    /**
     * PATCH /api/courses/:courseId/lessons/:lessonId/progress
     * Update lesson progress (placeholder)
     */
    @Patch('lessons/:lessonId/progress')
    @ApiOperation({ summary: '[Placeholder] Update lesson watch progress' })
    @ApiParam({ name: 'courseId', description: 'Course ID', example: 1 })
    @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 1 })
    @ApiResponse({ status: 200, description: 'Updated progress', type: ProgressDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Not enrolled in course' })
    @ApiResponse({ status: 404, description: 'Lesson not found' })
    async updateProgress(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Body() dto: UpdateProgressDto,
        @NestRequest() req: Request,
    ): Promise<ProgressDto> {
        const user = req.user!;
        return this.progressService.updateProgress(user.dbId, courseId, lessonId, dto);
    }

    // ============ Full Implementation Endpoints ============

    /**
     * POST /api/courses/:courseId/lessons/:lessonId/complete
     * Mark lesson as complete
     */
    @Post('lessons/:lessonId/complete')
    @ApiOperation({ summary: 'Mark lesson as complete' })
    @ApiParam({ name: 'courseId', description: 'Course ID', example: 1 })
    @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 1 })
    @ApiResponse({ status: 201, description: 'Lesson marked complete', type: ProgressDto })
    @ApiResponse({ status: 403, description: 'Not enrolled in course' })
    @ApiResponse({ status: 404, description: 'Lesson not found' })
    async markComplete(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @NestRequest() req: Request,
    ): Promise<ProgressDto> {
        const user = req.user!;
        return this.progressService.markComplete(user.dbId, courseId, lessonId);
    }

    /**
     * GET /api/courses/:courseId/progress
     * Get course progress summary
     */
    @Get('progress')
    @ApiOperation({ summary: 'Get course progress summary' })
    @ApiParam({ name: 'courseId', description: 'Course ID', example: 1 })
    @ApiResponse({ status: 200, description: 'Course progress summary', type: CourseProgressDto })
    @ApiResponse({ status: 403, description: 'Not enrolled in course' })
    async getCourseProgress(
        @Param('courseId', ParseIntPipe) courseId: number,
        @NestRequest() req: Request,
    ): Promise<CourseProgressDto> {
        const user = req.user!;
        return this.progressService.getCourseProgress(user.dbId, courseId);
    }
}
