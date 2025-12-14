import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

export interface TestUserPayload {
  uid: string;
  email: string;
  name?: string;
  role?: Role;
  emailVerified?: boolean;
  photoURL?: string;
}

/**
 * Authentication helper for testing
 * Provides utilities for generating test tokens and creating test users
 */
export class AuthHelper {
  private static jwtService = new JwtService({
    secret: process.env.JWT_SECRET || 'test-secret-key-for-testing-only',
  });

  /**
   * Generate a mock JWT token for testing
   */
  static generateTestToken(payload: TestUserPayload): string {
    return this.jwtService.sign({
      sub: payload.uid,
      email: payload.email,
      name: payload.name || 'Test User',
      role: payload.role || 'USER',
      email_verified: payload.emailVerified ?? true,
      picture: payload.photoURL,
      aud: 'test',
      iss: 'test',
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      iat: Math.floor(Date.now() / 1000),
    });
  }

  /**
   * Get authorization headers for requests
   */
  static getAuthHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create test user configurations
   */
  static createTestUser(type: 'admin' | 'instructor' | 'student' = 'student'): TestUserPayload {
    const configs = {
      admin: {
        uid: 'admin-test-uid-12345',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: Role.ADMIN,
        emailVerified: true,
      },
      instructor: {
        uid: 'instructor-test-uid-67890',
        email: 'instructor@test.com',
        name: 'Test Instructor',
        role: Role.INSTRUCTOR,
        emailVerified: true,
      },
      student: {
        uid: 'student-test-uid-abcdef',
        email: 'student@test.com',
        name: 'Test Student',
        role: Role.USER,
        emailVerified: true,
      },
    };

    return configs[type];
  }

  /**
   * Generate test tokens for different user types
   */
  static generateAdminToken(): string {
    return this.generateTestToken(this.createTestUser('admin'));
  }

  static generateInstructorToken(): string {
    return this.generateTestToken(this.createTestUser('instructor'));
  }

  static generateStudentToken(): string {
    return this.generateTestToken(this.createTestUser('student'));
  }

  /**
   * Get authenticated headers for different user types
   */
  static getAdminHeaders(): Record<string, string> {
    return this.getAuthHeaders(this.generateAdminToken());
  }

  static getInstructorHeaders(): Record<string, string> {
    return this.getAuthHeaders(this.generateInstructorToken());
  }

  static getStudentHeaders(): Record<string, string> {
    return this.getAuthHeaders(this.generateStudentToken());
  }

  /**
   * Create custom test user with token
   */
  static createCustomUser(
    uid: string,
    email: string,
    role: Role = Role.USER,
    overrides?: Partial<TestUserPayload>
  ): { user: TestUserPayload; token: string; headers: Record<string, string> } {
    const user: TestUserPayload = {
      uid,
      email,
      name: `Test ${email.split('@')[0]}`,
      role,
      emailVerified: true,
      ...overrides,
    };

    const token = this.generateTestToken(user);
    const headers = this.getAuthHeaders(token);

    return { user, token, headers };
  }

  /**
   * Verify token (for testing purposes)
   */
  static verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate expired token for testing auth failures
   */
  static generateExpiredToken(): string {
    const payload = this.createTestUser('student');
    return this.jwtService.sign({
      ...payload,
      exp: Math.floor(Date.now() / 1000) - 60, // Expired 1 minute ago
    });
  }

  /**
   * Generate invalid token (malformed)
   */
  static generateInvalidToken(): string {
    return 'invalid.token.here';
  }
}