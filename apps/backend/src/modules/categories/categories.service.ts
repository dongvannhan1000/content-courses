import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryTreeItemDto, CategoryDetailDto, CategoryDto } from './dto/category-response.dto';
import { CourseStatus } from '@prisma/client';

@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get all active categories in tree structure with courseCount
     * Used for: Navigation dropdown, sidebar, category listing
     * 
     * Uses Prisma _count to avoid N+1 queries
     */
    async findAll(): Promise<CategoryTreeItemDto[]> {
        this.logger.log('Getting all categories (tree structure)');
        const categories = await this.prisma.category.findMany({
            where: {
                isActive: true,
                parentId: null, // Only root categories
            },
            include: {
                _count: {
                    select: {
                        courses: {
                            where: { status: CourseStatus.PUBLISHED },
                        },
                    },
                },
                children: {
                    where: { isActive: true },
                    include: {
                        _count: {
                            select: {
                                courses: {
                                    where: { status: CourseStatus.PUBLISHED },
                                },
                            },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        });

        return categories.map((cat: Parameters<typeof this.mapToTreeItem>[0]) => this.mapToTreeItem(cat));
    }

    /**
     * Get category by slug with parent (for breadcrumb) and children (for subcategories)
     * Used for: Category detail page
     */
    async findBySlug(slug: string): Promise<CategoryDetailDto> {
        this.logger.log(`Getting category by slug: ${slug}`);
        const category = await this.prisma.category.findUnique({
            where: { slug },
            include: {
                parent: {
                    select: { id: true, name: true, slug: true },
                },
                children: {
                    where: { isActive: true },
                    select: { id: true, name: true, slug: true },
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: {
                        courses: {
                            where: { status: CourseStatus.PUBLISHED },
                        },
                    },
                },
            },
        });

        if (!category) {
            throw new NotFoundException(`Category with slug "${slug}" not found`);
        }

        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description ?? undefined,
            icon: category.icon ?? undefined,
            parent: category.parent
                ? { id: category.parent.id, name: category.parent.name, slug: category.parent.slug }
                : { id: null, name: null, slug: null },
            children: category.children.map((child: { id: number; name: string; slug: string }) => ({
                id: child.id,
                name: child.name,
                slug: child.slug,
            })),
            courseCount: category._count.courses,
        };
    }

    /**
     * Create a new category (Admin only)
     * Used for: Admin dashboard - category management
     */
    async create(dto: CreateCategoryDto): Promise<CategoryDto> {
        this.logger.log(`Creating category: ${dto.name} (slug: ${dto.slug})`);
        // Check slug uniqueness
        const existing = await this.prisma.category.findUnique({
            where: { slug: dto.slug },
        });

        if (existing) {
            throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
        }

        // Validate parentId if provided
        if (dto.parentId) {
            const parent = await this.prisma.category.findUnique({
                where: { id: dto.parentId },
            });
            if (!parent) {
                throw new NotFoundException(`Parent category with ID ${dto.parentId} not found`);
            }
        }

        const category = await this.prisma.category.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                icon: dto.icon,
                parentId: dto.parentId,
                order: dto.order ?? 0,
            },
        });

        return this.mapToCategoryDto(category);
    }

    /**
     * Update an existing category (Admin only)
     * Used for: Admin dashboard - category management
     */
    async update(id: number, dto: UpdateCategoryDto): Promise<CategoryDto> {
        this.logger.log(`Updating category: ${id}`);
        // Check if category exists
        const existing = await this.prisma.category.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        // Check slug uniqueness if updating slug
        if (dto.slug && dto.slug !== existing.slug) {
            const slugExists = await this.prisma.category.findUnique({
                where: { slug: dto.slug },
            });
            if (slugExists) {
                throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
            }
        }

        // Validate parentId if provided
        if (dto.parentId !== undefined && dto.parentId !== null) {
            // Prevent self-reference
            if (dto.parentId === id) {
                throw new ConflictException('Category cannot be its own parent');
            }

            const parent = await this.prisma.category.findUnique({
                where: { id: dto.parentId },
            });
            if (!parent) {
                throw new NotFoundException(`Parent category with ID ${dto.parentId} not found`);
            }
        }

        const category = await this.prisma.category.update({
            where: { id },
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                icon: dto.icon,
                parentId: dto.parentId,
                order: dto.order,
                isActive: dto.isActive,
            },
        });

        return this.mapToCategoryDto(category);
    }

    /**
     * Delete a category (Admin only)
     * Used for: Admin dashboard - category management
     * 
     * Note: Consider using soft delete (isActive = false) instead
     */
    async delete(id: number): Promise<void> {
        this.logger.log(`Deleting category: ${id}`);
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { courses: true, children: true },
                },
            },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        // Check if category has courses
        if (category._count.courses > 0) {
            throw new ConflictException(
                `Cannot delete category with ${category._count.courses} courses. Remove courses first or use soft delete.`,
            );
        }

        // Check if category has children
        if (category._count.children > 0) {
            throw new ConflictException(
                `Cannot delete category with ${category._count.children} subcategories. Remove subcategories first.`,
            );
        }

        await this.prisma.category.delete({ where: { id } });
    }

    // ============ Helper Methods ============

    private mapToTreeItem(category: {
        id: number;
        name: string;
        slug: string;
        icon: string | null;
        _count: { courses: number };
        children?: Array<{
            id: number;
            name: string;
            slug: string;
            icon: string | null;
            _count: { courses: number };
        }>;
    }): CategoryTreeItemDto {
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            icon: category.icon ?? undefined,
            courseCount: category._count.courses,
            children: category.children?.map((child) => ({
                id: child.id,
                name: child.name,
                slug: child.slug,
                icon: child.icon ?? undefined,
                courseCount: child._count.courses,
            })),
        };
    }

    private mapToCategoryDto(category: {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        icon: string | null;
        parentId: number | null;
        order: number;
        isActive: boolean;
    }): CategoryDto {
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description ?? undefined,
            icon: category.icon ?? undefined,
            parentId: category.parentId ?? undefined,
            order: category.order,
            isActive: category.isActive,
        };
    }
}
