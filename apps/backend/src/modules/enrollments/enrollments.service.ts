import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EnrollmentStatus } from '@prisma/client';

@Injectable()
export class EnrollmentsService {
    constructor(private prisma: PrismaService) { }

    async findByUser(userId: number) {
        return this.prisma.enrollment.findMany({
            where: { userId },
            include: { course: { include: { instructor: { select: { name: true } } } } },
        });
    }

    async checkEnrollment(userId: number, courseId: number) {
        return this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
    }

    async isEnrolled(userId: number, courseId: number): Promise<boolean> {
        const enrollment = await this.checkEnrollment(userId, courseId);
        return !!enrollment && enrollment.status === EnrollmentStatus.ACTIVE;
    }

    async create(userId: number, courseId: number) {
        return this.prisma.enrollment.create({
            data: { userId, courseId, status: EnrollmentStatus.ACTIVE },
        });
    }
}
