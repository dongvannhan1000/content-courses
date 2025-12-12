import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all courses (with filters, pagination)' })
    async findAll(@Query() query: CourseQueryDto) {
        // TODO: Implement with filters
        return { message: 'Get all courses - TODO' };
    }

    @Get('my-courses')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get instructor courses' })
    async getMyCourses() {
        // TODO: Implement - for instructors
        return { message: 'Get my courses - TODO' };
    }

    @Get(':slug')
    @Public()
    @ApiOperation({ summary: 'Get course by slug' })
    async findBySlug(@Param('slug') slug: string) {
        // TODO: Implement
        return { message: `Get course ${slug} - TODO` };
    }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create course (Instructor)' })
    async create(@Body() createCourseDto: CreateCourseDto) {
        // TODO: Implement with @Roles(Role.INSTRUCTOR, Role.ADMIN)
        return { message: 'Create course - TODO' };
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update course (Owner only)' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCourseDto: UpdateCourseDto,
    ) {
        // TODO: Implement
        return { message: `Update course ${id} - TODO` };
    }

    @Patch(':id/publish')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Submit course for review (Instructor)' })
    async publish(@Param('id', ParseIntPipe) id: number) {
        // TODO: Implement
        return { message: `Publish course ${id} - TODO` };
    }

    @Patch(':id/status')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Approve/reject course (Admin only)' })
    async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
        // TODO: Implement with @Roles(Role.ADMIN)
        return { message: `Update course ${id} status - TODO` };
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete course (Owner/Admin)' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        // TODO: Implement
        return { message: `Delete course ${id} - TODO` };
    }
}
