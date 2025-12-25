/**
 * Environment Configuration
 * 
 * Centralized environment detection and feature flags.
 * Usage: import { ENV } from './config/environment.config';
 */

export type Environment = 'development' | 'production' | 'test';

/**
 * Get current environment
 * Defaults to 'development' if NODE_ENV is not set
 */
export const getEnvironment = (): Environment => {
    const env = process.env.NODE_ENV;
    if (env === 'production') return 'production';
    if (env === 'test') return 'test';
    return 'development';
};

/**
 * Environment flags and configuration
 */
export const ENV = {
    // Current environment
    current: getEnvironment(),

    // Environment checks
    isDevelopment: getEnvironment() === 'development',
    isProduction: getEnvironment() === 'production',
    isTest: getEnvironment() === 'test',

    // Feature flags based on environment
    features: {
        /** Enable Swagger API documentation */
        enableSwagger: getEnvironment() !== 'production',

        /** Enable verbose Prisma query logging */
        verboseLogging: getEnvironment() === 'development',

        /** Show full error stack traces in responses */
        exposeErrorDetails: getEnvironment() === 'development',

        /** Show detailed health check info */
        detailedHealthChecks: getEnvironment() === 'development',

        /** Auto-enable PayOS mock mode in development */
        autoMockPayOS: getEnvironment() === 'development',
    },

    // Rate limits: relaxed for dev, optimized for prod (supports ~2000 concurrent users)
    rateLimits: getEnvironment() === 'development'
        ? { short: 100, medium: 500, long: 1000 }  // Very relaxed for dev/testing
        : { short: 30, medium: 100, long: 300 },   // Production: balanced security + capacity

    // Prisma log levels
    prismaLogLevels: getEnvironment() === 'development'
        ? ['query', 'error', 'warn'] as const
        : ['error'] as const,
};
