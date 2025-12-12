import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CourseStatus } from '@prisma/client';

@Injectable()
export class CoursesService {
    constructor(private prisma: PrismaService) { }

    // TODO: Implement course service methods
    async findAll(filters?: { categoryId?: number; status?: CourseStatus; page?: number; limit?: number }) {
        const { page = 1, limit = 10, ...where } = filters || {};
        return this.prisma.course.findMany({
            where: { status: CourseStatus.PUBLISHED, ...where },
            include: { instructor: { select: { id: true, name: true } }, category: true },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.course.findUnique({
            where: { slug },
            include: {
                instructor: { select: { id: true, name: true, bio: true } },
                category: true,
                lessons: { where: { isPublished: true }, orderBy: { order: 'asc' } },
            },
        });
    }

    async findByInstructor(instructorId: number) {
        return this.prisma.course.findMany({
            where: { instructorId },
            include: { category: true, _count: { select: { lessons: true, enrollments: true } } },
        });
    }

    async create(data: any, instructorId: number) {
        return this.prisma.course.create({
            data: { ...data, instructorId },
        });
    }

    async update(id: number, data: any) {
        return this.prisma.course.update({ where: { id }, data });
    }

    async delete(id: number) {
        return this.prisma.course.delete({ where: { id } });
    }
}
