import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { CourseStatus, EnrollmentStatus, Role } from '@prisma/client';

import { IntegrationTestHelper } from './integration-test.helper';
import { DatabaseHelper } from './database.helper';
import { CategoryFactory } from '../factories/category.factory';
import { CourseFactory } from '../factories/course.factory';

/**
 * Context for E2E tests - shared state between test steps
 */
export interface E2ETestContext {
    // Users
    student?: { user: any; token: string };
    instructor?: { user: any; token: string };
    admin?: { user: any; token: string };

    // Data
    category?: any;
    courses?: any[];
    lessons?: any[];
    enrollment?: any;
    payment?: any;
}

/**
 * E2E Test Helper for multi-module end-to-end testing
 * Extends IntegrationTestHelper with additional utilities for complete business flow testing
 */
export class E2ETestHelper {
    /**
     * Create testing module with multiple modules for E2E testing
     */
    static async createE2ETestingModule(
        modules: any[],
    ): Promise<TestingModule> {
        return IntegrationTestHelper.createTestingModule(modules);
    }

    /**
     * Create and configure NestJS application for E2E testing
     */
    static async createE2ETestApp(module: TestingModule): Promise<INestApplication> {
        return IntegrationTestHelper.createTestApp(module);
    }

    /**
     * Create a full E2E setup with category, instructor, and published courses
     */
    static async createFullE2ESetup(prisma: any): Promise<{
        category: any;
        instructor: any;
        instructorToken: string;
        freeCourse: any;
        paidCourse: any;
        lessons: any[];
    }> {
        // Create category
        const categoryFactory = new CategoryFactory();
        const category = await categoryFactory.createAndSave({
            name: 'E2E Test Category',
            slug: `e2e-test-category-${Date.now()}`,
            isActive: true,
        });

        // Create instructor
        const { user: instructor, token: instructorToken } =
            await IntegrationTestHelper.createInstructorWithToken();

        // Create free course
        const courseFactory = new CourseFactory();
        const freeCourse = await courseFactory.createAndSave({
            title: 'Free E2E Course',
            slug: `free-e2e-course-${Date.now()}`,
            categoryId: category.id,
            instructorId: instructor.id,
            status: CourseStatus.PUBLISHED,
            price: 0,
            publishedAt: new Date(),
        });

        // Create paid course
        const paidCourse = await courseFactory.createAndSave({
            title: 'Paid E2E Course',
            slug: `paid-e2e-course-${Date.now()}`,
            categoryId: category.id,
            instructorId: instructor.id,
            status: CourseStatus.PUBLISHED,
            price: 100000,
            publishedAt: new Date(),
        });

        // Create lessons for both courses
        const lessons: any[] = [];

        // Lessons for free course
        for (let i = 1; i <= 3; i++) {
            const lesson = await prisma.lesson.create({
                data: {
                    title: `Free Course Lesson ${i}`,
                    slug: `free-lesson-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    courseId: freeCourse.id,
                    order: i,
                    type: 'VIDEO',
                    duration: 600, // 10 minutes
                    isPublished: true,
                    isFree: i === 1, // First lesson is free preview
                    content: `Content for lesson ${i}`,
                },
            });
            lessons.push(lesson);
        }

        // Lessons for paid course
        for (let i = 1; i <= 3; i++) {
            const lesson = await prisma.lesson.create({
                data: {
                    title: `Paid Course Lesson ${i}`,
                    slug: `paid-lesson-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    courseId: paidCourse.id,
                    order: i,
                    type: 'VIDEO',
                    duration: 900, // 15 minutes
                    isPublished: true,
                    isFree: i === 1,
                    content: `Premium content for lesson ${i}`,
                },
            });
            lessons.push(lesson);
        }

        return {
            category,
            instructor,
            instructorToken,
            freeCourse,
            paidCourse,
            lessons,
        };
    }

    /**
     * Create enrollment directly in database
     */
    static async createEnrollment(
        prisma: any,
        userId: number,
        courseId: number,
        status: EnrollmentStatus = EnrollmentStatus.ACTIVE,
    ): Promise<any> {
        return prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status,
                progressPercent: 0,
            },
        });
    }

    /**
     * Create payment and enrollment for a course
     */
    static async createPaymentWithEnrollment(
        prisma: any,
        userId: number,
        courseId: number,
        amount: number,
    ): Promise<{ enrollment: any; payment: any }> {
        const enrollment = await prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: EnrollmentStatus.ACTIVE,
                progressPercent: 0,
            },
        });

        const payment = await prisma.payment.create({
            data: {
                userId,
                amount,
                status: 'COMPLETED',
                transactionId: `TXN_E2E_${Date.now()}`,
                enrollmentId: enrollment.id,
            },
        });

        return { enrollment, payment };
    }

    /**
     * Create progress record for a lesson
     */
    static async createProgress(
        prisma: any,
        userId: number,
        lessonId: number,
        isCompleted: boolean = false,
        watchedSeconds: number = 0,
    ): Promise<any> {
        return prisma.progress.create({
            data: {
                lessonId,
                userId,
                isCompleted,
                watchedSeconds,
            },
        });
    }

    /**
     * Get lessons for a course
     */
    static async getCourseLessons(prisma: any, courseId: number): Promise<any[]> {
        return prisma.lesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' },
        });
    }

    /**
     * Clean up E2E test data
     */
    static async cleanup(): Promise<void> {
        await IntegrationTestHelper.cleanup();
    }

    /**
     * Close database connection
     */
    static async closeConnection(): Promise<void> {
        await IntegrationTestHelper.closeConnection();
    }

    /**
     * Create student user with token
     */
    static async createStudentWithToken(): Promise<{ user: any; token: string }> {
        return IntegrationTestHelper.createStudentWithToken();
    }

    /**
     * Create admin user with token
     */
    static async createAdminWithToken(): Promise<{ user: any; token: string }> {
        return IntegrationTestHelper.createAdminWithToken();
    }

    /**
     * Create instructor user with token
     */
    static async createInstructorWithToken(): Promise<{ user: any; token: string }> {
        return IntegrationTestHelper.createInstructorWithToken();
    }

    /**
     * Get authorization headers
     */
    static getAuthHeaders(token: string): Record<string, string> {
        return IntegrationTestHelper.getAuthHeaders(token);
    }
}
