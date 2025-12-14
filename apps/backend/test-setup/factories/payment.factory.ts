import { faker } from '@faker-js/faker';
import { Payment, PaymentStatus } from '@prisma/client';
import { BaseFactory } from './base.factory';
import { Prisma } from '@prisma/client';

/**
 * Payment factory for creating test payments
 * Supports different payment statuses, methods, and amounts
 */
export class PaymentFactory extends BaseFactory<Payment> {
  create(overrides?: Partial<Prisma.PaymentCreateInput>): Prisma.PaymentCreateInput {
    const amount = faker.datatype.number({ min: 99000, max: 2999000 }); // 99K - 2,999K VND

    return {
      amount,
      currency: 'VND',
      status: PaymentStatus.PENDING,
      method: 'PAYOS',
      transactionId: faker.datatype.uuid(),
      paymentData: {
        orderCode: faker.datatype.number({ min: 100000, max: 999999 }),
        checkoutUrl: faker.internet.url(),
        qrCode: faker.image.dataUri(),
      },
      userId: null, // Will be set when creating
      enrollmentId: null, // Will be set when creating
      ...overrides,
    };
  }

  getModelName(): string {
    return 'payment';
  }

  /**
   * Create pending payment
   */
  static createPending(overrides?: Partial<Prisma.PaymentCreateInput>): Prisma.PaymentCreateInput {
    return new PaymentFactory().create({
      status: PaymentStatus.PENDING,
      ...overrides,
    });
  }

  /**
   * Create completed payment
   */
  static createCompleted(overrides?: Partial<Prisma.PaymentCreateInput>): Prisma.PaymentCreateInput {
    return new PaymentFactory().create({
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
      ...overrides,
    });
  }

  /**
   * Create failed payment
   */
  static createFailed(overrides?: Partial<Prisma.PaymentCreateInput>): Prisma.PaymentCreateInput {
    return new PaymentFactory().create({
      status: PaymentStatus.FAILED,
      paymentData: {
        errorCode: 'PAYMENT_FAILED',
        errorMessage: 'Payment processing failed',
      },
      ...overrides,
    });
  }

  /**
   * Create refunded payment
   */
  static createRefunded(overrides?: Partial<Prisma.PaymentCreateInput>): Prisma.PaymentCreateInput {
    const completedPayment = this.createCompleted(overrides);

    return {
      ...completedPayment,
      status: PaymentStatus.REFUNDED,
      paymentData: {
        ...completedPayment.paymentData as any,
        refundedAt: new Date().toISOString(),
        refundReason: 'Customer requested refund',
      },
    };
  }

  /**
   * Create payment for specific user and enrollment
   */
  static async createForUserAndEnrollment(
    userId: number,
    enrollmentId: number,
    overrides?: Partial<Prisma.PaymentCreateInput>
  ): Promise<Payment> {
    const factory = new PaymentFactory();

    return await factory.createAndSave({
      userId,
      enrollmentId,
      ...overrides,
    });
  }

  /**
   * Create payment with PayOS data
   */
  static createWithPayOSData(
    orderCode: number,
    overrides?: Partial<Prisma.PaymentCreateInput>
  ): Prisma.PaymentCreateInput {
    return new PaymentFactory().create({
      method: 'PAYOS',
      paymentData: {
        orderCode,
        checkoutUrl: `https://payos.vn/checkout/${faker.datatype.uuid()}`,
        qrCode: faker.image.dataUri(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      },
      transactionId: `PAYOS_${orderCode}_${faker.datatype.uuid()}`,
      ...overrides,
    });
  }

  /**
   * Create payment with specific amount
   */
  static createWithAmount(
    amount: number,
    overrides?: Partial<Prisma.PaymentCreateInput>
  ): Prisma.PaymentCreateInput {
    return new PaymentFactory().create({
      amount,
      ...overrides,
    });
  }

  /**
   * Create payment for course purchase
   */
  static async createForCoursePurchase(
    userId: number,
    courseId: number,
    coursePrice: number,
    overrides?: Partial<Prisma.PaymentCreateInput>
  ): Promise<{ payment: Payment; enrollment?: any }> {
    const factory = new PaymentFactory();

    // Note: This would require EnrollmentFactory to be available
    const payment = await factory.createAndSave({
      userId,
      amount: coursePrice,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
      paymentData: {
        courseId,
        description: `Course purchase - Course ID: ${courseId}`,
      },
      ...overrides,
    });

    return {
      payment,
      // enrollment: TODO: Create enrollment when EnrollmentFactory is available
    };
  }

  /**
   * Create payment with webhook data
   */
  static createWithWebhookData(
    webhookPayload: any,
    overrides?: Partial<Prisma.PaymentCreateInput>
  ): Prisma.PaymentCreateInput {
    return new PaymentFactory().create({
      status: webhookPayload.status === 'PAID' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
      paidAt: webhookPayload.status === 'PAID' ? new Date() : undefined,
      paymentData: {
        ...webhookPayload,
        webhookReceivedAt: new Date().toISOString(),
      },
      ...overrides,
    });
  }

  /**
   * Find payments by status
   */
  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    return await this.prisma.payment.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find completed payments
   */
  async findCompleted(): Promise<Payment[]> {
    return await this.findByStatus(PaymentStatus.COMPLETED);
  }

  /**
   * Find payments by user
   */
  async findByUser(userId: number): Promise<Payment[]> {
    return await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find payments by method
   */
  async findByMethod(method: string): Promise<Payment[]> {
    return await this.prisma.payment.findMany({
      where: { method },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find payments by amount range
   */
  async findByAmountRange(minAmount: number, maxAmount: number): Promise<Payment[]> {
    return await this.prisma.payment.findMany({
      where: {
        AND: [
          { amount: { gte: minAmount } },
          { amount: { lte: maxAmount } },
        ],
      },
      orderBy: { amount: 'desc' },
    });
  }

  /**
   * Find payments by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return await this.prisma.payment.findMany({
      where: {
        AND: [
          { createdAt: { gte: startDate } },
          { createdAt: { lte: endDate } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Search payments by transaction ID
   */
  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return await this.prisma.payment.findUnique({
      where: { transactionId },
    });
  }

  /**
   * Get payment statistics for a user
   */
  async getUserPaymentStats(userId: number): Promise<{
    totalAmount: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
  }> {
    const payments = await this.findByUser(userId);

    const stats = payments.reduce(
      (acc, payment) => {
        acc.totalAmount += payment.amount.toNumber();

        switch (payment.status) {
          case PaymentStatus.COMPLETED:
            acc.completedPayments++;
            break;
          case PaymentStatus.PENDING:
            acc.pendingPayments++;
            break;
          case PaymentStatus.FAILED:
            acc.failedPayments++;
            break;
        }

        return acc;
      },
      {
        totalAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
      }
    );

    return stats;
  }

  /**
   * Create payment test scenarios
   */
  static createTestScenarios(): {
    successfulPayment: Prisma.PaymentCreateInput;
    failedPayment: Prisma.PaymentCreateInput;
    refundedPayment: Prisma.PaymentCreateInput;
    pendingPayment: Prisma.PaymentCreateInput;
  } {
    return {
      successfulPayment: this.createCompleted({
        amount: 299000,
        method: 'PAYOS',
        paymentData: {
          orderCode: 123456,
          checkoutUrl: 'https://payos.vn/checkout/success',
        },
      }),

      failedPayment: this.createFailed({
        amount: 199000,
        method: 'PAYOS',
        paymentData: {
          errorCode: 'INSUFFICIENT_FUNDS',
          errorMessage: 'Insufficient funds in account',
        },
      }),

      refundedPayment: this.createRefunded({
        amount: 399000,
        method: 'PAYOS',
        paymentData: {
          refundReason: 'Course not satisfactory',
          refundedAt: new Date().toISOString(),
        },
      }),

      pendingPayment: this.createPending({
        amount: 499000,
        method: 'PAYOS',
        paymentData: {
          orderCode: 789012,
          checkoutUrl: 'https://payos.vn/checkout/pending',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      }),
    };
  }

  /**
   * Create bulk payments for testing
   */
  async createBulkPayments(
    count: number,
    userId: number,
    statusDistribution?: {
      completed: number;
      pending: number;
      failed: number;
    }
  ): Promise<Payment[]> {
    const distribution = statusDistribution || {
      completed: Math.floor(count * 0.7), // 70% completed
      pending: Math.floor(count * 0.2), // 20% pending
      failed: Math.floor(count * 0.1), // 10% failed
    };

    const payments: Payment[] = [];

    // Create completed payments
    for (let i = 0; i < distribution.completed; i++) {
      const payment = await this.createAndSave({
        userId,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(Date.now() - faker.datatype.number({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000),
        amount: faker.datatype.number({ min: 99000, max: 2999000 }),
      });
      payments.push(payment);
    }

    // Create pending payments
    for (let i = 0; i < distribution.pending; i++) {
      const payment = await this.createAndSave({
        userId,
        status: PaymentStatus.PENDING,
        amount: faker.datatype.number({ min: 99000, max: 2999000 }),
      });
      payments.push(payment);
    }

    // Create failed payments
    for (let i = 0; i < distribution.failed; i++) {
      const payment = await this.createAndSave({
        userId,
        status: PaymentStatus.FAILED,
        amount: faker.datatype.number({ min: 99000, max: 2999000 }),
        paymentData: {
          errorCode: 'PROCESSING_ERROR',
          errorMessage: 'Payment processing failed',
        },
      });
      payments.push(payment);
    }

    return payments;
  }
}