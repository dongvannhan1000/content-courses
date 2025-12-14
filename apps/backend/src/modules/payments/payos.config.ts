/**
 * PayOS Payment Gateway Configuration
 * 
 * This module provides configuration and types for PayOS integration.
 * Supports both real PayOS API and mock mode for local testing.
 */

// ============ Environment Configuration ============

export interface PayOSConfig {
    clientId: string;
    apiKey: string;
    checksumKey: string;
    partnerCode: string;
    baseUrl: string;
    mockMode: boolean;
}

export function getPayOSConfig(): PayOSConfig {
    const mockMode = process.env.PAYOS_MOCK_MODE === 'true';

    return {
        clientId: process.env.PAYOS_CLIENT_ID || '',
        apiKey: process.env.PAYOS_API_KEY || '',
        checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'mock-checksum-key',
        partnerCode: process.env.PAYOS_PARTNER_CODE || '',
        baseUrl: process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn',
        mockMode,
    };
}

// ============ PayOS API Types ============

/**
 * Request to create a payment link
 */
export interface CreatePaymentLinkRequest {
    orderCode: number;
    amount: number;
    description: string;
    items: PaymentItem[];
    cancelUrl: string;
    returnUrl: string;
    expiredAt?: number; // Unix timestamp
    signature?: string;
}

export interface PaymentItem {
    name: string;
    quantity: number;
    price: number;
}

/**
 * Response from create payment link API
 */
export interface CreatePaymentLinkResponse {
    code: string;
    desc: string;
    data: {
        bin: string;
        accountNumber: string;
        accountName: string;
        amount: number;
        description: string;
        orderCode: number;
        currency: string;
        paymentLinkId: string;
        status: string;
        checkoutUrl: string;
        qrCode: string;
    };
    signature: string;
}

/**
 * PayOS webhook payload structure
 */
export interface PayOSWebhookPayload {
    code: string;
    desc: string;
    success: boolean;
    data: {
        orderCode: number;
        amount: number;
        description: string;
        accountNumber: string;
        reference: string;
        transactionDateTime: string;
        currency: string;
        paymentLinkId: string;
        code: string;
        desc: string;
        counterAccountBankId: string | null;
        counterAccountBankName: string | null;
        counterAccountName: string | null;
        counterAccountNumber: string | null;
        virtualAccountName: string | null;
        virtualAccountNumber: string | null;
    };
    signature: string;
}

/**
 * Payment verification response
 */
export interface PaymentVerificationResponse {
    code: string;
    desc: string;
    data: {
        id: string;
        orderCode: number;
        amount: number;
        amountPaid: number;
        amountRemaining: number;
        status: PayOSPaymentStatus;
        createdAt: string;
        transactions: PayOSTransaction[];
        cancellationReason: string | null;
        canceledAt: string | null;
    };
    signature: string;
}

export interface PayOSTransaction {
    reference: string;
    amount: number;
    accountNumber: string;
    description: string;
    transactionDateTime: string;
    virtualAccountName: string | null;
    virtualAccountNumber: string | null;
    counterAccountBankId: string | null;
    counterAccountBankName: string | null;
    counterAccountName: string | null;
    counterAccountNumber: string | null;
}

/**
 * PayOS Payment Status (theo docs chính thức)
 * - PAID: Đã thanh toán thành công
 * - PENDING: Chờ thanh toán
 * - PROCESSING: Đang xử lý giao dịch
 * - CANCELLED: Đã hủy (user hủy hoặc hết hạn link)
 */
export type PayOSPaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';

// ============ Internal Types ============

/**
 * Order code generation - uses timestamp + random for uniqueness
 */
export function generateOrderCode(): number {
    const timestamp = Date.now() % 1000000000; // Last 9 digits of timestamp
    const random = Math.floor(Math.random() * 1000); // 3 random digits
    return parseInt(`${timestamp}${random.toString().padStart(3, '0')}`);
}

/**
 * Map PayOS status to internal PaymentStatus
 * 
 * Mapping:
 * - PAID → COMPLETED (thanh toán thành công)
 * - CANCELLED → FAILED (user hủy hoặc link hết hạn)
 * - PENDING/PROCESSING → PENDING (chờ hoàn tất)
 */
export function mapPayOSStatus(payosStatus: PayOSPaymentStatus): 'PENDING' | 'COMPLETED' | 'FAILED' {
    switch (payosStatus) {
        case 'PAID':
            return 'COMPLETED';
        case 'CANCELLED':
            return 'FAILED';
        case 'PENDING':
        case 'PROCESSING':
        default:
            return 'PENDING';
    }
}
