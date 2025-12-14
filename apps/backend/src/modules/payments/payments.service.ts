import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PaymentStatus, EnrollmentStatus, CourseStatus } from '@prisma/client';
import { PaymentQueryDto } from './dto/create-payment.dto';
import {
    PaymentListItemDto,
    PaymentDetailDto,
    CreatePaymentResponseDto,
    PaymentVerifyResponseDto,
    PaginatedPaymentsDto,
    RefundResponseDto,
    CoursePaymentRefDto,
    UserPaymentRefDto,
} from './dto/payment-response.dto';
import {
    getPayOSConfig,
    generateOrderCode,
    mapPayOSStatus,
    PayOSWebhookPayload,
    CreatePaymentLinkRequest,
    CreatePaymentLinkResponse,
} from './payos.config';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly config = getPayOSConfig();

    constructor(private prisma: PrismaService) { }

    // ============ User Methods ============

    /**
     * Create a payment for a course
     * 1. Check course exists and is published
     * 2. Check user not already enrolled
     * 3. Create PENDING enrollment
     * 4. Create PENDING payment
     * 5. Call PayOS to get payment URL
     * 6. Return payment URL
     */
    async createPayment(
        userId: number,
        courseId: number,
        returnUrl?: string,
        cancelUrl?: string,
    ): Promise<CreatePaymentResponseDto> {
        // 1. Check course exists and is published
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                price: true,
                discountPrice: true,
                status: true,
            },
        });

        if (!course) {
            throw new NotFoundException(`Course with ID ${courseId} not found`);
        }

        if (course.status !== CourseStatus.PUBLISHED) {
            throw new ForbiddenException('Cannot purchase unpublished course');
        }

        // 2. Check user not already enrolled (or has completed payment)
        const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
            include: { payment: true },
        });

        if (existingEnrollment?.status === EnrollmentStatus.ACTIVE) {
            throw new ConflictException('Already enrolled in this course');
        }

        // If there's a pending enrollment with pending payment, reuse it
        if (existingEnrollment?.payment?.status === PaymentStatus.PENDING) {
            // If payment is still pending, we could return existing or create new
            // For simplicity, delete old and create new
            await this.prisma.payment.delete({ where: { id: existingEnrollment.payment.id } });
            await this.prisma.enrollment.delete({ where: { id: existingEnrollment.id } });
        }

        // Calculate amount
        const amount = Number(course.discountPrice ?? course.price);
        const orderCode = generateOrderCode();

        // 3. Create PENDING enrollment
        const enrollment = await this.prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: EnrollmentStatus.PENDING,
            },
        });

        // 4. Create PENDING payment
        const payment = await this.prisma.payment.create({
            data: {
                userId,
                enrollmentId: enrollment.id,
                amount,
                currency: 'VND',
                status: PaymentStatus.PENDING,
                method: 'PAYOS',
                transactionId: orderCode.toString(),
            },
        });

        // 5. Get payment URL from PayOS (or mock)
        let paymentUrl: string;

        if (this.config.mockMode) {
            // Mock mode for local testing
            paymentUrl = `http://localhost:3000/api/payments/mock-pay/${orderCode}`;
            this.logger.log(`[MOCK] Created payment link: ${paymentUrl}`);
        } else {
            // Real PayOS integration
            paymentUrl = await this.createPayOSPaymentLink({
                orderCode,
                amount,
                description: `Thanh toán khóa học: ${course.title}`.substring(0, 50),
                items: [{ name: course.title.substring(0, 50), quantity: 1, price: amount }],
                returnUrl: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
                cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
            });
        }

        return {
            success: true,
            paymentUrl,
            orderCode,
            paymentId: payment.id,
            enrollmentId: enrollment.id,
        };
    }

    /**
     * Handle PayOS webhook callback
     * 1. Verify signature
     * 2. Check idempotency (not already processed)
     * 3. Update payment and enrollment status atomically
     */
    async handleWebhook(payload: PayOSWebhookPayload, signature: string): Promise<{ success: boolean; message: string }> {
        this.logger.log(`Received webhook for orderCode: ${payload.data?.orderCode}`);

        // 1. Verify signature (skip in mock mode)
        if (!this.config.mockMode) {
            const isValid = this.verifyWebhookSignature(payload, signature);
            if (!isValid) {
                this.logger.error('Invalid webhook signature');
                throw new ForbiddenException('Invalid signature');
            }
        }

        const orderCode = payload.data?.orderCode;
        if (!orderCode) {
            throw new BadRequestException('Missing orderCode in webhook payload');
        }

        // 2. Find payment by orderCode (transactionId)
        const payment = await this.prisma.payment.findUnique({
            where: { transactionId: orderCode.toString() },
            include: { enrollment: true },
        });

        if (!payment) {
            this.logger.error(`Payment not found for orderCode: ${orderCode}`);
            throw new NotFoundException('Payment not found');
        }

        // 3. Check idempotency - already processed?
        if (payment.status === PaymentStatus.COMPLETED) {
            this.logger.log(`Payment ${orderCode} already completed, skipping`);
            return { success: true, message: 'Already processed' };
        }

        if (payment.status === PaymentStatus.REFUNDED) {
            this.logger.log(`Payment ${orderCode} was refunded, skipping`);
            return { success: true, message: 'Payment was refunded' };
        }

        // 4. Determine new status based on webhook
        const isSuccess = payload.success === true && payload.code === '00';
        const newPaymentStatus = isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
        const newEnrollmentStatus = isSuccess ? EnrollmentStatus.ACTIVE : EnrollmentStatus.PENDING;

        // 5. Update payment and enrollment atomically
        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: newPaymentStatus,
                    paidAt: isSuccess ? new Date() : null,
                    paymentData: payload as any,
                },
            }),
            this.prisma.enrollment.update({
                where: { id: payment.enrollmentId },
                data: {
                    status: newEnrollmentStatus,
                },
            }),
        ]);

        this.logger.log(`Payment ${orderCode} updated to ${newPaymentStatus}`);
        return { success: true, message: `Payment ${isSuccess ? 'completed' : 'failed'}` };
    }

    /**
     * Verify payment status after user returns from PayOS
     */
    async verifyPayment(orderCode: string, userId: number): Promise<PaymentVerifyResponseDto> {
        const payment = await this.prisma.payment.findUnique({
            where: { transactionId: orderCode },
            include: {
                enrollment: {
                    include: {
                        course: {
                            select: { id: true, title: true, slug: true, thumbnail: true },
                        },
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        // Verify ownership
        if (payment.userId !== userId) {
            throw new ForbiddenException('Payment does not belong to you');
        }

        return {
            success: payment.status === PaymentStatus.COMPLETED,
            status: payment.status,
            message: this.getStatusMessage(payment.status),
            paymentId: payment.id,
            enrollmentId: payment.enrollmentId,
            course: this.mapToCourseRef(payment.enrollment.course),
        };
    }

    /**
     * Get user's payment history
     */
    async findByUser(userId: number): Promise<PaymentListItemDto[]> {
        const payments = await this.prisma.payment.findMany({
            where: { userId },
            include: {
                enrollment: {
                    include: {
                        course: {
                            select: { id: true, title: true, slug: true, thumbnail: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return payments.map((p) => this.mapToListItem(p));
    }

    // ============ Admin Methods ============

    /**
     * Get all payments with pagination and filters
     */
    async findAll(query: PaymentQueryDto): Promise<PaginatedPaymentsDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.userId) where.userId = query.userId;
        if (query.courseId) {
            where.enrollment = { courseId: query.courseId };
        }

        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, email: true, name: true } },
                    enrollment: {
                        include: {
                            course: {
                                select: { id: true, title: true, slug: true, thumbnail: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.payment.count({ where }),
        ]);

        return {
            payments: payments.map((p) => this.mapToDetail(p)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get single payment by ID (admin)
     */
    async findById(id: number): Promise<PaymentDetailDto> {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, email: true, name: true } },
                enrollment: {
                    include: {
                        course: {
                            select: { id: true, title: true, slug: true, thumbnail: true },
                        },
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException(`Payment with ID ${id} not found`);
        }

        return this.mapToDetail(payment);
    }

    /**
     * Process refund (admin only)
     * Updates payment to REFUNDED, enrollment to REFUNDED
     */
    async processRefund(id: number): Promise<RefundResponseDto> {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: {
                enrollment: true,
                user: { select: { id: true, email: true, name: true } },
            },
        });

        if (!payment) {
            throw new NotFoundException(`Payment with ID ${id} not found`);
        }

        if (payment.status !== PaymentStatus.COMPLETED) {
            throw new BadRequestException('Can only refund completed payments');
        }

        // In real scenario, call PayOS refund API here
        if (!this.config.mockMode) {
            // await this.callPayOSRefundAPI(payment.transactionId);
            this.logger.log(`[PRODUCTION] Would call PayOS refund API for ${payment.transactionId}`);
        }

        // Update payment and enrollment atomically
        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id },
                data: { status: PaymentStatus.REFUNDED },
            }),
            this.prisma.enrollment.update({
                where: { id: payment.enrollmentId },
                data: { status: EnrollmentStatus.REFUNDED },
            }),
        ]);

        // Fetch updated payment
        const updated = await this.findById(id);

        return {
            success: true,
            message: 'Refund processed successfully',
            payment: updated,
        };
    }

    /**
     * Mock payment completion (only in mock mode)
     * For local testing without real PayOS
     */
    async mockPaymentComplete(orderCode: string): Promise<PaymentVerifyResponseDto> {
        if (!this.config.mockMode) {
            throw new ForbiddenException('Mock payments not allowed in production');
        }

        const mockPayload: PayOSWebhookPayload = {
            code: '00',
            desc: 'success',
            success: true,
            data: {
                orderCode: parseInt(orderCode),
                amount: 0,
                description: 'Mock payment',
                accountNumber: 'mock',
                reference: 'mock-ref',
                transactionDateTime: new Date().toISOString(),
                currency: 'VND',
                paymentLinkId: 'mock',
                code: '00',
                desc: 'success',
                counterAccountBankId: null,
                counterAccountBankName: null,
                counterAccountName: null,
                counterAccountNumber: null,
                virtualAccountName: null,
                virtualAccountNumber: null,
            },
            signature: 'mock-signature',
        };

        await this.handleWebhook(mockPayload, 'mock-signature');

        const payment = await this.prisma.payment.findUnique({
            where: { transactionId: orderCode },
            include: {
                enrollment: {
                    include: {
                        course: {
                            select: { id: true, title: true, slug: true, thumbnail: true },
                        },
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        return {
            success: true,
            status: payment.status,
            message: 'Mock payment completed',
            paymentId: payment.id,
            enrollmentId: payment.enrollmentId,
            course: this.mapToCourseRef(payment.enrollment.course),
        };
    }

    // ============ PayOS Integration ============

    /**
     * Create payment link via PayOS API
     */
    private async createPayOSPaymentLink(request: CreatePaymentLinkRequest): Promise<string> {
        const signature = this.generatePayOSSignature(request);

        try {
            const response = await fetch(`${this.config.baseUrl}/v2/payment-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': this.config.clientId,
                    'x-api-key': this.config.apiKey,
                },
                body: JSON.stringify({ ...request, signature }),
            });

            const data = (await response.json()) as CreatePaymentLinkResponse;

            if (data.code !== '00') {
                this.logger.error(`PayOS error: ${data.desc}`);
                throw new BadRequestException(`Payment creation failed: ${data.desc}`);
            }

            return data.data.checkoutUrl;
        } catch (error) {
            this.logger.error(`PayOS API error: ${error}`);
            throw new BadRequestException('Failed to create payment link');
        }
    }

    /**
     * Generate PayOS signature for request
     */
    private generatePayOSSignature(data: any): string {
        const sortedKeys = ['amount', 'cancelUrl', 'description', 'orderCode', 'returnUrl'];
        const signatureString = sortedKeys
            .map((key) => `${key}=${data[key]}`)
            .join('&');

        return crypto
            .createHmac('sha256', this.config.checksumKey)
            .update(signatureString)
            .digest('hex');
    }

    /**
     * Verify webhook signature from PayOS
     */
    private verifyWebhookSignature(payload: PayOSWebhookPayload, signature: string): boolean {
        try {
            // PayOS webhook signature verification
            const data = payload.data;
            const sortedKeys = Object.keys(data).sort();
            const signatureString = sortedKeys
                .map((key) => `${key}=${(data as any)[key] ?? ''}`)
                .join('&');

            const expectedSignature = crypto
                .createHmac('sha256', this.config.checksumKey)
                .update(signatureString)
                .digest('hex');

            return signature === expectedSignature;
        } catch (error) {
            this.logger.error(`Signature verification error: ${error}`);
            return false;
        }
    }

    // ============ Mapping Methods ============

    private getStatusMessage(status: PaymentStatus): string {
        switch (status) {
            case PaymentStatus.COMPLETED:
                return 'Thanh toán thành công';
            case PaymentStatus.PENDING:
                return 'Đang chờ thanh toán';
            case PaymentStatus.FAILED:
                return 'Thanh toán thất bại';
            case PaymentStatus.REFUNDED:
                return 'Đã hoàn tiền';
            default:
                return 'Trạng thái không xác định';
        }
    }

    private mapToListItem(payment: any): PaymentListItemDto {
        return {
            id: payment.id,
            amount: Number(payment.amount),
            currency: payment.currency,
            status: payment.status,
            method: payment.method ?? undefined,
            transactionId: payment.transactionId ?? undefined,
            course: this.mapToCourseRef(payment.enrollment.course),
            createdAt: payment.createdAt,
            paidAt: payment.paidAt ?? undefined,
        };
    }

    private mapToDetail(payment: any): PaymentDetailDto {
        return {
            ...this.mapToListItem(payment),
            user: this.mapToUserRef(payment.user),
            paymentData: payment.paymentData ?? undefined,
            enrollmentId: payment.enrollmentId,
            updatedAt: payment.updatedAt,
        };
    }

    private mapToCourseRef(course: any): CoursePaymentRefDto {
        return {
            id: course.id,
            title: course.title,
            slug: course.slug,
            thumbnail: course.thumbnail ?? undefined,
        };
    }

    private mapToUserRef(user: any): UserPaymentRefDto {
        return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
        };
    }
}
