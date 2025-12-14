import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

// ============ Reference DTOs ============

/**
 * Course reference for payment display
 */
export class CoursePaymentRefDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Khóa học React' })
    title!: string;

    @ApiProperty({ example: 'khoa-hoc-react' })
    slug!: string;

    @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg' })
    thumbnail?: string;
}

/**
 * User reference for admin payment view
 */
export class UserPaymentRefDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'user@example.com' })
    email!: string;

    @ApiPropertyOptional({ example: 'Nguyen Van A' })
    name?: string;
}

// ============ Payment DTOs ============

/**
 * DTO for payment listing (GET /payments/my-payments)
 * Used for: User's payment history
 */
export class PaymentListItemDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 599000, description: 'Amount in VND' })
    amount!: number;

    @ApiProperty({ example: 'VND' })
    currency!: string;

    @ApiProperty({ enum: PaymentStatus, example: 'COMPLETED' })
    status!: PaymentStatus;

    @ApiPropertyOptional({ example: 'BANK_TRANSFER' })
    method?: string;

    @ApiPropertyOptional({ example: '1234567890123' })
    transactionId?: string;

    @ApiProperty({ type: CoursePaymentRefDto })
    course!: CoursePaymentRefDto;

    @ApiProperty()
    createdAt!: Date;

    @ApiPropertyOptional()
    paidAt?: Date;
}

/**
 * DTO for payment detail (Admin view)
 * Includes user info and full paymentData
 */
export class PaymentDetailDto extends PaymentListItemDto {
    @ApiProperty({ type: UserPaymentRefDto })
    user!: UserPaymentRefDto;

    @ApiPropertyOptional({ description: 'Raw PayOS response data' })
    paymentData?: any;

    @ApiProperty({ example: 1 })
    enrollmentId!: number;

    @ApiProperty()
    updatedAt!: Date;
}

/**
 * DTO for create payment response
 * Used for: Frontend redirect to payment page
 */
export class CreatePaymentResponseDto {
    @ApiProperty({ example: true })
    success!: boolean;

    @ApiProperty({ example: 'https://pay.payos.vn/web/abc123' })
    paymentUrl!: string;

    @ApiProperty({ example: 1234567890 })
    orderCode!: number;

    @ApiProperty({ example: 1 })
    paymentId!: number;

    @ApiProperty({ example: 1 })
    enrollmentId!: number;
}

/**
 * DTO for payment verification response
 * Used for: After user returns from payment page
 */
export class PaymentVerifyResponseDto {
    @ApiProperty({ example: true })
    success!: boolean;

    @ApiProperty({ enum: PaymentStatus, example: 'COMPLETED' })
    status!: PaymentStatus;

    @ApiPropertyOptional({ example: 'Payment successful' })
    message?: string;

    @ApiProperty({ example: 1 })
    paymentId!: number;

    @ApiPropertyOptional({ example: 1 })
    enrollmentId?: number;

    @ApiPropertyOptional({ type: CoursePaymentRefDto })
    course?: CoursePaymentRefDto;
}

/**
 * DTO for paginated payments (Admin listing)
 */
export class PaginatedPaymentsDto {
    @ApiProperty({ type: [PaymentDetailDto] })
    payments!: PaymentDetailDto[];

    @ApiProperty({ example: 100 })
    total!: number;

    @ApiProperty({ example: 1 })
    page!: number;

    @ApiProperty({ example: 10 })
    limit!: number;

    @ApiProperty({ example: 10 })
    totalPages!: number;
}

/**
 * DTO for refund response
 */
export class RefundResponseDto {
    @ApiProperty({ example: true })
    success!: boolean;

    @ApiProperty({ example: 'Refund processed successfully' })
    message!: string;

    @ApiProperty({ type: PaymentDetailDto })
    payment!: PaymentDetailDto;
}
