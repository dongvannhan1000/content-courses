import {
    Controller,
    Get,
    Post,
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
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { EnrollmentsService } from './enrollments.service';
import { EnrollDto, UpdateProgressDto, AdminUpdateEnrollmentDto, EnrollmentQueryDto } from './dto/enroll.dto';
import {
    EnrollmentListItemDto,
    EnrollmentDetailDto,
    EnrollmentCheckDto,
    PaginatedEnrollmentsDto,
} from './dto/enrollment-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
    constructor(private readonly enrollmentsService: EnrollmentsService) { }

    // ============ User Endpoints ============

    @Get()
    @ApiOperation({
        summary: 'Get my enrollments',
        description: 'Get all courses the current user is enrolled in. Used for "My Courses" dashboard.',
    })
    @ApiResponse({ status: 200, type: [EnrollmentListItemDto] })
    async getMyEnrollments(@NestRequest() req: Request): Promise<EnrollmentListItemDto[]> {
        return this.enrollmentsService.findByUser(req.user!.dbId);
    }

    @Get(':courseId/check')
    @ApiOperation({
        summary: 'Check enrollment status for a course',
        description: 'Check if the current user is enrolled in a specific course. Used for course detail page to determine button state.',
    })
    @ApiParam({ name: 'courseId', type: Number })
    @ApiResponse({ status: 200, type: EnrollmentCheckDto })
    async checkEnrollment(
        @Param('courseId', ParseIntPipe) courseId: number,
        @NestRequest() req: Request,
    ): Promise<EnrollmentCheckDto> {
        return this.enrollmentsService.checkEnrollment(req.user!.dbId, courseId);
    }

    @Post()
    @ApiOperation({
        summary: 'Enroll in a course',
        description: 'Enroll the current user in a course. Typically called after successful payment or for free courses.',
    })
    @ApiResponse({ status: 201, type: EnrollmentDetailDto })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @ApiResponse({ status: 409, description: 'Already enrolled' })
    async enroll(
        @Body() enrollDto: EnrollDto,
        @NestRequest() req: Request,
    ): Promise<EnrollmentDetailDto> {
        return this.enrollmentsService.create(req.user!.dbId, enrollDto.courseId);
    }

    @Patch(':id/progress')
    @ApiOperation({
        summary: 'Update learning progress',
        description: 'Update the progress percentage for an enrollment. Called when user progresses through lessons.',
    })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: EnrollmentDetailDto })
    @ApiResponse({ status: 403, description: 'Not your enrollment' })
    @ApiResponse({ status: 404, description: 'Enrollment not found' })
    async updateProgress(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProgressDto,
        @NestRequest() req: Request,
    ): Promise<EnrollmentDetailDto> {
        return this.enrollmentsService.updateProgress(id, req.user!.dbId, dto.progressPercent);
    }

    @Post(':id/complete')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mark enrollment as completed',
        description: 'Mark the enrollment as completed. Called when user finishes all lessons.',
    })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: EnrollmentDetailDto })
    @ApiResponse({ status: 403, description: 'Not your enrollment' })
    @ApiResponse({ status: 404, description: 'Enrollment not found' })
    async markComplete(
        @Param('id', ParseIntPipe) id: number,
        @NestRequest() req: Request,
    ): Promise<EnrollmentDetailDto> {
        return this.enrollmentsService.markComplete(id, req.user!.dbId);
    }

    // ============ Admin Endpoints ============

    @Get('admin')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'Get all enrollments (Admin)',
        description: 'Get paginated list of all enrollments with optional filters. Admin only.',
    })
    @ApiResponse({ status: 200, type: PaginatedEnrollmentsDto })
    @ApiResponse({ status: 403, description: 'Admin access required' })
    async getAll(@Query() query: EnrollmentQueryDto): Promise<PaginatedEnrollmentsDto> {
        return this.enrollmentsService.findAll(query);
    }

    @Get('admin/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'Get enrollment by ID (Admin)',
        description: 'Get detailed enrollment information. Admin only.',
    })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: EnrollmentDetailDto })
    @ApiResponse({ status: 404, description: 'Enrollment not found' })
    async getById(@Param('id', ParseIntPipe) id: number): Promise<EnrollmentDetailDto> {
        return this.enrollmentsService.findById(id);
    }

    @Patch('admin/:id')
    @Roles(Role.ADMIN)
    @ApiOperation({
        summary: 'Update enrollment (Admin)',
        description: 'Update enrollment status or expiry date. Admin only.',
    })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: EnrollmentDetailDto })
    @ApiResponse({ status: 404, description: 'Enrollment not found' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AdminUpdateEnrollmentDto,
    ): Promise<EnrollmentDetailDto> {
        return this.enrollmentsService.adminUpdate(id, dto);
    }

    @Delete('admin/:id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete enrollment (Admin)',
        description: 'Delete an enrollment. Used for refunds/cancellations. Admin only.',
    })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 204, description: 'Enrollment deleted' })
    @ApiResponse({ status: 404, description: 'Enrollment not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.enrollmentsService.delete(id);
    }
}
