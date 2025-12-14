import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    Headers,
    Request as NestRequest,
    Redirect,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiHeader,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentQueryDto } from './dto/create-payment.dto';
import {
    PaymentListItemDto,
    PaymentDetailDto,
    CreatePaymentResponseDto,
    PaymentVerifyResponseDto,
    PaginatedPaymentsDto,
    RefundResponseDto,
} from './dto/payment-response.dto';
import { PayOSWebhookPayload } from './payos.config';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

// Type for the user object attached by FirebaseAuthGuard
interface AuthUser {
    uid: string;
    email: string;
    dbId: number;
    role: Role;
}

interface Request {
    user: AuthUser;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    // ============ User Endpoints ============

    @Post('create')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Create payment for a course',
        description: 'Creates a pending enrollment and payment, returns PayOS payment URL for redirect.',
    })
    @ApiResponse({ status: 201, type: CreatePaymentResponseDto })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @ApiResponse({ status: 409, description: 'Already enrolled' })
    async createPayment(
        @Body() dto: CreatePaymentDto,
        @NestRequest() req: Request,
    ): Promise<CreatePaymentResponseDto> {
        return this.paymentsService.createPayment(
            req.user.dbId,
            dto.courseId,
            dto.returnUrl,
            dto.cancelUrl,
        );
    }

    @Post('webhook')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'PayOS webhook callback',
        description: 'Receives payment status updates from PayOS. Verifies signature and updates payment/enrollment status.',
    })
    @ApiHeader({ name: 'x-payos-signature', description: 'PayOS signature for verification' })
    @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
    @ApiResponse({ status: 403, description: 'Invalid signature' })
    async webhook(
        @Body() payload: PayOSWebhookPayload,
        @Headers('x-payos-signature') signature: string,
    ): Promise<{ success: boolean; message: string }> {
        return this.paymentsService.handleWebhook(payload, signature);
    }

    @Get('verify/:orderCode')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Verify payment status',
        description: 'Called after user returns from PayOS to check payment result.',
    })
    @ApiParam({ name: 'orderCode', type: String })
    @ApiResponse({ status: 200, type: PaymentVerifyResponseDto })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    async verifyPayment(
        @Param('orderCode') orderCode: string,
        @NestRequest() req: Request,
    ): Promise<PaymentVerifyResponseDto> {
        return this.paymentsService.verifyPayment(orderCode, req.user.dbId);
    }

    @Get('my-payments')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get my payment history',
        description: 'Returns list of all payments made by the current user.',
    })
    @ApiResponse({ status: 200, type: [PaymentListItemDto] })
    async getMyPayments(@NestRequest() req: Request): Promise<PaymentListItemDto[]> {
        return this.paymentsService.findByUser(req.user.dbId);
    }

    // ============ Mock Endpoint (for local testing) ============

    @Get('mock-pay/:orderCode')
    @Public()
    @ApiOperation({
        summary: 'Mock payment completion (DEV ONLY)',
        description: 'Simulates successful payment for local testing. Only works when PAYOS_MOCK_MODE=true.',
    })
    @ApiParam({ name: 'orderCode', type: String })
    @ApiResponse({ status: 200, type: PaymentVerifyResponseDto })
    async mockPayment(
        @Param('orderCode') orderCode: string,
    ): Promise<PaymentVerifyResponseDto> {
        return this.paymentsService.mockPaymentComplete(orderCode);
    }

    // ============ Admin Endpoints ============

    @Get('admin')
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get all payments (Admin)',
        description: 'Returns paginated list of all payments with optional filters.',
    })
    @ApiResponse({ status: 200, type: PaginatedPaymentsDto })
    @ApiResponse({ status: 403, description: 'Admin access required' })
    async getAllPayments(@Query() query: PaymentQueryDto): Promise<PaginatedPaymentsDto> {
        return this.paymentsService.findAll(query);
    }

    @Get('admin/:id')
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get payment by ID (Admin)',
        description: 'Returns detailed payment information including user and PayOS data.',
    })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: PaymentDetailDto })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    async getPaymentById(@Param('id', ParseIntPipe) id: number): Promise<PaymentDetailDto> {
        return this.paymentsService.findById(id);
    }

    @Post('admin/:id/refund')
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Process refund (Admin)',
        description: 'Refunds a completed payment and deactivates the enrollment.',
    })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: RefundResponseDto })
    @ApiResponse({ status: 400, description: 'Can only refund completed payments' })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    async processRefund(@Param('id', ParseIntPipe) id: number): Promise<RefundResponseDto> {
        return this.paymentsService.processRefund(id);
    }
}
