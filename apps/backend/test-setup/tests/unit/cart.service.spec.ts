import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CartService } from '../../../src/modules/cart/cart.service';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';

describe('CartService', () => {
    let service: CartService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockPrismaService = {
        cartItem: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            createMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        course: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        enrollment: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const mockCourse = {
        id: 1,
        title: 'Test Course',
        slug: 'test-course',
        thumbnail: 'https://example.com/thumb.jpg',
        price: 100000,
        discountPrice: 80000,
        instructor: { id: 1, name: 'Instructor' },
    };

    const mockCartItem = {
        id: 1,
        userId: 1,
        courseId: 1,
        addedAt: new Date(),
        course: mockCourse,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<CartService>(CartService);
        prismaService = module.get(PrismaService);

        jest.clearAllMocks();
    });

    describe('getCart', () => {
        it('should return cart with items and total', async () => {
            mockPrismaService.cartItem.findMany.mockResolvedValue([mockCartItem]);

            const result = await service.getCart(1);

            expect(result.items).toHaveLength(1);
            expect(result.totalItems).toBe(1);
            expect(result.totalPrice).toBe(80000); // discountPrice
        });

        it('should return empty cart when no items', async () => {
            mockPrismaService.cartItem.findMany.mockResolvedValue([]);

            const result = await service.getCart(1);

            expect(result.items).toHaveLength(0);
            expect(result.totalItems).toBe(0);
            expect(result.totalPrice).toBe(0);
        });

        it('should use regular price when no discount', async () => {
            const itemWithoutDiscount = {
                ...mockCartItem,
                course: { ...mockCourse, discountPrice: null },
            };
            mockPrismaService.cartItem.findMany.mockResolvedValue([itemWithoutDiscount]);

            const result = await service.getCart(1);

            expect(result.totalPrice).toBe(100000);
        });
    });

    describe('addItem', () => {
        it('should add item to cart successfully', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
            mockPrismaService.cartItem.findUnique.mockResolvedValue(null);
            mockPrismaService.cartItem.create.mockResolvedValue(mockCartItem);
            mockPrismaService.cartItem.findMany.mockResolvedValue([mockCartItem]);

            const result = await service.addItem(1, 1);

            expect(result.items).toHaveLength(1);
            expect(mockPrismaService.cartItem.create).toHaveBeenCalled();
        });

        it('should throw NotFoundException when course not found', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(null);

            await expect(service.addItem(1, 999)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException when already enrolled (ACTIVE)', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.enrollment.findUnique.mockResolvedValue({
                status: 'ACTIVE',
            });

            await expect(service.addItem(1, 1)).rejects.toThrow(ConflictException);
        });

        it('should allow adding when enrollment is PENDING', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.enrollment.findUnique.mockResolvedValue({
                status: 'PENDING',
            });
            mockPrismaService.cartItem.findUnique.mockResolvedValue(null);
            mockPrismaService.cartItem.create.mockResolvedValue(mockCartItem);
            mockPrismaService.cartItem.findMany.mockResolvedValue([mockCartItem]);

            const result = await service.addItem(1, 1);

            expect(result.items).toHaveLength(1);
        });

        it('should return current cart when item already in cart', async () => {
            mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
            mockPrismaService.cartItem.findUnique.mockResolvedValue(mockCartItem);
            mockPrismaService.cartItem.findMany.mockResolvedValue([mockCartItem]);

            const result = await service.addItem(1, 1);

            expect(mockPrismaService.cartItem.create).not.toHaveBeenCalled();
            expect(result.items).toHaveLength(1);
        });
    });

    describe('removeItem', () => {
        it('should remove item from cart', async () => {
            mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });
            mockPrismaService.cartItem.findMany.mockResolvedValue([]);

            const result = await service.removeItem(1, 1);

            expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
                where: { userId: 1, courseId: 1 },
            });
            expect(result.items).toHaveLength(0);
        });
    });

    describe('clearCart', () => {
        it('should clear all items from cart', async () => {
            mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 3 });

            const result = await service.clearCart(1);

            expect(result.success).toBe(true);
            expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
                where: { userId: 1 },
            });
        });
    });

    describe('mergeCart', () => {
        it('should merge local cart with server cart', async () => {
            mockPrismaService.cartItem.findMany.mockResolvedValue([]);
            mockPrismaService.enrollment.findMany.mockResolvedValue([]);
            mockPrismaService.course.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
            mockPrismaService.cartItem.createMany.mockResolvedValue({ count: 2 });
            // For getCart call
            mockPrismaService.cartItem.findMany.mockResolvedValue([mockCartItem]);

            const result = await service.mergeCart(1, [1, 2]);

            expect(mockPrismaService.cartItem.createMany).toHaveBeenCalled();
        });

        it('should not add already enrolled courses', async () => {
            mockPrismaService.cartItem.findMany.mockResolvedValue([]);
            mockPrismaService.enrollment.findMany.mockResolvedValue([{ courseId: 1 }]);
            mockPrismaService.course.findMany.mockResolvedValue([{ id: 2 }]);
            mockPrismaService.cartItem.createMany.mockResolvedValue({ count: 1 });
            mockPrismaService.cartItem.findMany.mockResolvedValue([]);

            await service.mergeCart(1, [1, 2]);

            // Should only create for course 2 (course 1 is enrolled)
            expect(mockPrismaService.cartItem.createMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.arrayContaining([
                        expect.objectContaining({ courseId: 2 }),
                    ]),
                }),
            );
        });
    });
});
