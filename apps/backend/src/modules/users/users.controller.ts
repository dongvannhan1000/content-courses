import { Controller, Get, Patch, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile() {
        // TODO: Implement - get user from request
        return { message: 'Get profile - TODO' };
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
        // TODO: Implement
        return { message: 'Update profile - TODO' };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID (public profile)' })
    async getUser(@Param('id', ParseIntPipe) id: number) {
        // TODO: Implement
        return { message: `Get user ${id} - TODO` };
    }
}
