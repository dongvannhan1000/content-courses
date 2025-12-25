import { INestApplication, HttpStatus } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Role, CourseStatus } from '@prisma/client';

import { CoursesModule } from '../../../src/modules/courses/courses.module';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import {
    IntegrationTestHelper,
    createRequest,
} from '../../helpers/integration-test.helper';
import { CategoryFactory } from '../../factories/category.factory';
import { CourseFactory } from '../../factories/course.factory';

describe('CoursesController (Integration)', () => {
    let app: INestApplication;
    let module: TestingModule;
    let prisma: PrismaService;

    beforeAll(async () => {
        module = await IntegrationTestHelper.createTestingModule([CoursesModule]);
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

    // Helper to create a category and instructor for course tests
    async function createCategoryAndInstructor() {
        const categoryFactory = new CategoryFactory();
        const category = await categoryFactory.createAndSave({
            name: 'Test Category',
            slug: 'test-category',
            isActive: true,
        });

        const { user: instructor, token } = await IntegrationTestHelper.createInstructorWithToken();
        return { category, instructor, token };
    }

    // ============ GET /courses ============
    describe('GET /courses', () => {
        it('should return paginated courses', async () => {
            const { category, instructor } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            await courseFactory.createAndSave({
                title: 'Test Course 1',
                slug: 'test-course-1',
                categoryId: category.id,
                instructorId: instructor.id,
                status: CourseStatus.PUBLISHED,
            });

            const response = await createRequest(app)
                .get('/courses')
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should be accessible without authentication', async () => {
            const response = await createRequest(app)
                .get('/courses')
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('data');
        });

        it('should filter by category slug', async () => {
            const { category, instructor } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            await courseFactory.createAndSave({
                title: 'Filtered Course',
                slug: 'filtered-course',
                categoryId: category.id,
                instructorId: instructor.id,
                status: CourseStatus.PUBLISHED,
            });

            const response = await createRequest(app)
                .get(`/courses?category=${category.slug}`)
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('data');
        });
    });

    // ============ GET /courses/featured ============
    describe('GET /courses/featured', () => {
        it('should return featured courses', async () => {
            const response = await createRequest(app)
                .get('/courses/featured')
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    // ============ GET /courses/my-courses ============
    describe('GET /courses/my-courses', () => {
        it('should return instructor courses', async () => {
            const { category, instructor, token } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            await courseFactory.createAndSave({
                title: 'My Course',
                slug: 'my-course',
                categoryId: category.id,
                instructorId: instructor.id,
            });

            const response = await createRequest(app)
                .get('/courses/my-courses')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .get('/courses/my-courses')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ GET /courses/:slug ============
    describe('GET /courses/:slug', () => {
        it('should return course by slug', async () => {
            const { category, instructor } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            await courseFactory.createAndSave({
                title: 'Slug Course',
                slug: 'slug-course',
                categoryId: category.id,
                instructorId: instructor.id,
                status: CourseStatus.PUBLISHED,
            });

            const response = await createRequest(app)
                .get('/courses/slug-course')
                .expect(HttpStatus.OK);

            expect(response.body.title).toBe('Slug Course');
            expect(response.body.slug).toBe('slug-course');
        });

        it('should return 404 for non-existent slug', async () => {
            const response = await createRequest(app)
                .get('/courses/non-existent-course')
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ POST /courses ============
    describe('POST /courses', () => {
        it('should create course for instructor', async () => {
            const { category, token } = await createCategoryAndInstructor();

            const createDto = {
                title: 'New Course',
                slug: 'new-course',
                description: 'A new test course',
                categoryId: category.id,
                level: 'beginner',
                price: 99000,
            };

            const response = await createRequest(app)
                .post('/courses')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send(createDto);

            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
            expect(response.body.title).toBe('New Course');
        });

        it('should create course for admin', async () => {
            const categoryFactory = new CategoryFactory();
            const category = await categoryFactory.createAndSave({
                name: 'Admin Category',
                slug: 'admin-category',
                isActive: true,
            });

            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const createDto = {
                title: 'Admin Course',
                slug: 'admin-course',
                description: 'Course by admin',
                categoryId: category.id,
                level: 'beginner',
                price: 99000,
            };

            const response = await createRequest(app)
                .post('/courses')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send(createDto);

            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
        });

        it('should return 403 for regular user', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const createDto = {
                title: 'Forbidden Course',
                slug: 'forbidden-course',
            };

            const response = await createRequest(app)
                .post('/courses')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send(createDto)
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .post('/courses')
                .send({ title: 'Unauthorized' })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ PUT /courses/:id ============
    describe('PUT /courses/:id', () => {
        it('should update own course for instructor', async () => {
            const { category, instructor, token } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            const course = await courseFactory.createAndSave({
                title: 'Original Title',
                slug: 'original-title',
                categoryId: category.id,
                instructorId: instructor.id,
            });

            const response = await createRequest(app)
                .put(`/courses/${course.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ title: 'Updated Title' })
                .expect(HttpStatus.OK);

            expect(response.body.title).toBe('Updated Title');
        });

        it('should return 403 for non-owner', async () => {
            const { category, instructor } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            const course = await courseFactory.createAndSave({
                title: 'Other Course',
                slug: 'other-course',
                categoryId: category.id,
                instructorId: instructor.id,
            });

            // Create different instructor
            const { token: otherToken } = await IntegrationTestHelper.createInstructorWithToken();

            const response = await createRequest(app)
                .put(`/courses/${course.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(otherToken))
                .send({ title: 'Hacked' })
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should allow admin to update any course', async () => {
            const { category, instructor } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            const course = await courseFactory.createAndSave({
                title: 'Admin Update Test',
                slug: 'admin-update-test',
                categoryId: category.id,
                instructorId: instructor.id,
            });

            const { token: adminToken } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .put(`/courses/${course.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(adminToken))
                .send({ title: 'Admin Updated' })
                .expect(HttpStatus.OK);

            expect(response.body.title).toBe('Admin Updated');
        });

        it('should return 404 for non-existent course', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .put('/courses/99999')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ title: 'Updated' })
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ PATCH /courses/:id/status ============
    describe('PATCH /courses/:id/status', () => {
        it('should update course status for admin', async () => {
            const { category, instructor } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            const course = await courseFactory.createAndSave({
                title: 'Status Test',
                slug: 'status-test',
                categoryId: category.id,
                instructorId: instructor.id,
                status: CourseStatus.DRAFT,
            });

            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .patch(`/courses/${course.id}/status`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ status: CourseStatus.PUBLISHED })
                .expect(HttpStatus.OK);

            expect(response.body.status).toBe(CourseStatus.PUBLISHED);
        });

        it('should return 403 for non-admin', async () => {
            const { category, instructor, token } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            const course = await courseFactory.createAndSave({
                title: 'Status Forbidden',
                slug: 'status-forbidden',
                categoryId: category.id,
                instructorId: instructor.id,
            });

            const response = await createRequest(app)
                .patch(`/courses/${course.id}/status`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ status: CourseStatus.PUBLISHED })
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ DELETE /courses/:id ============
    describe('DELETE /courses/:id', () => {
        it('should delete own course for instructor', async () => {
            const { category, instructor, token } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            const course = await courseFactory.createAndSave({
                title: 'To Delete',
                slug: 'to-delete',
                categoryId: category.id,
                instructorId: instructor.id,
            });

            await createRequest(app)
                .delete(`/courses/${course.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.NO_CONTENT);

            const deleted = await prisma.course.findUnique({ where: { id: course.id } });
            expect(deleted).toBeNull();
        });

        it('should return 403 for non-owner', async () => {
            const { category, instructor } = await createCategoryAndInstructor();

            const courseFactory = new CourseFactory();
            const course = await courseFactory.createAndSave({
                title: 'Protected Course',
                slug: 'protected-course',
                categoryId: category.id,
                instructorId: instructor.id,
            });

            const { token: otherToken } = await IntegrationTestHelper.createInstructorWithToken();

            const response = await createRequest(app)
                .delete(`/courses/${course.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(otherToken))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should return 404 for non-existent course', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .delete('/courses/99999')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });

        it('should return 401 for unauthenticated request', async () => {
            const response = await createRequest(app)
                .delete('/courses/1')
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });
});
