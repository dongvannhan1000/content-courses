import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('create')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create payment (get payment URL)' })
    async create(@Body() createPaymentDto: CreatePaymentDto) {
        // TODO: Implement - call PayOS API
        return { message: 'Create payment - TODO', paymentUrl: 'https://pay.payos.vn/...' };
    }

    @Post('webhook')
    @Public()
    @ApiOperation({ summary: 'PayOS webhook callback' })
    async webhook(@Body() payload: any) {
        // TODO: Implement - verify signature, update payment status, create enrollment
        return { success: true };
    }

    @Get('status/:transactionId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check payment status' })
    async getStatus(@Param('transactionId') transactionId: string) {
        // TODO: Implement
        return { message: `Get payment status ${transactionId} - TODO` };
    }

    @Get('my-payments')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my payment history' })
    async getMyPayments() {
        // TODO: Implement
        return { message: 'Get my payments - TODO' };
    }
}
