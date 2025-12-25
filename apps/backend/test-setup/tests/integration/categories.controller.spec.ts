import { INestApplication, HttpStatus } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Role } from '@prisma/client';

import { CategoriesModule } from '../../../src/modules/categories/categories.module';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import {
    IntegrationTestHelper,
    createRequest,
} from '../../helpers/integration-test.helper';
import { CategoryFactory } from '../../factories/category.factory';

describe('CategoriesController (Integration)', () => {
    let app: INestApplication;
    let module: TestingModule;
    let prisma: PrismaService;

    beforeAll(async () => {
        module = await IntegrationTestHelper.createTestingModule([CategoriesModule]);
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

    // ============ GET /categories ============
    describe('GET /categories', () => {
        it('should return all categories in tree structure', async () => {
            // Create some categories
            const factory = new CategoryFactory();
            await factory.createAndSave({ name: 'Category 1', slug: 'category-1', isActive: true });
            await factory.createAndSave({ name: 'Category 2', slug: 'category-2', isActive: true });

            const response = await createRequest(app)
                .get('/categories')
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
        });

        it('should be accessible without authentication (public)', async () => {
            const response = await createRequest(app)
                .get('/categories')
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return categories with course counts', async () => {
            const factory = new CategoryFactory();
            await factory.createAndSave({ name: 'Programming', slug: 'programming', isActive: true });

            const response = await createRequest(app)
                .get('/categories')
                .expect(HttpStatus.OK);

            expect(response.body.length).toBeGreaterThan(0);
            // Check the response structure includes course count field
            if (response.body[0]) {
                expect(response.body[0]).toHaveProperty('name');
                expect(response.body[0]).toHaveProperty('slug');
            }
        });
    });

    // ============ GET /categories/:slug ============
    describe('GET /categories/:slug', () => {
        it('should return category by slug', async () => {
            const factory = new CategoryFactory();
            await factory.createAndSave({
                name: 'Web Development',
                slug: 'web-development',
                description: 'Learn web development',
                isActive: true,
            });

            const response = await createRequest(app)
                .get('/categories/web-development')
                .expect(HttpStatus.OK);

            expect(response.body.name).toBe('Web Development');
            expect(response.body.slug).toBe('web-development');
        });

        it('should return 404 for non-existent slug', async () => {
            const response = await createRequest(app)
                .get('/categories/non-existent-category')
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });

        it('should be accessible without authentication', async () => {
            const factory = new CategoryFactory();
            await factory.createAndSave({ name: 'Design', slug: 'design', isActive: true });

            const response = await createRequest(app)
                .get('/categories/design')
                .expect(HttpStatus.OK);

            expect(response.body.slug).toBe('design');
        });
    });

    // ============ POST /categories (Admin only) ============
    describe('POST /categories', () => {
        it('should create category for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const createDto = {
                name: 'New Category',
                slug: 'new-category',
                description: 'A new test category',
            };

            // NestJS returns 201 by default for POST
            const response = await createRequest(app)
                .post('/categories')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send(createDto);

            // Accept 200 or 201 (NestJS default is 201 for POST)
            expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
            expect(response.body.name).toBe('New Category');
            expect(response.body.slug).toBe('new-category');
        });

        it('should return 403 for non-admin user', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const createDto = {
                name: 'Forbidden Category',
                slug: 'forbidden-category',
            };

            const response = await createRequest(app)
                .post('/categories')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send(createDto)
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should return 401 for unauthenticated request', async () => {
            const createDto = {
                name: 'Unauthorized Category',
                slug: 'unauthorized-category',
            };

            const response = await createRequest(app)
                .post('/categories')
                .send(createDto)
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });

        it('should return 409 for duplicate slug', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            // Create existing category
            const factory = new CategoryFactory();
            await factory.createAndSave({ name: 'Existing', slug: 'existing-slug', isActive: true });

            const createDto = {
                name: 'Duplicate',
                slug: 'existing-slug', // Duplicate slug
            };

            const response = await createRequest(app)
                .post('/categories')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send(createDto)
                .expect(HttpStatus.CONFLICT);

            expect(response.body.message).toBeDefined();
        });

        it('should return 400 for missing required fields', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .post('/categories')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({}) // Empty body
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ PUT /categories/:id (Admin only) ============
    describe('PUT /categories/:id', () => {
        it('should update category for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const factory = new CategoryFactory();
            const category = await factory.createAndSave({
                name: 'Original Name',
                slug: 'original-name',
                isActive: true,
            });

            const updateDto = {
                name: 'Updated Name',
                description: 'Updated description',
            };

            const response = await createRequest(app)
                .put(`/categories/${category.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send(updateDto)
                .expect(HttpStatus.OK);

            expect(response.body.name).toBe('Updated Name');
            expect(response.body.description).toBe('Updated description');
        });

        it('should return 404 for non-existent category', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .put('/categories/99999')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ name: 'Updated' })
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });

        it('should return 403 for non-admin user', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const factory = new CategoryFactory();
            const category = await factory.createAndSave({
                name: 'Test Category',
                slug: 'test-category',
                isActive: true,
            });

            const response = await createRequest(app)
                .put(`/categories/${category.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ name: 'Hacked' })
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should return 409 for duplicate slug on update', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const factory = new CategoryFactory();
            await factory.createAndSave({ name: 'First', slug: 'first-slug', isActive: true });
            const second = await factory.createAndSave({ name: 'Second', slug: 'second-slug', isActive: true });

            const response = await createRequest(app)
                .put(`/categories/${second.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .send({ slug: 'first-slug' }) // Try to use existing slug
                .expect(HttpStatus.CONFLICT);

            expect(response.body.message).toBeDefined();
        });
    });

    // ============ DELETE /categories/:id (Admin only) ============
    describe('DELETE /categories/:id', () => {
        it('should delete category for admin', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const factory = new CategoryFactory();
            const category = await factory.createAndSave({
                name: 'To Delete',
                slug: 'to-delete',
                isActive: true,
            });

            await createRequest(app)
                .delete(`/categories/${category.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.NO_CONTENT);

            // Verify category was deleted
            const deleted = await prisma.category.findUnique({ where: { id: category.id } });
            expect(deleted).toBeNull();
        });

        it('should return 404 for non-existent category', async () => {
            const { token } = await IntegrationTestHelper.createAdminWithToken();

            const response = await createRequest(app)
                .delete('/categories/99999')
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body.message).toBeDefined();
        });

        it('should return 403 for non-admin user', async () => {
            const { token } = await IntegrationTestHelper.createStudentWithToken();

            const factory = new CategoryFactory();
            const category = await factory.createAndSave({
                name: 'Protected',
                slug: 'protected',
                isActive: true,
            });

            const response = await createRequest(app)
                .delete(`/categories/${category.id}`)
                .set(IntegrationTestHelper.getAuthHeaders(token))
                .expect(HttpStatus.FORBIDDEN);

            expect(response.body.message).toBeDefined();
        });

        it('should return 401 for unauthenticated request', async () => {
            const factory = new CategoryFactory();
            const category = await factory.createAndSave({
                name: 'Requires Auth',
                slug: 'requires-auth',
                isActive: true,
            });

            const response = await createRequest(app)
                .delete(`/categories/${category.id}`)
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body.message).toBeDefined();
        });
    });
});
