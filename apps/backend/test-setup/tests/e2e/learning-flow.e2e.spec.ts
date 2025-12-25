import { INestApplication, HttpStatus } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { EnrollmentStatus } from '@prisma/client';

import { EnrollmentsModule } from '../../../src/modules/enrollments/enrollments.module';
import { LessonsModule } from '../../../src/modules/lessons/lessons.module';
import { ProgressModule } from '../../../src/modules/progress/progress.module';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import {
    IntegrationTestHelper,
    createRequest,
} from '../../helpers/integration-test.helper';
import { E2ETestHelper } from '../../helpers/e2e-test.helper';

/**
 * E2E Test: Learning Flow
 * 
 * Tests the complete learning journey:
 * 1. Access enrolled course lessons
 * 2. Mark lessons as complete
 * 3. Track progress across lessons
 * 4. Complete the entire course
 * 
 * API Routes:
 * - Lessons: GET /courses/:courseId/lessons, GET /courses/:courseId/lessons/:slug
 * - Progress: POST /courses/:courseId/lessons/:lessonId/complete
 * - Course Progress: GET /courses/:courseId/progress
 */
describe('E2E: Learning Flow', () => {
    let app: INestApplication;
    let module: TestingModule;
    let prisma: PrismaService;

    // Shared test data
    let freeCourse: any;
    let paidCourse: any;
    let freeCourseLessons: any[];
    let paidCourseLessons: any[];

    beforeAll(async () => {
        // Load all required modules for learning flow
        module = await IntegrationTestHelper.createTestingModule([
            EnrollmentsModule,
            LessonsModule,
            ProgressModule,
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

        // Setup test data with lessons
        const setup = await E2ETestHelper.createFullE2ESetup(prisma);
        freeCourse = setup.freeCourse;
        paidCourse = setup.paidCourse;

        // Get lessons for each course
        freeCourseLessons = await E2ETestHelper.getCourseLessons(prisma, freeCourse.id);
        paidCourseLessons = await E2ETestHelper.getCourseLessons(prisma, paidCourse.id);
    });

    // ============ Access Enrolled Course Lessons ============
    describe('Step 1: Access Course Lessons', () => {
        it('should list lessons for course (public metadata)', async () => {
            // Lessons list is public (metadata only)
            const response = await createRequest(app)
                .get(`/courses/${freeCourse.id}/lessons`)
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(freeCourseLessons.length);
        });

        it('should get lesson content for enrolled user', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const lesson = freeCourseLessons[0];

            // Enroll in course
            await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            const response = await createRequest(app)
                .get(`/courses/${freeCourse.id}/lessons/${lesson.slug}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body.title).toBe(lesson.title);
        });

        it('should allow free lesson without enrollment', async () => {
            // Find free lesson (isFree = true)
            const freeLesson = freeCourseLessons.find(l => l.isFree);
            if (!freeLesson) {
                console.log('No free lesson found, skipping test');
                return;
            }

            const response = await createRequest(app)
                .get(`/courses/${freeCourse.id}/lessons/${freeLesson.slug}`)
                .expect(HttpStatus.OK);

            expect(response.body.title).toBe(freeLesson.title);
        });
    });

    // ============ Mark Lessons Complete ============
    describe('Step 2: Mark Lessons Complete', () => {
        it('should mark lesson as complete', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const lesson = freeCourseLessons[0];

            // Enroll in course
            await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            const response = await createRequest(app)
                .post(`/courses/${freeCourse.id}/lessons/${lesson.id}/complete`)
                .set(IntegrationTestHelper.getAuthHeaders(token));

            // Accept 200 or 201 for success
            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
            expect(response.body.isCompleted).toBe(true);
        });

        it('should update watch progress for video lesson', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const lesson = freeCourseLessons[0];

            // Enroll in course
            await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            const response = await createRequest(app)
                .patch(`/courses/${freeCourse.id}/lessons/${lesson.id}/progress`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ watchedSeconds: 300 }); // 5 minutes

            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
        });

        it('should get progress for a specific lesson', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();
            const lesson = freeCourseLessons[0];

            // Enroll and create progress
            await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);
            await E2ETestHelper.createProgress(prisma, user.id, lesson.id, true, 600);

            const response = await createRequest(app)
                .get(`/courses/${freeCourse.id}/lessons/${lesson.id}/progress`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body.isCompleted).toBe(true);
            expect(response.body.watchedSeconds).toBe(600);
        });
    });

    // ============ Track Progress Across Lessons ============
    describe('Step 3: Track Overall Progress', () => {
        it('should get course progress summary', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Enroll in course
            await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            // Complete first lesson
            await E2ETestHelper.createProgress(prisma, user.id, freeCourseLessons[0].id, true);

            const response = await createRequest(app)
                .get(`/courses/${freeCourse.id}/progress`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('lessons');
            expect(Array.isArray(response.body.lessons)).toBe(true);
        });

        it('should track progress across multiple lessons', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Enroll in course
            await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            // Complete multiple lessons directly in DB
            for (let i = 0; i < 2; i++) {
                const lesson = freeCourseLessons[i];
                await E2ETestHelper.createProgress(prisma, user.id, lesson.id, true);
            }

            // Get course progress
            const response = await createRequest(app)
                .get(`/courses/${freeCourse.id}/progress`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            const completedCount = response.body.lessons.filter((l: any) => l.isCompleted).length;
            expect(completedCount).toBe(2);
        });
    });

    // ============ Complete Course ============
    describe('Step 4: Complete Course', () => {
        it('should mark enrollment as complete', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Enroll in course
            const enrollment = await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            // Complete all lessons in DB
            for (const lesson of freeCourseLessons) {
                await E2ETestHelper.createProgress(prisma, user.id, lesson.id, true, lesson.duration);
            }

            // Mark enrollment as complete
            const response = await createRequest(app)
                .post(`/enrollments/${enrollment.id}/complete`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(response.body.status).toBe(EnrollmentStatus.COMPLETED);
        });

        it('should update enrollment progress percentage', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Enroll in course
            const enrollment = await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            // Update progress to 50%
            const response = await createRequest(app)
                .patch(`/enrollments/${enrollment.id}/progress`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ progressPercent: 50 })
                .expect(HttpStatus.OK);

            expect(response.body.progressPercent).toBe(50);
        });
    });

    // ============ Access Control ============
    describe('Access Control', () => {
        it('should deny non-enrolled user access to paid lesson content', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();
            const lesson = paidCourseLessons.find(l => !l.isFree);

            if (!lesson) {
                console.log('All lessons are free, skipping test');
                return;
            }

            const response = await createRequest(app)
                .get(`/courses/${paidCourse.id}/lessons/${lesson.slug}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should deny progress update for non-enrolled user', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();
            const lesson = paidCourseLessons[0];

            const response = await createRequest(app)
                .post(`/courses/${paidCourse.id}/lessons/${lesson.id}/complete`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should deny unauthenticated access to progress', async () => {
            const lesson = freeCourseLessons[0];

            await createRequest(app)
                .get(`/courses/${freeCourse.id}/lessons/${lesson.id}/progress`)
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    // ============ Complete Learning Flow (End-to-End) ============
    describe('Complete Learning Flow', () => {
        it('should complete full learning journey: enroll → learn → progress → complete', async () => {
            const { user, token } = await IntegrationTestHelper.createStudentWithToken();

            // Step 1: Enroll in free course
            await E2ETestHelper.createEnrollment(prisma, user.id, freeCourse.id);

            // Step 2: Check enrollment
            const enrollmentCheck = await createRequest(app)
                .get(`/enrollments/${freeCourse.id}/check`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);
            expect(enrollmentCheck.body.isEnrolled === true || enrollmentCheck.body.enrolled === true).toBe(true);

            // Step 3: Access lessons
            const lessonsResponse = await createRequest(app)
                .get(`/courses/${freeCourse.id}/lessons`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);
            expect(lessonsResponse.body.length).toBeGreaterThan(0);

            // Step 4: Complete each lesson via API
            for (const lesson of freeCourseLessons) {
                await createRequest(app)
                    .post(`/courses/${freeCourse.id}/lessons/${lesson.id}/complete`)
                    .set(IntegrationTestHelper.getAuthHeaders(token));
            }

            // Step 5: Verify course progress
            const progressResponse = await createRequest(app)
                .get(`/courses/${freeCourse.id}/progress`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(progressResponse.body.lessons.length).toBeGreaterThan(0);

            // Step 6: Get enrollment
            const enrollments = await createRequest(app)
                .get('/enrollments')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            const myEnrollment = enrollments.body.find((e: any) =>
                e.courseId === freeCourse.id || e.course?.id === freeCourse.id
            );
            expect(myEnrollment).toBeDefined();

            // Step 7: Complete the enrollment
            await createRequest(app)
                .post(`/enrollments/${myEnrollment.id}/complete`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            // Verify final state
            const finalEnrollments = await createRequest(app)
                .get('/enrollments')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            const completedEnrollment = finalEnrollments.body.find((e: any) =>
                (e.courseId === freeCourse.id || e.course?.id === freeCourse.id)
            );
            expect(completedEnrollment.status).toBe(EnrollmentStatus.COMPLETED);
        });
    });
});
