import { apiClient } from "./client";

export interface CreatePaymentResponse {
    success: boolean;
    paymentUrl: string;
    orderCode: number;
    paymentId: number;
    enrollmentId: number;
}

export interface PaymentVerifyResponse {
    success: boolean;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    message?: string;
    paymentId: number;
    enrollmentId?: number;
    course?: {
        id: number;
        title: string;
        slug: string;
        thumbnail?: string;
    };
}

export interface PaymentListItem {
    id: number;
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    method?: string;
    transactionId?: string;
    course: {
        id: number;
        title: string;
        slug: string;
        thumbnail?: string;
    };
    createdAt: Date;
    paidAt?: Date;
}

export const paymentsApi = {
    /**
     * Create a payment for a course
     * Returns payment URL for redirect
     */
    createPayment: async (
        courseId: number,
        returnUrl?: string,
        cancelUrl?: string
    ): Promise<CreatePaymentResponse> => {
        const { data } = await apiClient.post("/payments/create", {
            courseId,
            returnUrl,
            cancelUrl,
        });
        return data;
    },

    /**
     * Verify payment status after returning from payment page
     */
    verifyPayment: async (orderCode: string): Promise<PaymentVerifyResponse> => {
        const { data } = await apiClient.get(`/payments/verify/${orderCode}`);
        return data;
    },

    /**
     * Mock payment completion (DEV ONLY)
     * Simulates successful payment for local testing
     */
    mockPayment: async (orderCode: string): Promise<PaymentVerifyResponse> => {
        const { data } = await apiClient.get(`/payments/mock-pay/${orderCode}`);
        return data;
    },

    /**
     * Get user's payment history
     */
    getMyPayments: async (): Promise<PaymentListItem[]> => {
        const { data } = await apiClient.get("/payments/my-payments");
        return data;
    },
};
