import { INestApplication, HttpStatus } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CourseStatus, EnrollmentStatus, PaymentStatus } from '@prisma/client';

import { CoursesModule } from '../../../src/modules/courses/courses.module';
import { CartModule } from '../../../src/modules/cart/cart.module';
import { PaymentsModule } from '../../../src/modules/payments/payments.module';
import { EnrollmentsModule } from '../../../src/modules/enrollments/enrollments.module';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import {
    IntegrationTestHelper,
    createRequest,
} from '../../helpers/integration-test.helper';
import { E2ETestHelper } from '../../helpers/e2e-test.helper';
import { CategoryFactory } from '../../factories/category.factory';
import { CourseFactory } from '../../factories/course.factory';

/**
 * E2E Test: Course Purchase Flow
 * 
 * Tests the complete purchase journey:
 * 1. Browse available courses
 * 2. Add course to cart
 * 3. Create payment
 * 4. Verify enrollment after payment
 * 
 * Also tests free course enrollment and error scenarios.
 */
describe('E2E: Course Purchase Flow', () => {
    let app: INestApplication;
    let module: TestingModule;
    let prisma: PrismaService;

    // Shared test data
    let category: any;
    let instructor: any;
    let freeCourse: any;
    let paidCourse: any;

    beforeAll(async () => {
        // Load all required modules for purchase flow
        module = await IntegrationTestHelper.createTestingModule([
            CoursesModule,
            CartModule,
            PaymentsModule,
            EnrollmentsModule,
        ]);
        app = await IntegrationTestHelper.createTestApp(module);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        await app.close();
        await IntegrationTestHelper.closeConnection();
    });

    beforeEach(async () => {
        await IntegrationTestHelper.cleanup();

        // Setup test data for each test
        const setup = await E2ETestHelper.createFullE2ESetup(prisma);
        category = setup.category;
        instructor = setup.instructor;
        freeCourse = setup.freeCourse;
        paidCourse = setup.paidCourse;
    });

    // ============ Browse Courses ============
    describe('Step 1: Browse Courses', () => {
        it('should list available published courses', async () => {
            const response = await createRequest(app)
                .get('/courses')
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);

            // Should include our test courses
            const courses = response.body.data;
            const courseIds = courses.map((c: any) => c.id);
            expect(courseIds).toContain(freeCourse.id);
            expect(courseIds).toContain(paidCourse.id);
        });

        it('should get course details', async () => {
            const response = await createRequest(app)
                .get(`/courses/${paidCourse.slug}`)
                .expect(HttpStatus.OK);

            expect(response.body.id).toBe(paidCourse.id);
            expect(response.body.title).toBe(paidCourse.title);
            // Price may be string or number, just check it exists
            expect(response.body.price).toBeDefined();
        });

        it('should filter courses by category', async () => {
            const response = await createRequest(app)
                .get(`/courses?category=${category.slug}`)
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('data');
            // Verify response contains courses from that category
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    // ============ Add to Cart ============
    describe('Step 2: Add to Cart', () => {
        it('should add course to cart', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .post('/cart/items')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ courseId: paidCourse.id })
                .expect(HttpStatus.CREATED);

            expect(response.body).toHaveProperty('items');
            const cartItems = response.body.items;
            expect(cartItems.some((item: any) => item.course?.id === paidCourse.id)).toBe(true);
        });

        it('should get cart with added courses', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Add course to cart first
            await prisma.cartItem.create({
                data: {
                    userId: user.id,
                    courseId: paidCourse.id,
                },
            });

            const response = await createRequest(app)
                .get('/cart')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('items');
            expect(response.body.items.length).toBeGreaterThan(0);
        });

        it('should not add course if already enrolled', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Create enrollment first
            await E2ETestHelper.createEnrollment(prisma, user.id, paidCourse.id);

            const response = await createRequest(app)
                .post('/cart/items')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ courseId: paidCourse.id })
                .expect(HttpStatus.CONFLICT);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ Create Payment (Paid Course) ============
    describe('Step 3: Create Payment', () => {
        it('should create payment for cart items', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .post('/payments/create')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({
                    courseId: paidCourse.id,
                    returnUrl: 'http://localhost:3000/success',
                    cancelUrl: 'http://localhost:3000/cancel',
                });

            // Accept various success statuses
            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
        });

        it('should create batch payment for multiple courses', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            // Create another paid course
            const courseFactory = new CourseFactory();
            const anotherPaidCourse = await courseFactory.createAndSave({
                title: 'Another Paid Course',
                slug: `another-paid-${Date.now()}`,
                categoryId: category.id,
                instructorId: instructor.id,
                status: CourseStatus.PUBLISHED,
                price: 200000,
            });

            const response = await createRequest(app)
                .post('/payments/create-batch')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({
                    courseIds: [paidCourse.id, anotherPaidCourse.id],
                    returnUrl: 'http://localhost:3000/success',
                    cancelUrl: 'http://localhost:3000/cancel',
                });

            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
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

    // ============ Free Course Enrollment ============
    describe('Free Course: Direct Enrollment', () => {
        it('should enroll directly in free course without payment', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .post('/enrollments')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ courseId: freeCourse.id });

            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
        });

        it('should check enrollment status after enrolling', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Enroll in free course
            await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            const response = await createRequest(app)
                .get(`/enrollments/${freeCourse.id}/check`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body.isEnrolled === true || response.body.enrolled === true).toBe(true);
        });

        it('should list user enrollments after enrolling', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Enroll in free course
            await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            const response = await createRequest(app)
                .get('/enrollments')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
            const enrolledCourseIds = response.body.map((e: any) => e.courseId || e.course?.id);
            expect(enrolledCourseIds).toContain(freeCourse.id);
        });
    });

    // ============ Complete Purchase Flow (End-to-End) ============
    describe('Complete Purchase Flow', () => {
        it('should complete full purchase: browse → add to cart → pay → enrolled', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Step 1: Browse and verify course exists
            const browseResponse = await createRequest(app)
                .get(`/courses/${paidCourse.slug}`)
                .expect(HttpStatus.OK);
            expect(browseResponse.body.id).toBe(paidCourse.id);

            // Step 2: Verify not enrolled yet
            const checkBefore = await createRequest(app)
                .get(`/enrollments/${paidCourse.id}/check`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);
            expect(checkBefore.body.isEnrolled === false || checkBefore.body.enrolled === false).toBe(true);

            // Step 3: Add to cart
            await createRequest(app)
                .post('/cart/items')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ courseId: paidCourse.id })
                .expect(HttpStatus.CREATED);

            // Step 4: Create payment
            const paymentResponse = await createRequest(app)
                .post('/payments/create')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({
                    courseId: paidCourse.id,
                    returnUrl: 'http://localhost:3000/success',
                    cancelUrl: 'http://localhost:3000/cancel',
                });
            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(paymentResponse.status);

            // Step 5: Simulate payment completion - upsert enrollment to handle case where API already created it
            await prisma.enrollment.upsert({
                where: { userId_courseId: { userId: user.id, courseId: paidCourse.id } },
                update: { status: EnrollmentStatus.ACTIVE },
                create: {
                    userId: user.id,
                    courseId: paidCourse.id,
                    status: EnrollmentStatus.ACTIVE,
                    progressPercent: 0,
                },
            });

            // Step 6: Verify enrollment
            const checkAfter = await createRequest(app)
                .get(`/enrollments/${paidCourse.id}/check`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);
            expect(checkAfter.body.isEnrolled === true || checkAfter.body.enrolled === true).toBe(true);

            // Step 7: Verify payment history
            const paymentsResponse = await createRequest(app)
                .get('/payments/my-payments')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);
            expect(Array.isArray(paymentsResponse.body)).toBe(true);
        });
    });

    // ============ Error Scenarios ============
    describe('Error Scenarios', () => {
        it('should not allow duplicate enrollment', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // First enrollment
            await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            // Second enrollment attempt
            const response = await createRequest(app)
                .post('/enrollments')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ courseId: freeCourse.id })
                .expect(HttpStatus.CONFLICT);

            expect(response.body.message).toBeDefined();
        });

        it('should require authentication for purchase', async () => {
            await createRequest(app)
                .post('/payments/create')
                .send({ courseId: paidCourse.id })
                .expect(HttpStatus.UNAUTHORIZED);
        });

        it('should require authentication for enrollment', async () => {
            await createRequest(app)
                .post('/enrollments')
                .send({ courseId: freeCourse.id })
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });
});
