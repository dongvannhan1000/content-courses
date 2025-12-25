import { INestApplication, HttpStatus } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Role, CourseStatus, PaymentStatus } from '@prisma/client';

import { PaymentsModule } from '../../../src/modules/payments/payments.module';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import {
    IntegrationTestHelper,
    createRequest,
} from '../../helpers/integration-test.helper';
import { CategoryFactory } from '../../factories/category.factory';
import { CourseFactory } from '../../factories/course.factory';

describe('PaymentsController (Integration)', () => {
    let app: INestApplication;
    let module: TestingModule;
    let prisma: PrismaService;

    beforeAll(async () => {
        module = await IntegrationTestHelper.createTestingModule([PaymentsModule]);
        app = await IntegrationTestHelper.createTestApp(module);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        await app.close();
        await IntegrationTestHelper.closeConnection();
    });

    beforeEach(async () => {
        await IntegrationTestHelper.cleanup();
    });

    // Helper to create a published paid course
    async function createPaidCourse(price: number = 100000) {
        const categoryFactory = new CategoryFactory();
        const category = await categoryFactory.createAndSave({
            name: 'Test Category',
            slug: 'test-cat-' + Date.now(),
            isActive: true,
        });

        const { user: instructor } = await IntegrationTestHelper.createInstructorWithToken();

        const courseFactory = new CourseFactory();
        const course = await courseFactory.createAndSave({
            title: 'Test Course',
            slug: 'test-course-' + Date.now(),
            categoryId: category.id,
            instructorId: instructor.id,
            status: CourseStatus.PUBLISHED,
            price,
        });

        return { course, instructor };
    }

    // Helper to create a payment (needs enrollment first due to FK)
    async function createPayment(userId: number, courseId: number, amount: number) {
        // First create enrollment (Payment has FK to Enrollment)
        const enrollment = await prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: 'ACTIVE',
                progressPercent: 0,
            },
        });

        return prisma.payment.create({
            data: {
                userId,
                amount,
                status: PaymentStatus.COMPLETED,
                transactionId: `TXN_${Date.now()}`,
                enrollmentId: enrollment.id,
            },
        });
    }

    // ============ POST /payments/create ============
    describe('POST /payments/create', () => {
        it('should create payment for user', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPaidCourse();

            const response = await createRequest(app)
                .post('/payments/create')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({
                    courseId: course.id,
                    returnUrl: 'http://localhost:3000/success',
                    cancelUrl: 'http://localhost:3000/cancel',
                });

            // Accept various success statuses
            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .post('/payments/create')
                .send({ courseId: 1 })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });

        it('should return 404 for non-existent course', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .post('/payments/create')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({
                    courseId: 99999,
                    returnUrl: 'http://localhost:3000/success',
                    cancelUrl: 'http://localhost:3000/cancel',
                })
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ POST /payments/create-batch ============
    describe('POST /payments/create-batch', () => {
        it('should create batch payment for user', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();
            const { course: course1 } = await createPaidCourse();
            const { course: course2 } = await createPaidCourse();

            const response = await createRequest(app)
                .post('/payments/create-batch')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({
                    courseIds: [course1.id, course2.id],
                    returnUrl: 'http://localhost:3000/success',
                    cancelUrl: 'http://localhost:3000/cancel',
                });

            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .post('/payments/create-batch')
                .send({ courseIds: [1, 2] })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ POST /payments/webhook ============
    describe('POST /payments/webhook', () => {
        it('should be accessible without authentication (public)', async () => {
            // Webhook should not return 401, might return 400 or 403 for bad data
            const response = await createRequest(app)
                .post('/payments/webhook')
                .send({});

            // Explicitly not 401 - webhooks must be public
            expect(response.status).not.toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    // ============ GET /payments/verify/:orderCode ============
    describe('GET /payments/verify/:orderCode', () => {
        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .get('/payments/verify/12345')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });

        it('should return 404 for non-existent order', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .get('/payments/verify/99999999')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ GET /payments/my-payments ============
    describe('GET /payments/my-payments', () => {
        it('should return user payment history', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPaidCourse();
            await createPayment(user.id, course.id, course.price || 100000);

            const response = await createRequest(app)
                .get('/payments/my-payments')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .get('/payments/my-payments')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ GET /payments/mock-pay/:orderCode (Dev only) ============
    describe('GET /payments/mock-pay/:orderCode', () => {
        it('should be accessible without authentication (public)', async () => {
            const response = await createRequest(app)
                .get('/payments/mock-pay/12345');

            // Mock endpoint is public, might return 404 or success
            expect(response.status).not.toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    // ============ GET /payments/admin (Admin only) ============
    describe('GET /payments/admin', () => {
        it('should return all payments for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .get('/payments/admin')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('payments');
            expect(Array.isArray(response.body.payments)).toBe(true);
        });

        it('should return 403 for non-admin', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .get('/payments/admin')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .get('/payments/admin')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ GET /payments/admin/:id (Admin only) ============
    describe('GET /payments/admin/:id', () => {
        it('should return payment by ID for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();
            const { user } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPaidCourse();
            const payment = await createPayment(user.id, course.id, course.price || 100000);

            const response = await createRequest(app)
                .get(`/payments/admin/${payment.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body.id).toBe(payment.id);
        });

        it('should return 404 for non-existent payment', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .get('/payments/admin/99999')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });

        it('should return 403 for non-admin', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .get('/payments/admin/1')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ POST /payments/admin/:id/refund (Admin only) ============
    describe('POST /payments/admin/:id/refund', () => {
        it('should return 404 for non-existent payment', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .post('/payments/admin/99999/refund')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });

        it('should return 403 for non-admin', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .post('/payments/admin/1/refund')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .post('/payments/admin/1/refund')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });
});
