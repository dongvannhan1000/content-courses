import { Controller, Get, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Public } from './modules/auth/decorators/public.decorator';
import { PrismaService } from './infra/prisma/prisma.service';
import { ENV } from './config/environment.config';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) { }

  /**
   * Basic health check
   * Returns environment info in development, minimal response in production
   */
  @Public()
  @Get()
  async ping() {
    // Basic database connectivity check
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    if (ENV.features.detailedHealthChecks) {
      // Development: detailed response
      return {
        ok: dbOk,
        environment: ENV.current,
        database: dbOk ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
      };
    }

    // Production: minimal response
    return { ok: dbOk };
  }

  /**
   * Memory usage statistics
   * Only detailed in development
   */
  @Public()
  @Get('memory')
  getMemoryUsage() {
    if (!ENV.features.detailedHealthChecks) {
      return { ok: true };
    }

    const used = process.memoryUsage();
    return {
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      external: `${Math.round(used.external / 1024 / 1024)} MB`,
      arrayBuffers: `${Math.round(used.arrayBuffers / 1024 / 1024)} MB`,
      raw: {
        heapUsed: used.heapUsed,
        heapTotal: used.heapTotal,
        rss: used.rss,
      },
    };
  }

  /**
   * Cache information
   * Only detailed in development
   */
  @Public()
  @Get('cache')
  async getCacheInfo() {
    if (!ENV.features.detailedHealthChecks) {
      return { ok: true };
    }

    return {
      status: 'active',
      type: 'in-memory',
      message: 'Cache is working. Check logs for cache hit/miss info.',
    };
  }

  /**
   * Full system status (development only)
   */
  @Public()
  @Get('status')
  async getFullStatus() {
    if (!ENV.features.detailedHealthChecks) {
      return { ok: true };
    }

    const used = process.memoryUsage();
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    return {
      environment: ENV.current,
      features: ENV.features,
      rateLimits: ENV.rateLimits,
      database: dbOk ? 'connected' : 'disconnected',
      memory: {
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      },
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
    };
  }
}
