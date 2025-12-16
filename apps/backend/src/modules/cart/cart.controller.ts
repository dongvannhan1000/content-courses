import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    Request as NestRequest,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CartService } from './cart.service';
import { CartDto, AddToCartDto, MergeCartDto } from './dto/cart.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    @ApiOperation({
        summary: 'Get cart',
        description: 'Get all items in the current user\'s cart',
    })
    @ApiResponse({ status: 200, type: CartDto })
    async getCart(@NestRequest() req: Request): Promise<CartDto> {
        return this.cartService.getCart(req.user!.dbId);
    }

    @Post('items')
    @ApiOperation({
        summary: 'Add item to cart',
        description: 'Add a course to the cart. Returns the updated cart.',
    })
    @ApiResponse({ status: 201, type: CartDto })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @ApiResponse({ status: 409, description: 'Already enrolled in this course' })
    async addItem(
        @Body() dto: AddToCartDto,
        @NestRequest() req: Request,
    ): Promise<CartDto> {
        return this.cartService.addItem(req.user!.dbId, dto.courseId);
    }

    @Delete('items/:courseId')
    @ApiOperation({
        summary: 'Remove item from cart',
        description: 'Remove a course from the cart. Returns the updated cart.',
    })
    @ApiParam({ name: 'courseId', type: Number })
    @ApiResponse({ status: 200, type: CartDto })
    async removeItem(
        @Param('courseId', ParseIntPipe) courseId: number,
        @NestRequest() req: Request,
    ): Promise<CartDto> {
        return this.cartService.removeItem(req.user!.dbId, courseId);
    }

    @Delete()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Clear cart',
        description: 'Remove all items from the cart.',
    })
    @ApiResponse({ status: 200, description: 'Cart cleared' })
    async clearCart(@NestRequest() req: Request): Promise<{ success: boolean }> {
        return this.cartService.clearCart(req.user!.dbId);
    }

    @Post('merge')
    @ApiOperation({
        summary: 'Merge local cart with server',
        description: 'Merge course IDs from local storage with server cart. Used after login.',
    })
    @ApiResponse({ status: 200, type: CartDto })
    async mergeCart(
        @Body() dto: MergeCartDto,
        @NestRequest() req: Request,
    ): Promise<CartDto> {
        return this.cartService.mergeCart(req.user!.dbId, dto.courseIds);
    }
}
