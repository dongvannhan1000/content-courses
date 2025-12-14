/**
 * Test Infrastructure Index
 * Central exports for all testing utilities
 */

// Database helpers
export { DatabaseHelper } from './helpers/database.helper';

// Authentication helpers
export { AuthHelper, type TestUserPayload } from './helpers/auth.helper';

// Mock utilities
export { MockFirebase, type MockFirebaseUser } from './mocks/firebase.mock';
export { MockPayOS, type MockPaymentOrder, type MockPaymentInfo } from './mocks/payos.mock';

// Data factories
export { BaseFactory } from './factories/base.factory';
export { UserFactory } from './factories/user.factory';
export { CategoryFactory } from './factories/category.factory';
export { CourseFactory } from './factories/course.factory';
export { PaymentFactory } from './factories/payment.factory';

// Re-export commonly used Prisma types for convenience
export {
  User,
  Category,
  Course,
  Lesson,
  Enrollment,
  Payment,
  Media,
  Progress,
  Review,
  Role,
  CourseStatus,
  EnrollmentStatus,
  PaymentStatus,
  MediaType,
  LessonType,
} from '@prisma/client';

// Test configuration constants
export const TEST_CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/nghe_content_test',
  JWT_SECRET: process.env.JWT_SECRET || 'test-secret-key-for-testing-only',
  NODE_ENV: 'test',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'test-project',
  PAYOS_MOCK_MODE: process.env.PAYOS_MOCK_MODE === 'true',
} as const;

// Default test users
export const TEST_USERS = {
  ADMIN: {
    uid: 'admin-test-uid',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  },
  INSTRUCTOR: {
    uid: 'instructor-test-uid',
    email: 'instructor@test.com',
    name: 'Test Instructor',
    role: 'INSTRUCTOR' as const,
  },
  STUDENT: {
    uid: 'student-test-uid',
    email: 'student@test.com',
    name: 'Test Student',
    role: 'USER' as const,
  },
} as const;

// Helper function to setup test environment
export async function setupTestEnvironment() {
  process.env.NODE_ENV = 'test';

  // Setup mocks
  MockFirebase.setupMocks();
  MockPayOS.setupMocks();

  // Wait for database connection
  await DatabaseHelper.ensureTestDatabase();

  return {
    config: TEST_CONFIG,
    users: TEST_USERS,
  };
}

// Helper function to cleanup test environment
export async function cleanupTestEnvironment() {
  MockFirebase.resetMocks();
  MockPayOS.resetMocks();
  await DatabaseHelper.closeConnection();
}