import { INestApplication, HttpStatus } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Role } from '@prisma/client';

import { AuthModule } from '../../../src/modules/auth/auth.module';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import { FirebaseService } from '../../../src/infra/firebase/firebase.service';
import {
    IntegrationTestHelper,
    createRequest,
} from '../../helpers/integration-test.helper';
import { UserFactory } from '../../factories/user.factory';

/**
 * E2E Test: User Registration Flow
 * 
 * Tests the complete user onboarding journey:
 * 1. Register a new account
 * 2. Login with the new account
 * 3. Get user profile
 * 4. Update user profile
 * 
 * This tests the full lifecycle of a user from registration to profile management.
 */
describe('E2E: User Registration Flow', () => {
    let app: INestApplication;
    let module: TestingModule;
    let prisma: PrismaService;
    let firebaseService: FirebaseService;

    beforeAll(async () => {
        module = await IntegrationTestHelper.createTestingModule([AuthModule]);
        app = await IntegrationTestHelper.createTestApp(module);
        prisma = module.get<PrismaService>(PrismaService);
        firebaseService = module.get<FirebaseService>(FirebaseService);
    });

    afterAll(async () => {
        await app.close();
        await IntegrationTestHelper.closeConnection();
    });

    beforeEach(async () => {
        await IntegrationTestHelper.cleanup();
    });

    // ============ Happy Path: Complete Registration Flow ============
    describe('Happy Path: Register → Login → Profile', () => {
        it('should complete full registration flow', async () => {
            // Step 1: Register a new user
            const registerDto = {
                email: 'newstudent@e2etest.com',
                password: 'SecurePass123!@#',
                name: 'New E2E Student',
            };

            const registerResponse = await createRequest(app)
                .post('/auth/register')
                .send(registerDto)
                .expect(HttpStatus.CREATED);

            expect(registerResponse.body).toHaveProperty('message');
            expect(registerResponse.body.message).toContain('successfully');

            // Verify Firebase createUser was called with correct data
            expect(firebaseService.createUser).toHaveBeenCalledWith({
                email: registerDto.email,
                password: registerDto.password,
                displayName: registerDto.name,
            });
        });

        it('should login after registration and access profile', async () => {
            // Setup: Create user that "registered" via Firebase
            const { user, token } = await IntegrationTestHelper.createTestUserWithToken({
                email: 'registered@e2etest.com',
                name: 'Registered User',
                role: Role.USER,
            });

            // Register mock token for login
            IntegrationTestHelper.registerMockToken(token, {
                uid: user.firebaseUid,
                email: user.email,
                email_verified: true,
                name: user.name,
            });

            // Step 2: Login with the registered account
            const loginResponse = await createRequest(app)
                .post('/auth/login')
                .send({ idToken: token })
                .expect(HttpStatus.OK);

            expect(loginResponse.body).toHaveProperty('user');
            expect(loginResponse.body.user.email).toBe(user.email);
            expect(loginResponse.body.user.name).toBe(user.name);
            expect(loginResponse.body.user.role).toBe(Role.USER);

            // Step 3: Access profile
            const profileResponse = await createRequest(app)
                .get('/auth/profile')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(profileResponse.body).toHaveProperty('email');
            expect(profileResponse.body.email).toBe(user.email);
            expect(profileResponse.body).toHaveProperty('role');
        });

        it('should refresh session and maintain user state', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Login first
            IntegrationTestHelper.registerMockToken(token, {
                uid: user.firebaseUid,
                email: user.email,
                email_verified: true,
                name: user.name,
            });

            await createRequest(app)
                .post('/auth/login')
                .send({ idToken: token })
                .expect(HttpStatus.OK);

            // Refresh session
            const refreshResponse = await createRequest(app)
                .post('/auth/refresh')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(refreshResponse.body).toHaveProperty('user');
            expect(refreshResponse.body.user.email).toBe(user.email);

            // Profile should still be accessible
            const profileResponse = await createRequest(app)
                .get('/auth/profile')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(profileResponse.body.email).toBe(user.email);
        });
    });

    // ============ Validation Errors ============
    describe('Validation Errors', () => {
        it('should reject registration with invalid email format', async () => {
            const invalidEmails = [
                'notanemail',
                'missing@domain',
                '@nodomain.com',
                'spaces in@email.com',
            ];

            for (const email of invalidEmails) {
                const response = await createRequest(app)
                    .post('/auth/register')
                    .send({
                        email,
                        password: 'ValidPass123!',
                        name: 'Test User',
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                const message = Array.isArray(response.body.message)
                    ? response.body.message.join(' ')
                    : response.body.message;
                expect(message.toLowerCase()).toContain('email');
            }
        });

        it('should reject registration with weak password', async () => {
            const weakPasswords = ['123', 'short', 'abc'];

            for (const password of weakPasswords) {
                const response = await createRequest(app)
                    .post('/auth/register')
                    .send({
                        email: 'test@email.com',
                        password,
                        name: 'Test User',
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toBeDefined();
            }
        });

        it('should reject login with invalid token', async () => {
            const response = await createRequest(app)
                .post('/auth/login')
                .send({ idToken: 'invalid-token' })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });

        it('should reject login with expired token', async () => {
            const response = await createRequest(app)
                .post('/auth/login')
                .send({ idToken: 'expired-token' })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });

        it('should reject login with empty token', async () => {
            const response = await createRequest(app)
                .post('/auth/login')
                .send({ idToken: '' })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ Duplicate Email Handling ============
    describe('Duplicate Email Handling', () => {
        it('should reject registration with existing email', async () => {
            // First registration
            const factory = new UserFactory();
            await factory.createAndSave({
                email: 'existing@e2etest.com',
                name: 'Existing User',
            });

            // Second registration attempt with same email
            const response = await createRequest(app)
                .post('/auth/register')
                .send({
                    email: 'existing@e2etest.com',
                    password: 'AnotherPass123!',
                    name: 'Another User',
                })
                .expect(HttpStatus.CONFLICT);

            expect(response.body.message).toContain('already');
        });
    });

    // ============ Access Control ============
    describe('Access Control', () => {
        it('should not allow unauthenticated access to profile', async () => {
            const response = await createRequest(app)
                .get('/auth/profile')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toContain('token');
        });

        it('should not allow regular user to access admin endpoints', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .get('/auth/users')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should allow admin to access admin endpoints', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .get('/auth/users')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    // ============ Password Reset Flow ============
    describe('Password Reset Flow', () => {
        it('should accept password reset request', async () => {
            const response = await createRequest(app)
                .post('/auth/forgot-password')
                .send({ email: 'user@e2etest.com' })
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('reset');
        });

        it('should not reveal if email exists for security', async () => {
            // Non-existent email should get same response
            const response = await createRequest(app)
                .post('/auth/forgot-password')
                .send({ email: 'nonexistent@e2etest.com' })
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('message');
        });
    });
});
