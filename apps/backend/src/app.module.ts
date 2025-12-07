import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './infra/prisma/prisma.module';
import { FirebaseModule } from './infra/firebase/firebase.module';

import { AuthModule } from './modules/auth/auth.module';
import { FirebaseAuthGuard } from './modules/auth/guards/firebase-auth.guard';

@Module({
  imports: [
    CommonModule,
    FirebaseModule,
    AuthModule,
    PrismaModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
})
export class AppModule { }

