import { INestApplication, HttpStatus } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Role, CourseStatus, EnrollmentStatus } from '@prisma/client';

import { EnrollmentsModule } from '../../../src/modules/enrollments/enrollments.module';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import {
    IntegrationTestHelper,
    createRequest,
} from '../../helpers/integration-test.helper';
import { CategoryFactory } from '../../factories/category.factory';
import { CourseFactory } from '../../factories/course.factory';

describe('EnrollmentsController (Integration)', () => {
    let app: INestApplication;
    let module: TestingModule;
    let prisma: PrismaService;

    beforeAll(async () => {
        module = await IntegrationTestHelper.createTestingModule([EnrollmentsModule]);
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

    // Helper to create a published course
    async function createPublishedCourse() {
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
            price: 0, // Free course for easy enrollment
        });

        return { course, instructor };
    }

    // Helper to create enrollment
    async function createEnrollment(userId: number, courseId: number) {
        return prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: EnrollmentStatus.ACTIVE,
                progressPercent: 0,
            },
        });
    }

    // ============ GET /enrollments ============
    describe('GET /enrollments', () => {
        it('should return user enrollments', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .get('/enrollments')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .get('/enrollments')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ GET /enrollments/:courseId/check ============
    describe('GET /enrollments/:courseId/check', () => {
        it('should return enrollment status', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .get(`/enrollments/${course.id}/check`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            // Response might have isEnrolled or enrolled property
            expect(response.body.isEnrolled === true || response.body.enrolled === true).toBe(true);
        });

        it('should return not enrolled for non-enrolled user', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();

            const response = await createRequest(app)
                .get(`/enrollments/${course.id}/check`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            // Response might have isEnrolled or enrolled property
            expect(response.body.isEnrolled === false || response.body.enrolled === false).toBe(true);
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .get('/enrollments/1/check')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ POST /enrollments ============
    describe('POST /enrollments', () => {
        it('should enroll user in free course', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();

            const response = await createRequest(app)
                .post('/enrollments')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ courseId: course.id });

            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
            // Response might have courseId or course.id property
            expect(response.body.courseId || response.body.course?.id || response.body.id).toBeDefined();
        });

        it('should return 409 for already enrolled', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .post('/enrollments')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ courseId: course.id })
                .expect(HttpStatus.CONFLICT);

            expect(response.body.message).toBeDefined();
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .post('/enrollments')
                .send({ courseId: 1 })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ PATCH /enrollments/:id/progress ============
    describe('PATCH /enrollments/:id/progress', () => {
        it('should update progress for own enrollment', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            const enrollment = await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .patch(`/enrollments/${enrollment.id}/progress`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ progressPercent: 50 })
                .expect(HttpStatus.OK);

            expect(response.body.progressPercent).toBe(50);
        });

        it('should return 403 for other user enrollment', async () => {
            const { user } = await IntegrationTestHelper.createStudentWithToken();
            const { token: otherToken } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            const enrollment = await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .patch(`/enrollments/${enrollment.id}/progress`)
                .set(IntegrationTestHelper.getAuthHeaders(otherToken))
                .send({ progressPercent: 50 })
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ POST /enrollments/:id/complete ============
    describe('POST /enrollments/:id/complete', () => {
        it('should mark enrollment as complete', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            const enrollment = await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .post(`/enrollments/${enrollment.id}/complete`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body.status).toBe(EnrollmentStatus.COMPLETED);
        });

        it('should return 403 for other user enrollment', async () => {
            const { user } = await IntegrationTestHelper.createStudentWithToken();
            const { token: otherToken } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            const enrollment = await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .post(`/enrollments/${enrollment.id}/complete`)
                .set(IntegrationTestHelper.getAuthHeaders(otherToken))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ GET /enrollments/admin (Admin only) ============
    describe('GET /enrollments/admin', () => {
        it('should return all enrollments for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .get('/enrollments/admin')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            // Response has enrollments array in PaginatedEnrollmentsDto
            expect(response.body).toHaveProperty('enrollments');
            expect(Array.isArray(response.body.enrollments)).toBe(true);
        });

        it('should return 403 for non-admin', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const response = await createRequest(app)
                .get('/enrollments/admin')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ GET /enrollments/admin/:id (Admin only) ============
    describe('GET /enrollments/admin/:id', () => {
        it('should return enrollment by ID for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();
            const { user } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            const enrollment = await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .get(`/enrollments/admin/${enrollment.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body.id).toBe(enrollment.id);
        });

        it('should return 404 for non-existent enrollment', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .get('/enrollments/admin/99999')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ PATCH /enrollments/admin/:id (Admin only) ============
    describe('PATCH /enrollments/admin/:id', () => {
        it('should update enrollment for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();
            const { user } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            const enrollment = await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .patch(`/enrollments/admin/${enrollment.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ status: EnrollmentStatus.EXPIRED })
                .expect(HttpStatus.OK);

            expect(response.body.status).toBe(EnrollmentStatus.EXPIRED);
        });

        it('should return 403 for non-admin', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            const enrollment = await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .patch(`/enrollments/admin/${enrollment.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ status: EnrollmentStatus.EXPIRED })
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ DELETE /enrollments/admin/:id (Admin only) ============
    describe('DELETE /enrollments/admin/:id', () => {
        it('should delete enrollment for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();
            const { user } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            const enrollment = await createEnrollment(user.id, course.id);

            await createRequest(app)
                .delete(`/enrollments/admin/${enrollment.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.NO_CONTENT);

            const deleted = await prisma.enrollment.findUnique({ where: { id: enrollment.id } });
            expect(deleted).toBeNull();
        });

        it('should return 403 for non-admin', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const { course } = await createPublishedCourse();
            const enrollment = await createEnrollment(user.id, course.id);

            const response = await createRequest(app)
                .delete(`/enrollments/admin/${enrollment.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should return 404 for non-existent enrollment', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .delete('/enrollments/admin/99999')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });
    });
});
