import {
    Controller,
    Get,
    Patch,
    Body,
    Param,
    ParseIntPipe,
    Query,
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
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import {
    UpdateProfileDto,
    UserProfileDto,
    PublicUserDto,
    PaginatedUsersDto,
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

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // ============ Current User Profile ============

    /**
     * GET /api/users/me
     * Get current authenticated user's profile
     */
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile',
        type: UserProfileDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@NestRequest() req: Request): Promise<UserProfileDto> {
        const user = req['user'] as AuthUser;
        return this.usersService.getProfile(user.dbId);
    }

    /**
     * PATCH /api/users/me
     * Update current user's profile
     */
    @Patch('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({
        status: 200,
        description: 'Updated profile',
        type: UserProfileDto,
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateProfile(
        @NestRequest() req: Request,
        @Body() dto: UpdateProfileDto,
    ): Promise<UserProfileDto> {
        const user = req['user'] as AuthUser;
        return this.usersService.updateProfile(user.dbId, dto);
    }

    // ============ Admin: List Users ============

    /**
     * GET /api/users
     * List all users (admin only)
     */
    @Get()
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all users (Admin only)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 20 })
    @ApiResponse({
        status: 200,
        description: 'Paginated users list',
        type: PaginatedUsersDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    async listUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedUsersDto> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.usersService.listUsers(pageNum, limitNum);
    }

    // ============ Public Profile ============

    /**
     * GET /api/users/:id
     * Get public profile of a user
     */
    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get public user profile' })
    @ApiParam({ name: 'id', description: 'User ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Public user profile',
        type: PublicUserDto,
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getPublicProfile(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<PublicUserDto> {
        return this.usersService.getPublicProfile(id);
    }
}
