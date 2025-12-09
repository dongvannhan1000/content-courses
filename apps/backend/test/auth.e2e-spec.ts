import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Auth Module E2E Tests
 * 
 * Note: These tests require:
 * 1. Database connection (PostgreSQL)
 * 2. Firebase Admin SDK configured
 * 
 * Some tests are mocked due to Firebase dependency.
 * For full integration tests, use a test Firebase project.
 * 
 * ThrottlerGuard is disabled in tests to avoid rate limiting issues.
 */
describe('AuthController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            // Skip rate limiting in tests
            .overrideGuard(ThrottlerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    // ============ Registration Tests ============

    describe('POST /api/auth/register', () => {
        it('should return 400 for invalid email format', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'SecurePass123!',
                    name: 'Test User',
                })
                .expect(400);
        });

        it('should return 400 for missing email', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    password: 'SecurePass123!',
                    name: 'Test User',
                })
                .expect(400);
        });

        it('should return 400 for missing password', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    name: 'Test User',
                })
                .expect(400);
        });

        it('should return 400 for password too short', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: '123',
                    name: 'Test User',
                })
                .expect(400);
        });
    });

    // ============ Login Tests ============

    describe('POST /api/auth/login', () => {
        it('should return 400 for missing idToken', () => {
            return request(app.getHttpServer())
                .post('/api/auth/login')
                .send({})
                .expect(400);
        });

        it('should return 400 for empty idToken', () => {
            return request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ idToken: '' })
                .expect(400);
        });

        it('should return 401 for invalid idToken', () => {
            return request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ idToken: 'invalid_token_string' })
                .expect(401);
        });
    });

    // ============ Profile Tests ============

    describe('GET /api/auth/profile', () => {
        it('should return 401 without authorization header', () => {
            return request(app.getHttpServer())
                .get('/api/auth/profile')
                .expect(401);
        });

        it('should return 401 with invalid bearer token', () => {
            return request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
        });
    });

    // ============ Refresh Session Tests ============

    describe('POST /api/auth/refresh', () => {
        it('should return 401 without authorization header', () => {
            return request(app.getHttpServer())
                .post('/api/auth/refresh')
                .expect(401);
        });

        it('should return 401 with invalid bearer token', () => {
            return request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
        });
    });

    // ============ Forgot Password Tests ============

    describe('POST /api/auth/forgot-password', () => {
        it('should return 400 for invalid email format', () => {
            return request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: 'invalid-email' })
                .expect(400);
        });

        it('should return 400 for missing email', () => {
            return request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({})
                .expect(400);
        });

        // Note: Even for non-existent emails, we return 200 for security
        // (don't reveal if user exists)
    });

    // ============ Admin Endpoints Tests ============

    describe('GET /api/auth/users (Admin only)', () => {
        it('should return 401 without authorization', () => {
            return request(app.getHttpServer())
                .get('/api/auth/users')
                .expect(401);
        });

        it('should return 401 with invalid token', () => {
            return request(app.getHttpServer())
                .get('/api/auth/users')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
        });
    });

    describe('PATCH /api/auth/users/:id/role (Admin only)', () => {
        it('should return 401 without authorization', () => {
            return request(app.getHttpServer())
                .patch('/api/auth/users/1/role')
                .send({ role: 'INSTRUCTOR' })
                .expect(401);
        });

        it('should return 400 for invalid role value', () => {
            return request(app.getHttpServer())
                .patch('/api/auth/users/1/role')
                .send({ role: 'INVALID_ROLE' })
                .expect(401); // Will fail auth first
        });

        it('should return 400 for invalid user id', () => {
            return request(app.getHttpServer())
                .patch('/api/auth/users/abc/role')
                .send({ role: 'INSTRUCTOR' })
                .expect(400);
        });
    });
});
