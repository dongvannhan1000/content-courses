import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './infra/prisma/prisma.module';
import { FirebaseModule } from './infra/firebase/firebase.module';

import { AuthModule } from './modules/auth/auth.module';
import { FirebaseAuthGuard } from './modules/auth/guards/firebase-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    // Load .env file and make ConfigService available globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    FirebaseModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    CoursesModule,
    LessonsModule,
    EnrollmentsModule,
    PaymentsModule,
    MediaModule,
    PrismaModule,
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 second
        limit: 3,     // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000,   // 10 seconds
        limit: 20,    // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,   // 1 minute
        limit: 100,   // 100 requests per minute
      },
    ]),
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    // Global guards - order matters!
    // 1. FirebaseAuthGuard: Authenticate user (attach user to request)
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
    // 2. RolesGuard: Check user.role against @Roles() decorator
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // 3. ThrottlerGuard: Rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }


