import 'reflect-metadata';

// Set test environment
process.env.NODE_ENV = 'test';

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testHelpers = {
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  async waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.sleep(interval);
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  generateRandomString(length: number = 10): string {
    return Math.random().toString(36).substring(2, length + 2);
  },

  generateRandomNumber(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  generateRandomEmail(): string {
    return `test-${this.generateRandomString(8)}@example.com`;
  },

  generateRandomPhone(): string {
    return `+84${this.generateRandomNumber(9)}`;
  },
};

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Setup test database connection before all tests
beforeAll(async () => {
  // Ensure test environment is set
  expect(process.env.NODE_ENV).toBe('test');

  // Wait a bit for any async operations to complete
  await global.testHelpers.sleep(100);
});

// Cleanup after all tests
afterAll(async () => {
  // Wait for any pending async operations
  await global.testHelpers.sleep(100);

  // Clear all mocks
  jest.clearAllMocks();

  // Reset modules to avoid memory leaks
  jest.resetModules();
});

// Cleanup after each test
afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});

// Extend Jest matchers for custom assertions
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeValidUrl(received: string) {
    try {
      new URL(received);
      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true,
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  },

  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min}-${max}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${min}-${max}`,
        pass: false,
      };
    }
  },

  toBeValidFirebaseUid(received: string) {
    // Firebase UIDs are alphanumeric strings with a maximum length of 128 characters
    const uidRegex = /^[a-zA-Z0-9]{1,128}$/;
    const pass = uidRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid Firebase UID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Firebase UID`,
        pass: false,
      };
    }
  },

  toBeValidSlug(received: string) {
    // Slugs should be lowercase, contain only letters, numbers, and hyphens
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const pass = slugRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid slug`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid slug`,
        pass: false,
      };
    }
  },
});

// Export types for global use
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toBeValidUrl(): R;
      toBeWithinRange(min: number, max: number): R;
      toBeValidFirebaseUid(): R;
      toBeValidSlug(): R;
    }
  }

  var testHelpers: {
    sleep(ms: number): Promise<void>;
    waitForCondition(
      condition: () => Promise<boolean>,
      timeout?: number,
      interval?: number
    ): Promise<void>;
    generateRandomString(length?: number): string;
    generateRandomNumber(min?: number, max?: number): number;
    generateRandomEmail(): string;
    generateRandomPhone(): string;
  };
}