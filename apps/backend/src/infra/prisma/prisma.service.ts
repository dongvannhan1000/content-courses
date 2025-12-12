import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
// 1. IMPORT CÁC THÀNH PHẦN CẦN THIẾT
import { PrismaPg } from '@prisma/adapter-pg'; 
import { Pool } from 'pg'; 


@Injectable()
// Thêm OnModuleDestroy để đảm bảo kết nối Pool cũng được đóng
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Biến để lưu trữ Pool kết nối CSDL (Cần thiết cho Adapter)
  private readonly pool: Pool;
  
  // 2. THÊM CONSTRUCTOR MỚI
  constructor() {
    // Đảm bảo DATABASE_URL đã được tải vào process.env
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL must be defined in the environment.");
    }

    // Khởi tạo Pool và Adapter
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    
    // Gán pool vào biến private để có thể đóng nó sau này
    super({
      adapter: adapter, // Yêu cầu của Prisma 7.x
      log: ['query', 'error', 'warn'], // Tùy chọn: Log các truy vấn CSDL
    });
    
    this.pool = pool;
  }

  // Phương thức kết nối (vẫn giữ nguyên)
  async onModuleInit() {
    await this.$connect();
  }

  // 3. THÊM LOGIC ĐÓNG KẾT NỐI POOL
  async onModuleDestroy() {
    // Đảm bảo Pool kết nối cũng được đóng khi ứng dụng tắt
    await this.pool.end();
    await this.$disconnect();
  }

  // ... (Giữ nguyên enableShutdownHooks)
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

    process.on('beforeExit', shutdown); // Node event
    process.on('SIGINT', shutdown); // Ctrl+C
    process.on('SIGTERM', shutdown); // kill/PM2/Docker
  }
}