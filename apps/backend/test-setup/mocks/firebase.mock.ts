import { faker } from '@faker-js/faker';

export interface MockFirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
  photoURL?: string;
  customClaims?: { role?: string };
}

/**
 * Firebase mock utilities for testing
 * Provides mock Firebase Admin SDK functionality
 */
export class MockFirebase {
  /**
   * Create a mock Firebase user
   */
  static createMockUser(overrides?: Partial<MockFirebaseUser>): MockFirebaseUser {
    return {
      uid: faker.datatype.uuid(),
      email: faker.internet.email(),
      displayName: faker.name.fullName(),
      emailVerified: true,
      photoURL: faker.image.avatar(),
      ...overrides,
    };
  }

  /**
   * Create mock admin user
   */
  static createMockAdmin(): MockFirebaseUser {
    return this.createMockUser({
      uid: 'admin-test-uid',
      email: 'admin@test.com',
      displayName: 'Test Admin',
      customClaims: { role: 'ADMIN' },
    });
  }

  /**
   * Create mock instructor user
   */
  static createMockInstructor(): MockFirebaseUser {
    return this.createMockUser({
      uid: 'instructor-test-uid',
      email: 'instructor@test.com',
      displayName: 'Test Instructor',
      customClaims: { role: 'INSTRUCTOR' },
    });
  }

  /**
   * Create mock student user
   */
  static createMockStudent(): MockFirebaseUser {
    return this.createMockUser({
      uid: 'student-test-uid',
      email: 'student@test.com',
      displayName: 'Test Student',
      customClaims: { role: 'USER' },
    });
  }

  /**
   * Mock Firebase Admin SDK
   */
  static mockAdmin() {
    const users = new Map<string, MockFirebaseUser>();

    return {
      auth: () => ({
        verifyIdToken: jest.fn().mockImplementation(async (token: string) => {
          // Simple mock token parsing for testing
          if (token === 'invalid-token') {
            throw new Error('Invalid token');
          }
          if (token === 'expired-token') {
            throw new Error('Token expired');
          }

          // Parse mock tokens to return appropriate users
          if (token.includes('admin')) {
            return this.createMockAdmin();
          }
          if (token.includes('instructor')) {
            return this.createMockInstructor();
          }
          if (token.includes('student')) {
            return this.createMockStudent();
          }

          // Default user
          return this.createMockUser();
        }),

        createCustomToken: jest.fn().mockImplementation(async (uid: string) => {
          return `mock-custom-token-${uid}`;
        }),

        getUser: jest.fn().mockImplementation(async (uid: string) => {
          return users.get(uid) || null;
        }),

        updateUser: jest.fn().mockImplementation(async (uid: string, updates: any) => {
          const existingUser = users.get(uid);
          if (existingUser) {
            const updatedUser = { ...existingUser, ...updates };
            users.set(uid, updatedUser);
            return updatedUser;
          }
          throw new Error('User not found');
        }),

        deleteUser: jest.fn().mockImplementation(async (uid: string) => {
          if (users.has(uid)) {
            users.delete(uid);
            return;
          }
          throw new Error('User not found');
        }),

        createUser: jest.fn().mockImplementation(async (userData: any) => {
          const newUser = this.createMockUser(userData);
          users.set(newUser.uid, newUser);
          return newUser;
        }),

        listUsers: jest.fn().mockImplementation(async () => {
          return {
            users: Array.from(users.values()),
            pageToken: null,
          };
        }),
      }),

      // Mock other Firebase services
      firestore: () => ({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            set: jest.fn().mockResolvedValue(undefined),
            get: jest.fn().mockResolvedValue({ exists: false }),
            update: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
          }),
          add: jest.fn().mockResolvedValue({ id: faker.datatype.uuid() }),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ docs: [] }),
        }),
      }),

      storage: () => ({
        bucket: jest.fn().mockReturnValue({
          file: jest.fn().mockReturnValue({
            create: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
            get: jest.fn().mockResolvedValue([0], null),
            makePublic: jest.fn().mockResolvedValue(undefined),
            getSignedUrl: jest.fn().mockResolvedValue([faker.internet.url()]),
          }),
          upload: jest.fn().mockResolvedValue([[0], null]),
        }),
      }),
    };
  }

  /**
   * Mock Firebase Auth emulator
   */
  static mockAuthEmulator() {
    return {
      url: 'http://localhost:9099',
      ready: true,
    };
  }

  /**
   * Setup Firebase mocks for testing
   */
  static setupMocks() {
    const mockFirebase = this.mockAdmin();

    // Mock Firebase Admin SDK
    jest.mock('firebase-admin', () => ({
      credential: {
        cert: jest.fn(),
      },
      initializeApp: jest.fn(() => mockFirebase),
      apps: [mockFirebase],
    }));

    // Mock Firebase Auth emulator if needed
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    }

    return mockFirebase;
  }

  /**
   * Reset all Firebase mocks
   */
  static resetMocks() {
    jest.clearAllMocks();
  }
}