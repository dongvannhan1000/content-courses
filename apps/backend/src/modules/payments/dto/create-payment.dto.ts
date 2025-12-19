import { IsInt, IsString, IsOptional, IsEnum, IsUrl, Min, Max, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentStatus } from '@prisma/client';

/**
 * DTO for creating a payment
 * Used by: POST /payments/create
 */
export class CreatePaymentDto {
    @ApiProperty({ example: 1, description: 'Course ID to purchase' })
    @IsInt()
    courseId!: number;

    @ApiPropertyOptional({
        example: 'https://example.com/payment/success',
        description: 'URL to redirect after successful payment',
    })
    @IsOptional()
    @IsUrl({ require_tld: false }) // Allow localhost URLs
    returnUrl?: string;

    @ApiPropertyOptional({
        example: 'https://example.com/payment/cancel',
        description: 'URL to redirect if payment cancelled',
    })
    @IsOptional()
    @IsUrl({ require_tld: false }) // Allow localhost URLs
    cancelUrl?: string;
}

/**
 * DTO for admin payment query (pagination + filters)
 * Used by: GET /payments/admin
 */
export class PaymentQueryDto {
    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ enum: PaymentStatus, description: 'Filter by status' })
    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;

    @ApiPropertyOptional({ example: 1, description: 'Filter by user ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    userId?: number;

    @ApiPropertyOptional({ example: 1, description: 'Filter by course ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    courseId?: number;
}

/**
 * DTO for verifying a payment
 * Used by: GET /payments/verify/:orderCode
 */
export class VerifyPaymentDto {
    @ApiProperty({ example: '1234567890', description: 'Order code from PayOS' })
    @IsString()
    orderCode!: string;
}

/**
 * DTO for creating a batch payment (multiple courses)
 * Used by: POST /payments/create-batch
 */
export class CreateBatchPaymentDto {
    @ApiProperty({
        example: [1, 2, 3],
        description: 'Array of course IDs to purchase',
        type: [Number],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    @Type(() => Number)
    courseIds!: number[];

    @ApiPropertyOptional({
        example: 'https://example.com/payment/success',
        description: 'URL to redirect after successful payment',
    })
    @IsOptional()
    @IsUrl({ require_tld: false })
    returnUrl?: string;

    @ApiPropertyOptional({
        example: 'https://example.com/payment/cancel',
        description: 'URL to redirect if payment cancelled',
    })
    @IsOptional()
    @IsUrl({ require_tld: false })
    cancelUrl?: string;
}
