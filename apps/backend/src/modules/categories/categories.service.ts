import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    // TODO: Implement category service methods
    async findAll() {
        return this.prisma.category.findMany({
            where: { isActive: true },
            include: { children: true },
            orderBy: { order: 'asc' },
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.category.findUnique({ where: { slug } });
    }

    async create(data: { name: string; slug: string; description?: string; parentId?: number }) {
        return this.prisma.category.create({ data });
    }

    async update(id: number, data: { name?: string; description?: string; isActive?: boolean }) {
        return this.prisma.category.update({ where: { id }, data });
    }

    async delete(id: number) {
        return this.prisma.category.delete({ where: { id } });
    }
}
