import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { EnrollDto } from './dto/enroll.dto';

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
    constructor(private readonly enrollmentsService: EnrollmentsService) { }

    @Get()
    @ApiOperation({ summary: 'Get my enrollments' })
    async getMyEnrollments() {
        // TODO: Implement - get from request user
        return { message: 'Get my enrollments - TODO' };
    }

    @Get(':courseId/check')
    @ApiOperation({ summary: 'Check enrollment status for a course' })
    async checkEnrollment(@Param('courseId', ParseIntPipe) courseId: number) {
        // TODO: Implement
        return { message: `Check enrollment for course ${courseId} - TODO` };
    }

    @Post()
    @ApiOperation({ summary: 'Enroll in a course (after payment)' })
    async enroll(@Body() enrollDto: EnrollDto) {
        // TODO: Implement - typically called after successful payment
        return { message: 'Enroll - TODO' };
    }
}
