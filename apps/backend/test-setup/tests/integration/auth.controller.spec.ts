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
import { DatabaseHelper } from '../../helpers/database.helper';
import { UserFactory } from '../../factories/user.factory';

describe('AuthController (Integration)', () => {
    let app: INestApplication;
    let module: TestingModule;
    let prisma: PrismaService;
    let firebaseService: FirebaseService;

    beforeAll(async () => {
        // Create testing module with mocked Firebase
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
        // Clean up test data before each test
        await IntegrationTestHelper.cleanup();
    });

    // ============ POST /auth/register ============
    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const registerDto = {
                email: 'newuser@test.com',
                password: 'SecurePass123!',
                name: 'New User',
            };

            const response = await createRequest(app)
                .post('/auth/register')
                .send(registerDto)
                .expect(HttpStatus.CREATED);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('successfully');

            // Verify Firebase createUser was called
            expect(firebaseService.createUser).toHaveBeenCalledWith({
                email: registerDto.email,
                password: registerDto.password,
                displayName: registerDto.name,
            });
        });

        it('should return 400 for invalid email', async () => {
            const registerDto = {
                email: 'invalid-email',
                password: 'SecurePass123!',
            };

            const response = await createRequest(app)
                .post('/auth/register')
                .send(registerDto)
                .expect(HttpStatus.BAD_REQUEST);

            // Validation message can be string or array
            const message = Array.isArray(response.body.message)
                ? response.body.message.join(' ')
                : response.body.message;
            expect(message.toLowerCase()).toContain('email');
        });

        it('should return 400 for short password', async () => {
            const registerDto = {
                email: 'test@test.com',
                password: '123', // Too short
            };

            const response = await createRequest(app)
                .post('/auth/register')
                .send(registerDto)
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.message).toBeDefined();
        });

        it('should return 409 for duplicate email', async () => {
            // Create existing user
            const factory = new UserFactory();
            await factory.createAndSave({ email: 'existing@test.com' });

            const registerDto = {
                email: 'existing@test.com',
                password: 'SecurePass123!',
            };

            const response = await createRequest(app)
                .post('/auth/register')
                .send(registerDto)
                .expect(HttpStatus.CONFLICT);

            expect(response.body.message).toContain('already');
        });
    });

    // ============ POST /auth/login ============
    describe('POST /auth/login', () => {
        it('should login successfully with valid token', async () => {
            // Create user in database
            const { user, token } = await IntegrationTestHelper.createTestUserWithToken({
                email: 'login@test.com',
                name: 'Login User',
                role: Role.USER,
            });

            // Register the token for login (login uses idToken in body)
            IntegrationTestHelper.registerMockToken(token, {
                uid: user.firebaseUid,
                email: user.email,
                email_verified: true,
                name: user.name,
            });

            const response = await createRequest(app)
                .post('/auth/login')
                .send({ idToken: token })
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(user.email);
            expect(response.body.user.role).toBe(Role.USER);
        });

        it('should return 401 for invalid token', async () => {
            const response = await createRequest(app)
                .post('/auth/login')
                .send({ idToken: 'invalid-token' })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });

        it('should return 401 for expired token', async () => {
            const response = await createRequest(app)
                .post('/auth/login')
                .send({ idToken: 'expired-token' })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });

        it('should return 400 for empty token', async () => {
            const response = await createRequest(app)
                .post('/auth/login')
                .send({ idToken: '' })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ GET /auth/profile ============
    describe('GET /auth/profile', () => {
        it('should return user profile for authenticated user', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .get('/auth/profile')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('uid');
            expect(response.body).toHaveProperty('email');
            expect(response.body).toHaveProperty('role');
            expect(response.body.email).toBe(user.email);
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .get('/auth/profile')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toContain('token');
        });

        it('should return 401 for invalid token', async () => {
            const response = await createRequest(app)
                .get('/auth/profile')
                .set({ Authorization: 'Bearer invalid-token' })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ POST /auth/forgot-password ============
    describe('POST /auth/forgot-password', () => {
        it('should accept password reset request', async () => {
            const response = await createRequest(app)
                .post('/auth/forgot-password')
                .send({ email: 'user@test.com' })
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('reset');
        });

        it('should not reveal if email exists', async () => {
            // Non-existent email should get same response for security
            const response = await createRequest(app)
                .post('/auth/forgot-password')
                .send({ email: 'nonexistent@test.com' })
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('message');
        });

        it('should return 400 for invalid email format', async () => {
            const response = await createRequest(app)
                .post('/auth/forgot-password')
                .send({ email: 'not-an-email' })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ POST /auth/refresh ============
    describe('POST /auth/refresh', () => {
        it('should refresh session for authenticated user', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .post('/auth/refresh')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(user.email);
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .post('/auth/refresh')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ GET /auth/users (Admin only) ============
    describe('GET /auth/users', () => {
        it('should return all users for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            // Create some additional users
            const factory = new UserFactory();
            await factory.createAndSave({ email: 'user1@test.com' });
            await factory.createAndSave({ email: 'user2@test.com' });

            const response = await createRequest(app)
                .get('/auth/users')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(3); // Admin + 2 users
        });

        it('should return 403 for non-admin user', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .get('/auth/users')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .get('/auth/users')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ PATCH /auth/users/:id/role (Admin only) ============
    describe('PATCH /auth/users/:id/role', () => {
        it('should update user role for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            // Create a target user to update
            const factory = new UserFactory();
            const targetUser = await factory.createAndSave({
                email: 'target@test.com',
                role: Role.USER,
            });

            const response = await createRequest(app)
                .patch(`/auth/users/${targetUser.id}/role`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ role: Role.INSTRUCTOR })
                .expect(HttpStatus.OK);

            expect(response.body.role).toBe(Role.INSTRUCTOR);
            expect(response.body.id).toBe(targetUser.id);
        });

        it('should return 403 when admin tries to change own role', async () => {
            const { user, token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .patch(`/auth/users/${user.id}/role`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ role: Role.USER })
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toContain('own');
        });

        it('should return 404 for non-existent user', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .patch('/auth/users/99999/role')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ role: Role.INSTRUCTOR })
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });

        it('should return 403 for non-admin user', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const factory = new UserFactory();
            const targetUser = await factory.createAndSave({ email: 'target2@test.com' });

            const response = await createRequest(app)
                .patch(`/auth/users/${targetUser.id}/role`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ role: Role.INSTRUCTOR })
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should return 400 for invalid role', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const factory = new UserFactory();
            const targetUser = await factory.createAndSave({ email: 'target3@test.com' });

            const response = await createRequest(app)
                .patch(`/auth/users/${targetUser.id}/role`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ role: 'INVALID_ROLE' })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.message).toBeDefined();
        });
    });
});
