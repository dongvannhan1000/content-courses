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
 * Provides utilities for generating mock Firebase tokens and creating test users
 * 
 * Note: This uses mock Firebase tokens for testing. The actual Firebase Admin SDK
 * is mocked in firebase.mock.ts to verify these tokens.
 */
export class AuthHelper {
  /**
   * Generate a mock Firebase ID token for testing
   * The MockFirebase class will parse this token based on role keywords
   */
  static generateMockToken(payload: TestUserPayload): string {
    // Create a mock token that includes role info for MockFirebase to parse
    const rolePrefix = payload.role?.toLowerCase() || 'user';
    return `mock-firebase-token-${rolePrefix}-${payload.uid}`;
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
    return this.generateMockToken(this.createTestUser('admin'));
  }

  static generateInstructorToken(): string {
    return this.generateMockToken(this.createTestUser('instructor'));
  }

  static generateStudentToken(): string {
    return this.generateMockToken(this.createTestUser('student'));
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

    const token = this.generateMockToken(user);
    const headers = this.getAuthHeaders(token);

    return { user, token, headers };
  }

  /**
   * Generate expired token for testing auth failures
   * MockFirebase will recognize 'expired-token' and throw appropriate error
   */
  static generateExpiredToken(): string {
    return 'expired-token';
  }

  /**
   * Generate invalid token (malformed)
   * MockFirebase will recognize 'invalid-token' and throw appropriate error
   */
  static generateInvalidToken(): string {
    return 'invalid-token';
  }

  /**
   * Get headers for unauthenticated requests
   */
  static getUnauthenticatedHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }
}