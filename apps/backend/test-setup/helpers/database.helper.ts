import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { execSync } from 'child_process';

let prisma: PrismaClient | null = null;
let pool: Pool | null = null;

/**
 * Database helper for testing environment
 * Provides utilities for database setup, teardown, and transaction management
 */
export class DatabaseHelper {
  /**
   * Get Prisma client instance
   */
  static getClient(): PrismaClient {
    if (!prisma) {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaPg(pool);

      prisma = new PrismaClient({
        adapter: adapter,
        log: process.env.NODE_ENV === 'test' ? [] : ['query', 'info', 'warn', 'error'],
      });
    }
    return prisma;
  }

  /**
   * Reset database to clean state
   * WARNING: Only use in test environment
   */
  static async resetDatabase(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This function can only be used in test environment');
    }

    const client = this.getClient();

    // Disable foreign key constraints temporarily
    await client.$executeRaw`SET session_replication_role = replica;`;

    // Truncate all tables in correct order
    await client.$executeRaw`TRUNCATE TABLE
      "progress", "reviews", "media", "enrollments", "lessons",
      "payments", "courses", "users", "categories" RESTART IDENTITY CASCADE`;

    // Re-enable foreign key constraints
    await client.$executeRaw`SET session_replication_role = DEFAULT;`;
  }

  /**
   * Close database connection
   */
  static async closeConnection(): Promise<void> {
    if (prisma) {
      await prisma.$disconnect();
      prisma = null;
    }
    if (pool) {
      await pool.end();
      pool = null;
    }
  }

  /**
   * Run database migrations
   */
  static async runMigrations(): Promise<void> {
    try {
      execSync('npx prisma migrate deploy --skip-generate', {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
        stdio: 'pipe',
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Check if database is connected and ready
   */
  static async isConnectionReady(): Promise<boolean> {
    try {
      await this.getClient().$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute database operation in a transaction
   * Use this for test isolation
   */
  static async executeInTransaction<T>(
    callback: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    const client = this.getClient();
    return await client.$transaction(async (tx) => {
      return await callback(tx as unknown as PrismaClient);
    });
  }

  /**
   * Create test database if it doesn't exist
   * Note: This requires running PostgreSQL locally with proper permissions
   */
  static async ensureTestDatabase(): Promise<void> {
    // In Prisma v7, we skip programmatic database creation
    // The test database should be set up manually or via docker-compose
    // Just verify connection is working
    try {
      await this.getClient().$queryRaw`SELECT 1`;
      console.log('Test database connection successful');
    } catch (error) {
      console.error('Test database connection failed:', error);
      throw new Error('Test database is not available. Please ensure PostgreSQL is running and the database exists.');
    }
  }

  /**
   * Clean up test data after each test
   * More efficient than truncating all tables
   */
  static async cleanupTestData(): Promise<void> {
    const client = this.getClient();

    // Delete in reverse order of dependencies (child tables first)
    await client.progress.deleteMany({});
    await client.review.deleteMany({});
    await client.media.deleteMany({});
    await client.payment.deleteMany({}); // Must delete before enrollment (FK)
    await client.enrollment.deleteMany({});
    await client.lesson.deleteMany({});
    await client.cartItem.deleteMany({}); // Must delete before course (FK)
    await client.course.deleteMany({});
    await client.user.deleteMany({});
    await client.category.deleteMany({});
  }

  /**
   * Seed minimal test data
   */
  static async seedMinimalTestData(): Promise<{
    adminUser: any;
    testCategory: any;
  }> {
    const client = this.getClient();

    const adminUser = await client.user.create({
      data: {
        firebaseUid: 'test-admin-uid',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        emailVerified: true,
      },
    });

    const testCategory = await client.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'A category for testing',
        isActive: true,
        order: 1,
      },
    });

    return { adminUser, testCategory };
  }
}