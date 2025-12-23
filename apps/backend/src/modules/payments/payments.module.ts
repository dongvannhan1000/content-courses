import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayOSService, PaymentMapperService } from './services';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
    imports: [PrismaModule, EnrollmentsModule],
    controllers: [PaymentsController],
    providers: [PaymentsService, PayOSService, PaymentMapperService],
    exports: [PaymentsService],
})
export class PaymentsModule { }

