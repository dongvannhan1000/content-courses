import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { Role } from '@prisma/client';

import { PrismaModule } from '../../src/infra/prisma/prisma.module';
import { PrismaService } from '../../src/infra/prisma/prisma.service';
import { FirebaseService } from '../../src/infra/firebase/firebase.service';
import { FirebaseAuthGuard } from '../../src/modules/auth/guards/firebase-auth.guard';
import { RolesGuard } from '../../src/modules/auth/guards/roles.guard';
import { DatabaseHelper } from './database.helper';
import { UserFactory } from '../factories/user.factory';

/**
 * Mock decoded token structure returned by Firebase
 */
export interface MockDecodedToken {
    uid: string;
    email: string;
    email_verified: boolean;
    name?: string;
}

/**
 * Test user data for integration tests
 */
export interface TestUserData {
    firebaseUid: string;
    email: string;
    name: string;
    role: Role;
    dbId?: number;
}

/**
 * Integration test helper for setting up NestJS testing modules
 * with mocked Firebase authentication and real database
 */
export class IntegrationTestHelper {
    private static mockFirebaseService: Partial<FirebaseService>;
    private static mockTokenMap: Map<string, MockDecodedToken> = new Map();

    /**
     * Create a mock Firebase service that can verify mock tokens
     */
    static createMockFirebaseService(): Partial<FirebaseService> {
        this.mockTokenMap.clear();

        this.mockFirebaseService = {
            verifyIdToken: jest.fn().mockImplementation(async (token: string) => {
                // Check for special error tokens
                if (token === 'invalid-token') {
                    throw new Error('Invalid token');
                }
                if (token === 'expired-token') {
                    throw new Error('Token expired');
                }

                // Look up mock token
                const decodedToken = this.mockTokenMap.get(token);
                if (decodedToken) {
                    return decodedToken;
                }

                // Parse token format: mock-token-{uid}
                if (token.startsWith('mock-token-')) {
                    const uid = token.replace('mock-token-', '');
                    return {
                        uid,
                        email: `${uid}@test.com`,
                        email_verified: true,
                    };
                }

                throw new Error('Token not found in mock registry');
            }),
            createUser: jest.fn().mockResolvedValue({
                uid: 'new-firebase-uid',
                email: 'new@test.com',
                displayName: 'New User',
            }),
            generatePasswordResetLink: jest.fn().mockResolvedValue('https://reset-link.com'),
            getAuth: jest.fn().mockReturnValue({}),
        };

        return this.mockFirebaseService;
    }

    /**
     * Register a mock token for a specific user
     */
    static registerMockToken(token: string, decodedToken: MockDecodedToken): void {
        this.mockTokenMap.set(token, decodedToken);
    }

    /**
     * Generate a mock token for a test user and register it
     */
    static generateTokenForUser(user: TestUserData): string {
        const token = `mock-token-${user.firebaseUid}`;
        this.registerMockToken(token, {
            uid: user.firebaseUid,
            email: user.email,
            email_verified: true,
            name: user.name,
        });
        return token;
    }

    /**
     * Get authorization headers for a user
     */
    static getAuthHeaders(token: string): Record<string, string> {
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    /**
     * Create test module with common providers
     */
    static async createTestingModule(
        moduleImports: any[],
        extraProviders: any[] = [],
    ): Promise<TestingModule> {
        const mockFirebaseService = this.createMockFirebaseService();

        // Import FirebaseModule to provide the structure, then override the service
        const { FirebaseModule } = await import('../../src/infra/firebase/firebase.module');
        const { CacheModule } = await import('@nestjs/cache-manager');

        return Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env.test',
                }),
                CacheModule.register({ isGlobal: true }),
                PrismaModule,
                FirebaseModule,
                ...moduleImports,
            ],
            providers: [
                {
                    provide: APP_GUARD,
                    useClass: FirebaseAuthGuard,
                },
                {
                    provide: APP_GUARD,
                    useClass: RolesGuard,
                },
                ...extraProviders,
            ],
        })
            .overrideProvider(FirebaseService)
            .useValue(mockFirebaseService)
            .compile();
    }

    /**
     * Create and configure NestJS application for testing
     */
    static async createTestApp(module: TestingModule): Promise<INestApplication> {
        const app = module.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                transformOptions: {
                    enableImplicitConversion: true,
                },
            }),
        );

        await app.init();
        return app;
    }

    /**
     * Create a test user in database and generate token
     */
    static async createTestUserWithToken(
        overrides?: Partial<TestUserData>,
    ): Promise<{ user: any; token: string }> {
        const factory = new UserFactory();

        // Only include overrides that are actually defined
        const factoryOverrides: Record<string, any> = {
            role: overrides?.role || Role.USER,
        };
        if (overrides?.firebaseUid) factoryOverrides.firebaseUid = overrides.firebaseUid;
        if (overrides?.email) factoryOverrides.email = overrides.email;
        if (overrides?.name) factoryOverrides.name = overrides.name;

        const user = await factory.createAndSave(factoryOverrides);

        const testUserData: TestUserData = {
            firebaseUid: user.firebaseUid,
            email: user.email,
            name: user.name || 'Test User',
            role: user.role,
            dbId: user.id,
        };

        const token = this.generateTokenForUser(testUserData);
        return { user, token };
    }

    /**
     * Create admin user with token
     */
    static async createAdminWithToken(): Promise<{ user: any; token: string }> {
        return this.createTestUserWithToken({ role: Role.ADMIN });
    }

    /**
     * Create instructor user with token
     */
    static async createInstructorWithToken(): Promise<{ user: any; token: string }> {
        return this.createTestUserWithToken({ role: Role.INSTRUCTOR });
    }

    /**
     * Create student user with token
     */
    static async createStudentWithToken(): Promise<{ user: any; token: string }> {
        return this.createTestUserWithToken({ role: Role.USER });
    }

    /**
     * Clean up test data
     */
    static async cleanup(): Promise<void> {
        await DatabaseHelper.cleanupTestData();
        this.mockTokenMap.clear();
    }

    /**
     * Close database connection
     */
    static async closeConnection(): Promise<void> {
        await DatabaseHelper.closeConnection();
    }
}

/**
 * Supertest wrapper for easier HTTP testing
 */
export function createRequest(app: INestApplication) {
    return request(app.getHttpServer());
}
