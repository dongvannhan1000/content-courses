import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  // Inject ConfigService để lấy biến môi trường theo cách NestJS chuẩn
  constructor(private readonly configService: ConfigService) {
    // Sử dụng ConfigService thay vì process.env trực tiếp
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be defined in the environment.');
    }

    // Khởi tạo Pool và Adapter cho Prisma 7.x
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    super({
      adapter: adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.pool.end();
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication) {
    const shutdown = () => {
      void this.$disconnect()
        .catch((error: unknown) => {
          console.error('Error disconnecting Prisma', error);
        })
        .finally(() => {
          void app.close();
        });
    };

    process.on('beforeExit', shutdown);
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}