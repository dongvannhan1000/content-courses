import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request as NestRequest,
  Get,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  // Strict rate limiting for registration: 3 per minute
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user with Firebase Auth' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Strict rate limiting for login: 5 per minute (prevent brute force)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with Firebase ID token (obtained from client-side Firebase Auth)',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.idToken);
  }

  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@NestRequest() req: Request) {
    // Firebase user info + role is attached by FirebaseAuthGuard
    return req.user;
  }

  // Strict rate limiting for password reset: 3 per minute (prevent spam)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset via Firebase' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(forgotPasswordDto.email);
  }

  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh session - get updated user info with new token',
    description: 'Client should call this after refreshing Firebase ID token to get latest user data from database',
  })
  async refreshSession(@NestRequest() req: Request) {
    const firebaseUid = req.user!.uid;
    const user = await this.authService.getUserByFirebaseUid(firebaseUid);
    return { user };
  }

  // ============ Admin Endpoints ============

  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @NestRequest() req: Request,
  ) {
    const adminUserId = req.user!.dbId;
    return this.authService.updateUserRole(id, updateRoleDto.role, adminUserId);
  }
}
