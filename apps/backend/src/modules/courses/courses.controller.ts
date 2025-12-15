import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
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
    ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Role, CourseStatus } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import {
    CourseListItemDto,
    CourseDetailDto,
    CourseDto,
    PaginatedCoursesDto,
} from './dto/course-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    // ============ Public Endpoints ============

    /**
     * GET /api/courses
     * Get all published courses with filters and pagination
     * 
     * Frontend Usage: Course listing page, search results
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all courses (with filters, pagination)' })
    @ApiResponse({
        status: 200,
        description: 'Paginated list of courses',
        type: PaginatedCoursesDto,
    })
    async findAll(@Query() query: CourseQueryDto): Promise<PaginatedCoursesDto> {
        return this.coursesService.findAll(query);
    }

    /**
     * GET /api/courses/featured
     * Get featured courses for homepage
     * 
     * Frontend Usage: Homepage featured section
     */
    @Get('featured')
    @Public()
    @ApiOperation({ summary: 'Get featured courses' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 6 })
    @ApiResponse({
        status: 200,
        description: 'List of featured courses',
        type: [CourseListItemDto],
    })
    async getFeatured(@Query('limit') limit?: number): Promise<CourseListItemDto[]> {
        return this.coursesService.findFeatured(limit || 6);
    }

    /**
     * GET /api/courses/my-courses
     * Get courses created by the current instructor
     * 
     * Frontend Usage: Instructor dashboard
     */
    @Get('my-courses')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my courses (Instructor/Admin)' })
    @ApiResponse({
        status: 200,
        description: 'List of instructor courses',
        type: [CourseListItemDto],
    })
    async getMyCourses(@NestRequest() req: Request): Promise<CourseListItemDto[]> {
        const user = req.user!;
        return this.coursesService.findByInstructor(user.dbId);
    }

    /**
     * GET /api/courses/:slug
     * Get course detail by slug
     * 
     * Frontend Usage: Course detail page
     */
    @Get(':slug')
    @Public()
    @ApiOperation({ summary: 'Get course by slug' })
    @ApiParam({ name: 'slug', description: 'Course URL slug', example: 'khoa-hoc-javascript' })
    @ApiResponse({
        status: 200,
        description: 'Course detail',
        type: CourseDetailDto,
    })
    @ApiResponse({ status: 404, description: 'Course not found' })
    async findBySlug(@Param('slug') slug: string): Promise<CourseDetailDto> {
        return this.coursesService.findBySlug(slug);
    }

    // ============ Protected Endpoints ============

    /**
     * POST /api/courses
     * Create a new course
     * 
     * Frontend Usage: Instructor create course form
     */
    @Post()
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create course (Instructor/Admin)' })
    @ApiResponse({
        status: 201,
        description: 'Course created successfully',
        type: CourseDto,
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Instructor/Admin role required' })
    @ApiResponse({ status: 409, description: 'Conflict - Slug already exists' })
    async create(
        @Body() createCourseDto: CreateCourseDto,
        @NestRequest() req: Request,
    ): Promise<CourseDto> {
        const user = req.user!;
        return this.coursesService.create(createCourseDto, user.dbId, user.role);
    }

    /**
     * PUT /api/courses/:id
     * Update an existing course
     * 
     * Frontend Usage: Instructor edit course form
     */
    @Put(':id')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update course (Owner/Admin)' })
    @ApiParam({ name: 'id', description: 'Course ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Course updated successfully',
        type: CourseDto,
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not the course owner' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @ApiResponse({ status: 409, description: 'Conflict - Slug already exists' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCourseDto: UpdateCourseDto,
        @NestRequest() req: Request,
    ): Promise<CourseDto> {
        const user = req.user!;
        return this.coursesService.update(id, updateCourseDto, user.dbId, user.role);
    }

    /**
     * PATCH /api/courses/:id/submit
     * Submit course for review (DRAFT -> PENDING for Instructor, DRAFT -> PUBLISHED for Admin)
     * 
     * Frontend Usage: Instructor submit course for admin review
     */
    @Patch(':id/submit')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Submit course for review (Owner/Admin self-publish)' })
    @ApiParam({ name: 'id', description: 'Course ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Course submitted/published successfully',
        type: CourseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not the course owner' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @ApiResponse({ status: 409, description: 'Conflict - Course is not in DRAFT status' })
    async submitForReview(
        @Param('id', ParseIntPipe) id: number,
        @NestRequest() req: Request,
    ): Promise<CourseDto> {
        const user = req.user!;
        return this.coursesService.submitForReview(id, user.dbId, user.role);
    }

    /**
     * PATCH /api/courses/:id/status
     * Update course status (Admin only)
     * 
     * Frontend Usage: Admin approve/reject course
     */
    @Patch(':id/status')
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Approve/reject course (Admin only)' })
    @ApiParam({ name: 'id', description: 'Course ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Course status updated successfully',
        type: CourseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body('status') status: CourseStatus,
    ): Promise<CourseDto> {
        return this.coursesService.updateStatus(id, status);
    }

    /**
     * DELETE /api/courses/:id
     * Delete a course
     * 
     * Frontend Usage: Instructor/Admin delete course
     */
    @Delete(':id')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete course (Owner/Admin)' })
    @ApiParam({ name: 'id', description: 'Course ID', example: 1 })
    @ApiResponse({ status: 204, description: 'Course deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not the course owner' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @ApiResponse({ status: 409, description: 'Conflict - Cannot delete course with enrollments' })
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @NestRequest() req: Request,
    ): Promise<void> {
        const user = req.user!;
        return this.coursesService.delete(id, user.dbId, user.role);
    }
}
