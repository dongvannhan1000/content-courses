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
    CreatePaymentResponseDto,
    PaymentVerifyResponseDto,
    PaginatedPaymentsDto,
    RefundResponseDto,
    PaymentListItemDto,
    PaymentDetailDto,
} from './dto/payment-response.dto';
import {
    generateOrderCode,
    mapPayOSStatus,
    PayOSWebhookPayload,
} from './payos.config';
import { PayOSService, PaymentMapperService } from './services';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private prisma: PrismaService,
        private payosService: PayOSService,
        private mapper: PaymentMapperService,
    ) { }

    // ============ Helper Methods ============

    /**
     * Cleanup pending enrollments/payments for given courses
     * Properly handles batch payments by deleting ALL enrollments in the batch
     */
    private async cleanupPendingPaymentsForCourses(userId: number, courseIds: number[]): Promise<void> {
        // Find all pending enrollments for these courses
        const pendingEnrollments = await this.prisma.enrollment.findMany({
            where: {
                userId,
                courseId: { in: courseIds },
                status: EnrollmentStatus.PENDING,
            },
            include: { payment: true },
        });

        if (pendingEnrollments.length === 0) {
            return;
        }

        // Collect all payment IDs that need cleanup
        const paymentIdsToDelete = new Set<number>();
        const enrollmentIdsToDelete = new Set<number>();

        for (const enrollment of pendingEnrollments) {
            enrollmentIdsToDelete.add(enrollment.id);

            if (enrollment.payment) {
                const payment = enrollment.payment;
                paymentIdsToDelete.add(payment.id);

                // Check if this is a batch payment
                const paymentData = payment.paymentData as { isBatch?: boolean; enrollmentIds?: number[] } | null;
                if (paymentData?.isBatch && paymentData.enrollmentIds) {
                    // Add all enrollments from this batch to be deleted
                    for (const enrollmentId of paymentData.enrollmentIds) {
                        enrollmentIdsToDelete.add(enrollmentId);
                    }
                    this.logger.log(`[Cleanup] Batch payment ${payment.id} found, will delete ${paymentData.enrollmentIds.length} enrollments`);
                }
            }
        }

        // Delete in correct order: payments first (due to FK), then enrollments
        // But actually, payment has enrollmentId FK, so we need to delete payment first
        if (paymentIdsToDelete.size > 0) {
            await this.prisma.payment.deleteMany({
                where: { id: { in: Array.from(paymentIdsToDelete) } },
            });
            this.logger.log(`[Cleanup] Deleted ${paymentIdsToDelete.size} pending payments`);
        }

        if (enrollmentIdsToDelete.size > 0) {
            await this.prisma.enrollment.deleteMany({
                where: { id: { in: Array.from(enrollmentIdsToDelete) } },
            });
            this.logger.log(`[Cleanup] Deleted ${enrollmentIdsToDelete.size} pending enrollments`);
        }
    }

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
        });

        if (existingEnrollment?.status === EnrollmentStatus.ACTIVE) {
            throw new ConflictException('Already enrolled in this course');
        }

        // 3. Cleanup any pending enrollments/payments (handles batch payments properly)
        await this.cleanupPendingPaymentsForCourses(userId, [courseId]);

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

        if (this.payosService.isMockMode()) {
            // Mock mode for local testing
            paymentUrl = this.payosService.getMockPaymentUrl(orderCode);
            this.logger.log(`[MOCK] Created payment link: ${paymentUrl}`);
        } else {
            // Real PayOS integration
            paymentUrl = await this.payosService.createPaymentLink({
                orderCode,
                amount,
                description: `Khoa hoc #${courseId}`.substring(0, 25), // PayOS max 25 chars
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
     * Create a batch payment for multiple courses
     * 1. Validate all courses exist and are published
     * 2. Check user not enrolled in any of the courses
     * 3. Create PENDING enrollments for each course
     * 4. Create one PENDING payment with total amount
     * 5. Call PayOS with items array
     * 6. Return payment URL
     */
    async createBatchPayment(
        userId: number,
        courseIds: number[],
        returnUrl?: string,
        cancelUrl?: string,
    ): Promise<CreatePaymentResponseDto> {
        this.logger.log(`[BatchPayment] Creating batch payment for user ${userId} with courses: ${courseIds.join(', ')}`);

        // Remove duplicates
        const uniqueCourseIds = [...new Set(courseIds)];

        // 1. Fetch all courses
        const courses = await this.prisma.course.findMany({
            where: { id: { in: uniqueCourseIds } },
            select: {
                id: true,
                title: true,
                price: true,
                discountPrice: true,
                status: true,
            },
        });

        // Validate all courses exist
        if (courses.length !== uniqueCourseIds.length) {
            const foundIds = courses.map(c => c.id);
            const missingIds = uniqueCourseIds.filter(id => !foundIds.includes(id));
            throw new NotFoundException(`Courses not found: ${missingIds.join(', ')}`);
        }

        // Validate all courses are published
        const unpublishedCourses = courses.filter(c => c.status !== CourseStatus.PUBLISHED);
        if (unpublishedCourses.length > 0) {
            throw new ForbiddenException(
                `Cannot purchase unpublished courses: ${unpublishedCourses.map(c => c.title).join(', ')}`
            );
        }

        // 2. Check user not already enrolled in any course
        const existingEnrollments = await this.prisma.enrollment.findMany({
            where: {
                userId,
                courseId: { in: uniqueCourseIds },
                status: EnrollmentStatus.ACTIVE,
            },
            include: { course: { select: { title: true } } },
        });

        if (existingEnrollments.length > 0) {
            throw new ConflictException(
                `Already enrolled in: ${existingEnrollments.map(e => e.course.title).join(', ')}`
            );
        }

        // 3. Cleanup any pending enrollments/payments (handles batch payments properly)
        await this.cleanupPendingPaymentsForCourses(userId, uniqueCourseIds);

        // Calculate total amount and build items array
        let totalAmount = 0;
        const paymentItems: { name: string; quantity: number; price: number }[] = [];

        for (const course of courses) {
            const price = Number(course.discountPrice ?? course.price);
            totalAmount += price;
            paymentItems.push({
                name: course.title.substring(0, 50),
                quantity: 1,
                price,
            });
        }

        const orderCode = generateOrderCode();

        // 3. Create PENDING enrollments for each course
        const enrollmentIds: number[] = [];
        for (const courseId of uniqueCourseIds) {
            const enrollment = await this.prisma.enrollment.create({
                data: {
                    userId,
                    courseId,
                    status: EnrollmentStatus.PENDING,
                },
            });
            enrollmentIds.push(enrollment.id);
        }

        // 4. Create one PENDING payment with total amount
        // Store courseIds and enrollmentIds in paymentData for webhook processing
        const payment = await this.prisma.payment.create({
            data: {
                userId,
                enrollmentId: enrollmentIds[0], // Link to first enrollment for backward compatibility
                amount: totalAmount,
                currency: 'VND',
                status: PaymentStatus.PENDING,
                method: 'PAYOS',
                transactionId: orderCode.toString(),
                paymentData: {
                    isBatch: true,
                    courseIds: uniqueCourseIds,
                    enrollmentIds,
                },
            },
        });

        // 5. Get payment URL from PayOS (or mock)
        let paymentUrl: string;

        if (this.payosService.isMockMode()) {
            paymentUrl = this.payosService.getMockPaymentUrl(orderCode);
            this.logger.log(`[MOCK] Created batch payment link: ${paymentUrl}`);
        } else {
            const courseCount = uniqueCourseIds.length;
            paymentUrl = await this.payosService.createPaymentLink({
                orderCode,
                amount: totalAmount,
                description: `Thanh toan ${courseCount} khoa hoc`.substring(0, 25),
                items: paymentItems,
                returnUrl: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
                cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
            });
        }

        this.logger.log(`[BatchPayment] Created payment ${payment.id} for ${uniqueCourseIds.length} courses, total: ${totalAmount} VND`);

        return {
            success: true,
            paymentUrl,
            orderCode,
            paymentId: payment.id,
            enrollmentId: enrollmentIds[0], // Return first enrollmentId for backward compatibility
        };
    }


    /**
     * Handle PayOS webhook callback
     * 1. Verify signature
     * 2. Check idempotency (not already processed)
     * 3. Update payment and enrollment status atomically
     * 4. For batch payments, update ALL enrollments
     */
    async handleWebhook(payload: PayOSWebhookPayload, signature: string): Promise<{ success: boolean; message: string }> {
        this.logger.log(`Received webhook for orderCode: ${payload.data?.orderCode}`);

        // 1. Verify signature (skip in mock mode)
        const isValid = this.payosService.verifyWebhookSignature(payload, signature);
        if (!isValid) {
            this.logger.error('Invalid webhook signature');
            throw new ForbiddenException('Invalid signature');
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

        // 5. Check if this is a batch payment
        const paymentData = payment.paymentData as { isBatch?: boolean; enrollmentIds?: number[] } | null;
        const isBatch = paymentData?.isBatch === true;
        const enrollmentIdsToUpdate = isBatch && paymentData?.enrollmentIds
            ? paymentData.enrollmentIds
            : [payment.enrollmentId];

        this.logger.log(`Processing ${isBatch ? 'batch' : 'single'} payment, updating ${enrollmentIdsToUpdate.length} enrollments`);

        // 6. Update payment and enrollment(s) atomically
        const operations: any[] = [
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: newPaymentStatus,
                    paidAt: isSuccess ? new Date() : null,
                    // Merge webhook payload into existing paymentData
                    paymentData: {
                        ...(paymentData || {}),
                        webhookPayload: payload,
                    } as any,
                },
            }),
        ];

        // Add enrollment updates
        for (const enrollmentId of enrollmentIdsToUpdate) {
            operations.push(
                this.prisma.enrollment.update({
                    where: { id: enrollmentId },
                    data: { status: newEnrollmentStatus },
                })
            );
        }

        await this.prisma.$transaction(operations);

        this.logger.log(`Payment ${orderCode} updated to ${newPaymentStatus}, ${enrollmentIdsToUpdate.length} enrollments updated`);
        return { success: true, message: `Payment ${isSuccess ? 'completed' : 'failed'}` };
    }

    /**
     * Verify payment status after user returns from PayOS
     * If payment is still PENDING, call PayOS API to get actual status
     * and update DB accordingly (e.g., mark as FAILED if cancelled)
     */
    async verifyPayment(orderCode: string, userId: number): Promise<PaymentVerifyResponseDto> {
        let payment = await this.prisma.payment.findUnique({
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

        // If payment is still PENDING, check with PayOS to get actual status
        if (payment.status === PaymentStatus.PENDING) {
            this.logger.log(`[verifyPayment] Payment ${orderCode} is PENDING, checking with PayOS...`);

            try {
                const payosStatus = await this.payosService.getPaymentInfo(orderCode);

                if (payosStatus) {
                    const newStatus = mapPayOSStatus(payosStatus);
                    this.logger.log(`[verifyPayment] PayOS status: ${payosStatus} -> Internal: ${newStatus}`);

                    // If status changed from PENDING, update DB
                    if (newStatus !== 'PENDING') {
                        const newPaymentStatus = newStatus === 'COMPLETED'
                            ? PaymentStatus.COMPLETED
                            : PaymentStatus.FAILED;

                        const newEnrollmentStatus = newStatus === 'COMPLETED'
                            ? EnrollmentStatus.ACTIVE
                            : EnrollmentStatus.PENDING;

                        // Check if this is a batch payment
                        const paymentData = payment.paymentData as { isBatch?: boolean; enrollmentIds?: number[] } | null;
                        const isBatch = paymentData?.isBatch === true;
                        const enrollmentIdsToUpdate = isBatch && paymentData?.enrollmentIds
                            ? paymentData.enrollmentIds
                            : [payment.enrollmentId];

                        // Update payment and enrollment(s) atomically
                        const operations: any[] = [
                            this.prisma.payment.update({
                                where: { id: payment.id },
                                data: {
                                    status: newPaymentStatus,
                                    paidAt: newStatus === 'COMPLETED' ? new Date() : null,
                                    paymentData: {
                                        ...(paymentData || {}),
                                        verifiedAt: new Date().toISOString(),
                                        payosStatus,
                                    } as any,
                                },
                            }),
                        ];

                        for (const enrollmentId of enrollmentIdsToUpdate) {
                            operations.push(
                                this.prisma.enrollment.update({
                                    where: { id: enrollmentId },
                                    data: { status: newEnrollmentStatus },
                                })
                            );
                        }

                        await this.prisma.$transaction(operations);

                        this.logger.log(`[verifyPayment] Updated payment ${orderCode} to ${newPaymentStatus}`);

                        // Refresh payment data after update
                        payment = await this.prisma.payment.findUnique({
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
                        }) as typeof payment;
                    }
                }
            } catch (error) {
                // Log error but don't fail - return current DB status
                this.logger.warn(`[verifyPayment] Failed to check PayOS status: ${error}`);
            }
        }

        return {
            success: payment.status === PaymentStatus.COMPLETED,
            status: payment.status,
            message: this.mapper.getStatusMessage(payment.status),
            paymentId: payment.id,
            enrollmentId: payment.enrollmentId,
            course: this.mapper.mapToCourseRef(payment.enrollment.course),
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

        return payments.map((p) => this.mapper.mapToListItem(p));
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
            payments: payments.map((p) => this.mapper.mapToDetail(p)),
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

        return this.mapper.mapToDetail(payment);
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
        if (!this.payosService.isMockMode()) {
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
        if (!this.payosService.isMockMode()) {
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
            course: this.mapper.mapToCourseRef(payment.enrollment.course),
        };
    }
}
