import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
    constructor(private readonly lessonsService: LessonsService) { }

    @Get('course/:courseId')
    @ApiOperation({ summary: 'Get lessons by course ID' })
    async findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
        // TODO: Implement - check enrollment for non-free lessons
        return { message: `Get lessons for course ${courseId} - TODO` };
    }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get lesson content (check enrollment)' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        // TODO: Implement with enrollment check
        return { message: `Get lesson ${id} - TODO` };
    }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create lesson (Instructor)' })
    async create(@Body() createLessonDto: CreateLessonDto) {
        // TODO: Implement - verify course ownership
        return { message: 'Create lesson - TODO' };
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update lesson (Instructor)' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateLessonDto: UpdateLessonDto,
    ) {
        // TODO: Implement
        return { message: `Update lesson ${id} - TODO` };
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete lesson (Instructor)' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        // TODO: Implement
        return { message: `Delete lesson ${id} - TODO` };
    }
}
