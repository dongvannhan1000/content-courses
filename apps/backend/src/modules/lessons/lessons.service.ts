import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class LessonsService {
    constructor(private prisma: PrismaService) { }

    async findByCourse(courseId: number) {
        return this.prisma.lesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' },
        });
    }

    async findById(id: number) {
        return this.prisma.lesson.findUnique({
            where: { id },
            include: { media: true },
        });
    }

    async create(data: any) {
        return this.prisma.lesson.create({ data });
    }

    async update(id: number, data: any) {
        return this.prisma.lesson.update({ where: { id }, data });
    }

    async delete(id: number) {
        return this.prisma.lesson.delete({ where: { id } });
    }
}
