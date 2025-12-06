import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './infra/prisma/prisma.module';

import { VocabModule } from './modules/vocab/vocab.module';
import { DecksModule } from './modules/decks/decks.module';
import { ReviewModule } from './modules/review/review.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    VocabModule,
    PrismaModule,
    DecksModule,
    ReviewModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
