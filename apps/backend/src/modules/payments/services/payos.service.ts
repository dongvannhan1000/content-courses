/**
 * PayOS Service
 * Handles all PayOS API integration
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
    getPayOSConfig,
    PayOSConfig,
    PayOSWebhookPayload,
    CreatePaymentLinkRequest,
    CreatePaymentLinkResponse,
    PaymentVerificationResponse,
    PayOSPaymentStatus,
} from '../payos.config';

@Injectable()
export class PayOSService {
    private readonly logger = new Logger(PayOSService.name);
    private readonly config: PayOSConfig;

    constructor() {
        this.config = getPayOSConfig();
    }

    /**
     * Check if running in mock mode
     */
    isMockMode(): boolean {
        return this.config.mockMode;
    }

    /**
     * Get mock payment URL for local testing
     */
    getMockPaymentUrl(orderCode: number): string {
        return `http://localhost:3000/api/payments/mock-pay/${orderCode}`;
    }

    /**
     * Create payment link via PayOS API
     */
    async createPaymentLink(request: CreatePaymentLinkRequest): Promise<string> {
        const signature = this.generateSignature(request);

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
     * Get payment info from PayOS API
     * Returns null if in mock mode or API fails
     */
    async getPaymentInfo(orderCode: string): Promise<PayOSPaymentStatus | null> {
        if (this.config.mockMode) {
            this.logger.log(`[MOCK] getPaymentInfo called for ${orderCode}, returning null`);
            return null;
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/v2/payment-requests/${orderCode}`, {
                method: 'GET',
                headers: {
                    'x-client-id': this.config.clientId,
                    'x-api-key': this.config.apiKey,
                },
            });

            const data = (await response.json()) as PaymentVerificationResponse;

            if (data.code !== '00') {
                this.logger.warn(`PayOS getPaymentInfo error: ${data.desc}`);
                return null;
            }

            this.logger.log(`[PayOS] Payment ${orderCode} status: ${data.data.status}`);
            return data.data.status;
        } catch (error) {
            this.logger.error(`PayOS getPaymentInfo error: ${error}`);
            return null;
        }
    }

    /**
     * Generate PayOS signature for request
     */
    generateSignature(data: CreatePaymentLinkRequest): string {
        const sortedKeys = ['amount', 'cancelUrl', 'description', 'orderCode', 'returnUrl'];
        const signatureString = sortedKeys
            .map((key) => `${key}=${(data as any)[key]}`)
            .join('&');

        return crypto
            .createHmac('sha256', this.config.checksumKey)
            .update(signatureString)
            .digest('hex');
    }

    /**
     * Verify webhook signature from PayOS
     */
    verifyWebhookSignature(payload: PayOSWebhookPayload, signature: string): boolean {
        if (this.config.mockMode) {
            return true; // Skip verification in mock mode
        }

        try {
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
}
