import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from '../../../src/modules/categories/categories.service';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';

describe('CategoriesService', () => {
    let service: CategoriesService;
    let prismaService: jest.Mocked<PrismaService>;
    let cacheManager: jest.Mocked<any>;

    const mockPrismaService = {
        category: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        service = module.get<CategoriesService>(CategoriesService);
        prismaService = module.get(PrismaService);
        cacheManager = module.get(CACHE_MANAGER);

        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        const mockCategories = [
            {
                id: 1,
                name: 'Programming',
                slug: 'programming',
                icon: '💻',
                _count: { courses: 5 },
                children: [
                    {
                        id: 2,
                        name: 'JavaScript',
                        slug: 'javascript',
                        icon: '🟨',
                        _count: { courses: 3 },
                    },
                ],
            },
        ];

        it('should return categories from cache if available', async () => {
            const cachedResult = [{ id: 1, name: 'Cached Category' }];
            mockCacheManager.get.mockResolvedValue(cachedResult);

            const result = await service.findAll();

            expect(result).toEqual(cachedResult);
            expect(mockCacheManager.get).toHaveBeenCalledWith('categories:all');
            expect(mockPrismaService.category.findMany).not.toHaveBeenCalled();
        });

        it('should fetch from database and cache when cache is empty', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Programming');
            expect(result[0].courseCount).toBe(5);
            expect(result[0].children).toHaveLength(1);
            expect(mockCacheManager.set).toHaveBeenCalled();
        });

        it('should only return active root categories (parentId: null)', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

            await service.findAll();

            expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        isActive: true,
                        parentId: null,
                    },
                }),
            );
        });
    });

    describe('findBySlug', () => {
        const mockCategory = {
            id: 1,
            name: 'Programming',
            slug: 'programming',
            description: 'Learn programming',
            icon: '💻',
            parent: null,
            children: [{ id: 2, name: 'JavaScript', slug: 'javascript' }],
            _count: { courses: 5 },
        };

        it('should return category detail when found', async () => {
            mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

            const result = await service.findBySlug('programming');

            expect(result.id).toBe(1);
            expect(result.name).toBe('Programming');
            expect(result.courseCount).toBe(5);
            expect(result.children).toHaveLength(1);
        });

        it('should throw NotFoundException when category not found', async () => {
            mockPrismaService.category.findUnique.mockResolvedValue(null);

            await expect(service.findBySlug('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should include parent info when category has parent', async () => {
            const categoryWithParent = {
                ...mockCategory,
                parent: { id: 10, name: 'Technology', slug: 'technology' },
            };
            mockPrismaService.category.findUnique.mockResolvedValue(categoryWithParent);

            const result = await service.findBySlug('programming');

            expect(result.parent).toEqual({
                id: 10,
                name: 'Technology',
                slug: 'technology',
            });
        });
    });

    describe('create', () => {
        const createDto = {
            name: 'New Category',
            slug: 'new-category',
            description: 'A new category',
        };

        const createdCategory = {
            id: 1,
            ...createDto,
            icon: null,
            parentId: null,
            order: 0,
            isActive: true,
        };

        it('should create a new category successfully', async () => {
            mockPrismaService.category.findUnique.mockResolvedValue(null); // slug not exists
            mockPrismaService.category.create.mockResolvedValue(createdCategory);

            const result = await service.create(createDto);

            expect(result.name).toBe('New Category');
            expect(result.slug).toBe('new-category');
            expect(mockCacheManager.del).toHaveBeenCalledWith('categories:all');
        });

        it('should throw ConflictException when slug already exists', async () => {
            mockPrismaService.category.findUnique.mockResolvedValue({ id: 99 }); // slug exists

            await expect(service.create(createDto)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw NotFoundException when parentId does not exist', async () => {
            const dtoWithParent = { ...createDto, parentId: 999 };
            mockPrismaService.category.findUnique
                .mockResolvedValueOnce(null) // slug check - not exists
                .mockResolvedValueOnce(null); // parent check - not found

            await expect(service.create(dtoWithParent)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should create subcategory when valid parentId provided', async () => {
            const dtoWithParent = { ...createDto, parentId: 1 };
            const parentCategory = { id: 1, name: 'Parent' };

            mockPrismaService.category.findUnique
                .mockResolvedValueOnce(null) // slug check
                .mockResolvedValueOnce(parentCategory); // parent exists
            mockPrismaService.category.create.mockResolvedValue({
                ...createdCategory,
                parentId: 1,
            });

            const result = await service.create(dtoWithParent);

            expect(result.parentId).toBe(1);
        });
    });

    describe('update', () => {
        const existingCategory = {
            id: 1,
            name: 'Old Name',
            slug: 'old-slug',
            description: 'Old description',
            icon: null,
            parentId: null,
            order: 0,
            isActive: true,
        };

        it('should update category successfully', async () => {
            mockPrismaService.category.findUnique.mockResolvedValue(existingCategory);
            mockPrismaService.category.update.mockResolvedValue({
                ...existingCategory,
                name: 'Updated Name',
            });

            const result = await service.update(1, { name: 'Updated Name' });

            expect(result.name).toBe('Updated Name');
            expect(mockCacheManager.del).toHaveBeenCalledWith('categories:all');
        });

        it('should throw NotFoundException when category not found', async () => {
            mockPrismaService.category.findUnique.mockResolvedValue(null);

            await expect(service.update(999, { name: 'Test' })).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ConflictException when updating to duplicate slug', async () => {
            mockPrismaService.category.findUnique
                .mockResolvedValueOnce(existingCategory) // category exists
                .mockResolvedValueOnce({ id: 99 }); // new slug exists

            await expect(
                service.update(1, { slug: 'duplicate-slug' }),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException when setting self as parent', async () => {
            mockPrismaService.category.findUnique.mockResolvedValue(existingCategory);

            await expect(service.update(1, { parentId: 1 })).rejects.toThrow(
                ConflictException,
            );
        });
    });

    describe('delete', () => {
        it('should delete category successfully when no courses or children', async () => {
            const categoryToDelete = {
                id: 1,
                name: 'Delete Me',
                _count: { courses: 0, children: 0 },
            };
            mockPrismaService.category.findUnique.mockResolvedValue(categoryToDelete);
            mockPrismaService.category.delete.mockResolvedValue(categoryToDelete);

            await service.delete(1);

            expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(mockCacheManager.del).toHaveBeenCalledWith('categories:all');
        });

        it('should throw NotFoundException when category not found', async () => {
            mockPrismaService.category.findUnique.mockResolvedValue(null);

            await expect(service.delete(999)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException when category has courses', async () => {
            mockPrismaService.category.findUnique.mockResolvedValue({
                id: 1,
                _count: { courses: 5, children: 0 },
            });

            await expect(service.delete(1)).rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException when category has children', async () => {
            mockPrismaService.category.findUnique.mockResolvedValue({
                id: 1,
                _count: { courses: 0, children: 3 },
            });

            await expect(service.delete(1)).rejects.toThrow(ConflictException);
        });
    });
});
