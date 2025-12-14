import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

let prisma: PrismaClient;

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
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
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
      prisma = null as any;
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
   * Start database transaction for test isolation
   */
  static async startTransaction(): Promise<any> {
    return this.getClient().$transaction();
  }

  /**
   * Create test database if it doesn't exist
   */
  static async ensureTestDatabase(): Promise<void> {
    // For PostgreSQL test database, ensure it exists
    const adminClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL?.replace('/nghe_content_test', '/postgres'),
        },
      },
    });

    try {
      await adminClient.$executeRaw`CREATE DATABASE nghe_content_test`;
    } catch (error) {
      // Database might already exist, which is fine
      console.log('Test database already exists or creation failed:', error);
    } finally {
      await adminClient.$disconnect();
    }
  }
}

// Global test setup and teardown
beforeAll(async () => {
  // Ensure we're in test environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must run in NODE_ENV=test');
  }

  // Wait for database to be ready
  let retries = 10;
  while (retries > 0 && !(await DatabaseHelper.isConnectionReady())) {
    console.log(`Waiting for database... ${retries} retries left`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    retries--;
  }

  if (!(await DatabaseHelper.isConnectionReady())) {
    throw new Error('Database connection failed after retries');
  }

  // Run migrations
  await DatabaseHelper.runMigrations();
});

afterAll(async () => {
  await DatabaseHelper.closeConnection();
});

// Test isolation with transactions
let transaction: any;

beforeEach(async () => {
  // Start transaction for test isolation
  const client = DatabaseHelper.getClient();
  transaction = await client.$begin();
});

afterEach(async () => {
  // Rollback transaction to ensure test isolation
  if (transaction) {
    await transaction.rollback();
  }
});