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
import { MediaService } from './media.service';
import {
    PresignedUrlRequestDto,
    PresignedUrlResponseDto,
    CreateMediaDto,
    UpdateMediaDto,
    MediaResponseDto,
    SignedUrlResponseDto,
} from './dto';
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
class ReorderMediaDto {
    mediaIds!: number[];
}

@ApiTags('Media')
@Controller()
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    // ============ Nested Routes: /lessons/:lessonId/media/* ============

    /**
     * GET /api/lessons/:lessonId/media
     * Get all media for a lesson
     */
    @Get('lessons/:lessonId/media')
    @Public()
    @ApiOperation({ summary: 'Get media by lesson' })
    @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'List of media',
        type: [MediaResponseDto],
    })
    @ApiResponse({ status: 404, description: 'Lesson not found' })
    async findByLesson(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @NestRequest() req: Request,
    ): Promise<MediaResponseDto[]> {
        const user = req['user'] as AuthUser | undefined;
        return this.mediaService.findByLesson(lessonId, user?.dbId, user?.role);
    }

    /**
     * POST /api/lessons/:lessonId/media/presigned-url
     * Get presigned URL for direct upload (Step 1)
     */
    @Post('lessons/:lessonId/media/presigned-url')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get presigned URL for direct upload (Owner only)' })
    @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 1 })
    @ApiResponse({
        status: 201,
        description: 'Presigned URL generated',
        type: PresignedUrlResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not course owner' })
    @ApiResponse({ status: 404, description: 'Lesson not found' })
    async getPresignedUrl(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Body() dto: PresignedUrlRequestDto,
        @NestRequest() req: Request,
    ): Promise<PresignedUrlResponseDto> {
        const user = req['user'] as AuthUser;
        return this.mediaService.generatePresignedUrl(lessonId, dto, user.dbId, user.role);
    }

    /**
     * POST /api/lessons/:lessonId/media
     * Create media record after upload (Step 2)
     */
    @Post('lessons/:lessonId/media')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create media record after upload (Owner only)' })
    @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 1 })
    @ApiResponse({
        status: 201,
        description: 'Media created successfully',
        type: MediaResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not course owner' })
    @ApiResponse({ status: 404, description: 'Lesson not found' })
    async create(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Body() dto: CreateMediaDto,
        @NestRequest() req: Request,
    ): Promise<MediaResponseDto> {
        const user = req['user'] as AuthUser;
        return this.mediaService.create(lessonId, dto, user.dbId, user.role);
    }

    /**
     * PUT /api/lessons/:lessonId/media/:id
     * Update media metadata
     */
    @Put('lessons/:lessonId/media/:id')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update media (Owner only)' })
    @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 1 })
    @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Media updated successfully',
        type: MediaResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not course owner' })
    @ApiResponse({ status: 404, description: 'Media not found' })
    async update(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateMediaDto,
        @NestRequest() req: Request,
    ): Promise<MediaResponseDto> {
        const user = req['user'] as AuthUser;
        return this.mediaService.update(id, dto, user.dbId, user.role);
    }

    /**
     * DELETE /api/lessons/:lessonId/media/:id
     * Delete media
     */
    @Delete('lessons/:lessonId/media/:id')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete media (Owner only)' })
    @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 1 })
    @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
    @ApiResponse({ status: 204, description: 'Media deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not course owner' })
    @ApiResponse({ status: 404, description: 'Media not found' })
    async remove(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('id', ParseIntPipe) id: number,
        @NestRequest() req: Request,
    ): Promise<void> {
        const user = req['user'] as AuthUser;
        return this.mediaService.delete(id, user.dbId, user.role);
    }

    /**
     * PATCH /api/lessons/:lessonId/media/reorder
     * Reorder media (drag and drop)
     */
    @Patch('lessons/:lessonId/media/reorder')
    @Roles(Role.INSTRUCTOR, Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reorder media (Owner only)' })
    @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Media reordered successfully',
        type: [MediaResponseDto],
    })
    @ApiResponse({ status: 400, description: 'Invalid media IDs' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not course owner' })
    @ApiResponse({ status: 404, description: 'Lesson not found' })
    async reorder(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Body() body: ReorderMediaDto,
        @NestRequest() req: Request,
    ): Promise<MediaResponseDto[]> {
        const user = req['user'] as AuthUser;
        return this.mediaService.reorder(lessonId, body.mediaIds, user.dbId, user.role);
    }

    // ============ Standalone Routes: /media/* ============

    /**
     * GET /api/media/:id
     * Get media by ID
     */
    @Get('media/:id')
    @Public()
    @ApiOperation({ summary: 'Get media by ID' })
    @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Media details',
        type: MediaResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Media not found' })
    async findById(@Param('id', ParseIntPipe) id: number): Promise<MediaResponseDto> {
        return this.mediaService.findById(id);
    }

    /**
     * GET /api/media/:id/signed-url
     * Get signed URL for private content (enrolled users or owner)
     */
    @Get('media/:id/signed-url')
    @Public()
    @ApiOperation({ summary: 'Get signed URL for private content' })
    @ApiParam({ name: 'id', description: 'Media ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Signed URL generated',
        type: SignedUrlResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Enrollment required' })
    @ApiResponse({ status: 404, description: 'Media not found' })
    async getSignedUrl(
        @Param('id', ParseIntPipe) id: number,
        @NestRequest() req: Request,
    ): Promise<SignedUrlResponseDto> {
        const user = req['user'] as AuthUser | undefined;
        return this.mediaService.generateSignedUrl(id, user?.dbId, user?.role);
    }
}
