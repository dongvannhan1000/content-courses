import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { FirebaseService } from '../../infra/firebase/firebase.service';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly adminEmail: string | undefined;

  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
    private configService: ConfigService,
  ) {
    this.adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (this.adminEmail) {
      this.logger.log(`Admin email configured: ${this.adminEmail}`);
    }
  }

  /**
   * Register a new user with Firebase Auth and sync to database
   * If email matches ADMIN_EMAIL env, user will be assigned ADMIN role
   */
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password, name } = registerDto;

    try {
      // Check if user already exists in our database
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // Create user in Firebase Auth
      const firebaseUser = await this.firebaseService.createUser({
        email,
        password,
        displayName: name,
      });

      // Determine role: ADMIN if email matches ADMIN_EMAIL, otherwise USER
      const role: Role = this.isAdminEmail(email) ? Role.ADMIN : Role.USER;

      // Sync user to our database
      await this.prisma.user.create({
        data: {
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || name,
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL,
          role,
        },
      });

      this.logger.log(`User registered successfully: ${email} with role: ${role}`);
      return { message: 'User registered successfully' };
    } catch (error: any) {
      this.logger.error('Registration failed', error);

      // Handle Firebase-specific errors
      if (error.code === 'auth/email-already-exists') {
        throw new ConflictException('Email already registered in Firebase');
      }
      if (error.code === 'auth/invalid-email') {
        throw new BadRequestException('Invalid email address');
      }
      if (error.code === 'auth/weak-password') {
        throw new BadRequestException(
          'Password is too weak. Please choose a stronger password',
        );
      }

      // Re-throw NestJS exceptions
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Registration failed');
    }
  }

  /**
   * Check if email matches configured ADMIN_EMAIL
   */
  private isAdminEmail(email: string): boolean {
    return !!this.adminEmail && email.toLowerCase() === this.adminEmail.toLowerCase();
  }

  /**
   * Login user by verifying Firebase ID token
   */
  async login(idToken: string) {
    try {
      // Verify the Firebase ID token
      const decodedToken = await this.firebaseService.verifyIdToken(idToken);

      // Get or create user in our database
      let user = await this.prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid },
      });

      // If user doesn't exist in our DB, sync from Firebase
      if (!user) {
        user = await this.syncFirebaseUser(decodedToken.uid);
      }

      this.logger.log(`User logged in: ${user.email} (role: ${user.role})`);

      return {
        user: {
          id: user.id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL,
          role: user.role,
        },
      };
    } catch (error: any) {
      this.logger.error('Login failed', error);

      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException('Token expired, please login again');
      }
      if (error.code === 'auth/argument-error') {
        throw new UnauthorizedException('Invalid token format');
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Sync Firebase user to our database
   */
  async syncFirebaseUser(firebaseUid: string) {
    try {
      const firebaseUser = await this.firebaseService.getUserByUid(firebaseUid);

      // Determine role for new users synced from Firebase
      const role: Role = this.isAdminEmail(firebaseUser.email!) ? Role.ADMIN : Role.USER;

      const user = await this.prisma.user.upsert({
        where: { firebaseUid },
        update: {
          email: firebaseUser.email!,
          name: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL,
        },
        create: {
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL,
          role,
        },
      });

      this.logger.log(`Synced Firebase user to database: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to sync Firebase user: ${firebaseUid}`, error);
      throw error;
    }
  }

  /**
   * Update user role (ADMIN only)
   */
  async updateUserRole(userId: number, newRole: Role, adminUserId: number) {
    // Prevent admin from changing their own role
    if (userId === adminUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    this.logger.log(`Role updated for user ${user.email}: ${user.role} -> ${newRole}`);
    return updatedUser;
  }

  /**
   * Request password reset (Firebase will send email)
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      // Generate password reset link
      const resetLink = await this.firebaseService.generatePasswordResetLink(
        email,
      );

      // TODO: In production, send this link via your email service
      // For now, just log it (Firebase can also send email directly if configured)
      this.logger.log(`Password reset link for ${email}: ${resetLink}`);

      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    } catch (error: any) {
      // Don't reveal if user exists for security
      this.logger.error(`Password reset failed for ${email}`, error);
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }
  }

  /**
   * Get user by Firebase UID
   */
  async getUserByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        name: true,
        emailVerified: true,
        photoURL: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get user by database ID
   */
  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        name: true,
        emailVerified: true,
        photoURL: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get all users (ADMIN only)
   */
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

