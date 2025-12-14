import { faker } from '@faker-js/faker';

export interface MockPaymentOrder {
  orderCode: number;
  amount: number;
  description: string;
  checkoutUrl: string;
  qrCode: string;
  expiresAt: Date;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
}

export interface MockPaymentInfo {
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  amount: number;
  orderCode: number;
  transactionId?: string;
  paidAt?: Date;
  cancelledAt?: Date;
}

/**
 * PayOS mock utilities for testing
 * Provides mock PayOS payment gateway functionality
 */
export class MockPayOS {
  private static orders = new Map<number, MockPaymentOrder>();

  /**
   * Create a mock payment order
   */
  static createMockPaymentOrder(data: {
    amount: number;
    description: string;
    orderCode?: number;
  }): MockPaymentOrder {
    const orderCode = data.orderCode || faker.number.int({ min: 100000, max: 999999 });

    const order: MockPaymentOrder = {
      orderCode,
      amount: data.amount,
      description: data.description,
      checkoutUrl: `https://payos.vn/checkout/${faker.string.uuid()}`,
      qrCode: faker.image.dataUri(), // Mock QR code
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      status: 'PENDING',
    };

    this.orders.set(orderCode, order);
    return order;
  }

  /**
   * Create mock payment info
   */
  static createMockPaymentInfo(orderCode: number, status: MockPaymentInfo['status'] = 'PAID'): MockPaymentInfo {
    const order = this.orders.get(orderCode);
    if (!order) {
      throw new Error(`Order ${orderCode} not found`);
    }

    return {
      status,
      amount: order.amount,
      orderCode,
      transactionId: faker.string.alphanumeric(36),
      paidAt: status === 'PAID' ? new Date() : undefined,
      cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
    };
  }

  /**
   * Mock PayOS client
   */
  static mockPayOSClient() {
    return {
      createPaymentLink: jest.fn().mockImplementation(async (data: any) => {
        return this.createMockPaymentOrder({
          amount: data.amount,
          description: data.description,
          orderCode: data.orderCode,
        });
      }),

      getPaymentLinkInfo: jest.fn().mockImplementation(async (orderCode: number) => {
        // Simulate different statuses based on order code patterns
        if (orderCode.toString().endsWith('99')) {
          return this.createMockPaymentInfo(orderCode, 'CANCELLED');
        }
        if (orderCode.toString().endsWith('88')) {
          return this.createMockPaymentInfo(orderCode, 'EXPIRED');
        }
        // Default to PAID
        return this.createMockPaymentInfo(orderCode, 'PAID');
      }),

      cancelPaymentLink: jest.fn().mockImplementation(async (orderCode: number) => {
        const order = this.orders.get(orderCode);
        if (order) {
          order.status = 'CANCELLED';
          return {
            orderCode,
            status: 'CANCELLED',
            cancelledAt: new Date(),
          };
        }
        throw new Error('Order not found');
      }),

      confirmWebhook: jest.fn().mockImplementation(async (data: any) => {
        return {
          status: 'success',
          message: 'Webhook confirmed successfully',
        };
      }),

      // Additional PayOS methods
      getOrderList: jest.fn().mockImplementation(async (filters: any) => {
        return {
          data: Array.from(this.orders.values()),
          total: this.orders.size,
        };
      }),

      refundPayment: jest.fn().mockImplementation(async (data: any) => {
        return {
          status: 'success',
          refundId: faker.string.alphanumeric(36),
          amount: data.amount,
        };
      }),
    };
  }

  /**
   * Mock PayOS webhook payload
   */
  static createMockWebhookPayload(orderCode: number, status: 'PAID' | 'CANCELLED' = 'PAID') {
    const order = this.orders.get(orderCode);
    if (!order) {
      throw new Error(`Order ${orderCode} not found`);
    }

    return {
      orderCode,
      status,
      amount: order.amount,
      transactionId: faker.string.alphanumeric(36),
      description: order.description,
      paidAt: status === 'PAID' ? new Date().toISOString() : undefined,
      cancelledAt: status === 'CANCELLED' ? new Date().toISOString() : undefined,
      signature: faker.string.alphanumeric(64), // Mock signature
    };
  }

  /**
   * Create mock successful payment webhook
   */
  static createMockSuccessWebhook(orderCode: number) {
    return this.createMockWebhookPayload(orderCode, 'PAID');
  }

  /**
   * Create mock cancelled payment webhook
   */
  static createMockCancelWebhook(orderCode: number) {
    return this.createMockWebhookPayload(orderCode, 'CANCELLED');
  }

  /**
   * Setup PayOS mocks for testing
   */
  static setupMocks() {
    const mockPayOS = this.mockPayOSClient();

    // Mock PayOS SDK
    jest.mock('@payos/node', () => ({
      PayOS: jest.fn(() => mockPayOS),
    }));

    // Mock PayOS environment variables
    if (process.env.PAYOS_MOCK_MODE === 'true') {
      process.env.PAYOS_CLIENT_ID = 'test-client-id';
      process.env.PAYOS_API_KEY = 'test-api-key';
      process.env.PAYOS_CHECKSUM_KEY = 'test-checksum-key';
    }

    return mockPayOS;
  }

  /**
   * Reset all PayOS mocks
   */
  static resetMocks() {
    this.orders.clear();
    jest.clearAllMocks();
  }

  /**
   * Create test payment scenarios
   */
  static createTestScenarios() {
    return {
      successfulPayment: {
        order: this.createMockPaymentOrder({
          amount: 299000,
          description: 'Course payment',
          orderCode: 123456,
        }),
        webhook: this.createMockSuccessWebhook(123456),
      },

      cancelledPayment: {
        order: this.createMockPaymentOrder({
          amount: 199000,
          description: 'Course payment',
          orderCode: 12345699,
        }),
        webhook: this.createMockCancelWebhook(12345699),
      },

      expiredPayment: {
        order: this.createMockPaymentOrder({
          amount: 399000,
          description: 'Course payment',
          orderCode: 12345688,
        }),
        info: this.createMockPaymentInfo(12345688, 'EXPIRED'),
      },
    };
  }
}