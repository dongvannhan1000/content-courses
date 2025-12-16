import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CartDto, CartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get user's cart with all items
     */
    async getCart(userId: number): Promise<CartDto> {
        const items = await this.prisma.cartItem.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        instructor: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { addedAt: 'desc' },
        });

        const cartItems = items.map((item) => this.mapToCartItemDto(item));
        const totalPrice = cartItems.reduce(
            (sum, item) => sum + (item.course.discountPrice || item.course.price),
            0
        );

        return {
            items: cartItems,
            totalItems: cartItems.length,
            totalPrice,
        };
    }

    /**
     * Add item to cart
     */
    async addItem(userId: number, courseId: number): Promise<CartDto> {
        // Check if course exists
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new NotFoundException('Khóa học không tồn tại');
        }

        // Check if already enrolled
        const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });

        if (existingEnrollment) {
            throw new ConflictException('Bạn đã đăng ký khóa học này');
        }

        // Check if already in cart
        const existingItem = await this.prisma.cartItem.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });

        if (existingItem) {
            // Item already in cart, just return current cart
            return this.getCart(userId);
        }

        // Add to cart
        await this.prisma.cartItem.create({
            data: {
                userId,
                courseId,
            },
        });

        return this.getCart(userId);
    }

    /**
     * Remove item from cart
     */
    async removeItem(userId: number, courseId: number): Promise<CartDto> {
        await this.prisma.cartItem.deleteMany({
            where: { userId, courseId },
        });

        return this.getCart(userId);
    }

    /**
     * Clear all items from cart
     */
    async clearCart(userId: number): Promise<{ success: boolean }> {
        await this.prisma.cartItem.deleteMany({
            where: { userId },
        });

        return { success: true };
    }

    /**
     * Merge local cart with server cart
     * Used when user logs in to sync their local cart
     */
    async mergeCart(userId: number, courseIds: number[]): Promise<CartDto> {
        // Get existing cart items
        const existingItems = await this.prisma.cartItem.findMany({
            where: { userId },
            select: { courseId: true },
        });
        const existingCourseIds = new Set(existingItems.map((item) => item.courseId));

        // Get user's enrollments to exclude
        const enrollments = await this.prisma.enrollment.findMany({
            where: { userId },
            select: { courseId: true },
        });
        const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

        // Filter new items (not already in cart and not enrolled)
        const newCourseIds = courseIds.filter(
            (id) => !existingCourseIds.has(id) && !enrolledCourseIds.has(id)
        );

        // Verify courses exist
        const validCourses = await this.prisma.course.findMany({
            where: { id: { in: newCourseIds } },
            select: { id: true },
        });
        const validCourseIds = validCourses.map((c) => c.id);

        // Add new items
        if (validCourseIds.length > 0) {
            await this.prisma.cartItem.createMany({
                data: validCourseIds.map((courseId) => ({
                    userId,
                    courseId,
                })),
                skipDuplicates: true,
            });
        }

        return this.getCart(userId);
    }

    /**
     * Map database item to DTO
     */
    private mapToCartItemDto(item: any): CartItemDto {
        return {
            id: item.id,
            addedAt: item.addedAt,
            course: {
                id: item.course.id,
                title: item.course.title,
                slug: item.course.slug,
                thumbnail: item.course.thumbnail,
                price: Number(item.course.price),
                discountPrice: item.course.discountPrice
                    ? Number(item.course.discountPrice)
                    : undefined,
                instructor: {
                    id: item.course.instructor.id,
                    name: item.course.instructor.name,
                },
            },
        };
    }
}
