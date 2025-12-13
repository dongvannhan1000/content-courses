import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
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
import { Role } from '@prisma/client';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import {
    LessonListItemDto,
    LessonDetailDto,
    LessonDto,
} from './dto/lesson-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

// Type for the user object attached by FirebaseAuthGuard
interface AuthUser {
    uid: string;
    email: string;
    dbId: number;
    role: Role;
}

// DTO for reorder endpoint
class ReorderLessonsDto {
    lessonIds!: number[];
}

@ApiTags('Lessons')
@Controller('courses/:courseId/lessons')
export class LessonsController {
    constructor(private readonly lessonsService: LessonsService) { }

    // ============ Public/Semi-Public Endpoints ============

    /**
     * GET /api/courses/:courseId/lessons
     * Get lessons by course (metadata only, no content)
     * - Public: only published lessons
     * - Owner/Admin: all lessons
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'Get lessons by course' })
    @ApiParam({ name: 'courseId', description: 'Course ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'List of lessons',
        type: [LessonListItemDto],
    })
    @ApiResponse({ status: 404, description: 'Course not found' })
    async findByCourse(
        @Param('courseId', ParseIntPipe) courseId: number,
        @NestRequest() req: Request,
    ): Promise<LessonListItemDto[]> {
        const user = req['user'] as AuthUser | undefined;
        return this.lessonsService.findByCourse(courseId, user?.dbId, user?.role);
    }

    /**
     * GET /api/courses/:courseId/lessons/:slug
     * Get lesson detail with content
     * - Free lesson: anyone can view
     * - Paid lesson: enrolled users or owner only
     */
    @Get(':slug')
    @Public()
    @ApiOperation({ summary: 'Get lesson by slug (check enrollment for paid lessons)' })
    @ApiParam({ name: 'courseId', description: 'Course ID', example: 1 })
    @ApiParam({ name: 'slug', description: 'Lesson slug', example: 'gioi-thieu-khoa-hoc' })
    @ApiResponse({
        status: 200,
        description: 'Lesson detail with content',
        type: LessonDetailDto,
    })
    @ApiResponse({ status: 403, description: 'Forbidden - enrollment required' })
    @ApiResponse({ status: 404, description: 'Lesson not found' })
    async findBySlug(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('slug') slug: string,
        @NestRequest() req: Request,
    ): Promise<LessonDetailDto> {
        const user = req['user'] as AuthUser | undefined;
        return this.lessonsService.findBySlug(courseId, slug, user?.dbId, user?.role);
    }

    // ============ Protected Endpoints (Course Owner/Admin) ============

    /**
     * POST /api/courses/:courseId/lessons
     * Create a new lesson
     */
    @Post()
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create lesson (Course owner only)' })
    @ApiParam({ name: 'courseId', description: 'Course ID', example: 1 })
    @ApiResponse({
        status: 201,
        description: 'Lesson created successfully',
        type: LessonDto,
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not course owner' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @ApiResponse({ status: 409, description: 'Conflict - slug already exists' })
    async create(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Body() createLessonDto: CreateLessonDto,
        @NestRequest() req: Request,
    ): Promise<LessonDto> {
        const user = req['user'] as AuthUser;
        return this.lessonsService.create(courseId, createLessonDto, user.dbId, user.role);
    }

    /**
     * PUT /api/courses/:courseId/lessons/:id
     * Update a lesson
     */
    @Put(':id')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update lesson (Course owner only)' })
    @ApiParam({ name: 'courseId', description: 'Course ID', example: 1 })
    @ApiParam({ name: 'id', description: 'Lesson ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Lesson updated successfully',
        type: LessonDto,
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not course owner' })
    @ApiResponse({ status: 404, description: 'Lesson not found' })
    @ApiResponse({ status: 409, description: 'Conflict - slug already exists' })
    async update(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateLessonDto: UpdateLessonDto,
        @NestRequest() req: Request,
    ): Promise<LessonDto> {
        const user = req['user'] as AuthUser;
        return this.lessonsService.update(id, updateLessonDto, user.dbId, user.role);
    }

    /**
     * DELETE /api/courses/:courseId/lessons/:id
     * Delete a lesson
     */
    @Delete(':id')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete lesson (Course owner only)' })
    @ApiParam({ name: 'courseId', description: 'Course ID', example: 1 })
    @ApiParam({ name: 'id', description: 'Lesson ID', example: 1 })
    @ApiResponse({ status: 204, description: 'Lesson deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not course owner' })
    @ApiResponse({ status: 404, description: 'Lesson not found' })
    async remove(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('id', ParseIntPipe) id: number,
        @NestRequest() req: Request,
    ): Promise<void> {
        const user = req['user'] as AuthUser;
        return this.lessonsService.delete(id, user.dbId, user.role);
    }

    /**
     * PATCH /api/courses/:courseId/lessons/reorder
     * Reorder lessons (drag and drop)
     */
    @Patch('reorder')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reorder lessons (Course owner only)' })
    @ApiParam({ name: 'courseId', description: 'Course ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Lessons reordered successfully',
        type: [LessonListItemDto],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not course owner' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    async reorder(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Body() body: ReorderLessonsDto,
        @NestRequest() req: Request,
    ): Promise<LessonListItemDto[]> {
        const user = req['user'] as AuthUser;
        return this.lessonsService.reorder(courseId, body.lessonIds, user.dbId, user.role);
    }
}
