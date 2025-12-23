/**
 * Payment Mapper Service
 * Handles DTO mapping utilities for payments
 */
import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import {
    PaymentListItemDto,
    PaymentDetailDto,
    CoursePaymentRefDto,
    UserPaymentRefDto,
} from '../dto/payment-response.dto';

@Injectable()
export class PaymentMapperService {
    /**
     * Get Vietnamese status message
     */
    getStatusMessage(status: PaymentStatus): string {
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

    /**
     * Map payment entity to list item DTO
     */
    mapToListItem(payment: any): PaymentListItemDto {
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

    /**
     * Map payment entity to detail DTO
     */
    mapToDetail(payment: any): PaymentDetailDto {
        return {
            ...this.mapToListItem(payment),
            user: this.mapToUserRef(payment.user),
            paymentData: payment.paymentData ?? undefined,
            enrollmentId: payment.enrollmentId,
            updatedAt: payment.updatedAt,
        };
    }

    /**
     * Map course to reference DTO
     */
    mapToCourseRef(course: any): CoursePaymentRefDto {
        return {
            id: course.id,
            title: course.title,
            slug: course.slug,
            thumbnail: course.thumbnail ?? undefined,
        };
    }

    /**
     * Map user to reference DTO
     */
    mapToUserRef(user: any): UserPaymentRefDto {
        return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
        };
    }
}
