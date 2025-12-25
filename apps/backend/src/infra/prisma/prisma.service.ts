import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ENV } from '../../config/environment.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be defined in the environment.');
    }

    // Khởi tạo Pool với cấu hình có thể điều chỉnh qua environment variables
    const pool = new Pool({
      connectionString: databaseUrl,
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),           // Default 20 connections
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),            // Keep 2 connections alive
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),  // 30s idle timeout
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),  // 5s connect timeout
    });
    const adapter = new PrismaPg(pool);

    super({
      adapter: adapter,
      log: ENV.prismaLogLevels as any,
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