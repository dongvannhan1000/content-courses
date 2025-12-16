import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsArray, ArrayNotEmpty } from 'class-validator';

/**
 * Course reference for cart display
 */
export class CartCourseRefDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Khóa học React' })
    title!: string;

    @ApiProperty({ example: 'khoa-hoc-react' })
    slug!: string;

    @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg' })
    thumbnail?: string;

    @ApiProperty({ example: 599000 })
    price!: number;

    @ApiPropertyOptional({ example: 499000 })
    discountPrice?: number;

    @ApiProperty()
    instructor!: {
        id: number;
        name: string;
    };
}

/**
 * Cart item response DTO
 */
export class CartItemDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ type: CartCourseRefDto })
    course!: CartCourseRefDto;

    @ApiProperty()
    addedAt!: Date;
}

/**
 * Full cart response
 */
export class CartDto {
    @ApiProperty({ type: [CartItemDto] })
    items!: CartItemDto[];

    @ApiProperty({ example: 3 })
    totalItems!: number;

    @ApiProperty({ example: 1497000 })
    totalPrice!: number;
}

/**
 * Add item to cart request
 */
export class AddToCartDto {
    @ApiProperty({ example: 1, description: 'Course ID to add to cart' })
    @IsInt()
    courseId!: number;
}

/**
 * Merge cart request (for syncing local cart with server)
 */
export class MergeCartDto {
    @ApiProperty({ type: [Number], description: 'Array of course IDs from local cart' })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    courseIds!: number[];
}
