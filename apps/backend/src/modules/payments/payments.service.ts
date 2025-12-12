import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) { }

    async findByUser(userId: number) {
        return this.prisma.payment.findMany({
            where: { userId },
            include: { enrollment: { include: { course: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByTransactionId(transactionId: string) {
        return this.prisma.payment.findUnique({ where: { transactionId } });
    }

    async create(data: {
        userId: number;
        enrollmentId: number;
        amount: number;
        method: string;
        transactionId: string;
    }) {
        return this.prisma.payment.create({
            data: { ...data, status: PaymentStatus.PENDING },
        });
    }

    async updateStatus(transactionId: string, status: PaymentStatus) {
        return this.prisma.payment.update({
            where: { transactionId },
            data: { status, paidAt: status === PaymentStatus.COMPLETED ? new Date() : null },
        });
    }
}
