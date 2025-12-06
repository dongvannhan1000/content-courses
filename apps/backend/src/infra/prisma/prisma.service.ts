import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    const shutdown = () => {
      void this.$disconnect()
        .catch((error) => {
          console.error('Error disconnecting Prisma', error);
        })
        .finally(() => {
          void app.close();
        });
    };

    process.on('beforeExit', shutdown); // Node event
    process.on('SIGINT', shutdown); // Ctrl+C
    process.on('SIGTERM', shutdown); // kill/PM2/Docker
  }
}
