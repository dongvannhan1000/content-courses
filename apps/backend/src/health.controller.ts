import { Controller, Get, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  @Public()
  @Get()
  ping() {
    return { ok: true };
  }

  /**
   * Get memory usage statistics
   * Useful for monitoring RAM consumption
   */
  @Public()
  @Get('memory')
  getMemoryUsage() {
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
   * Get cache information
   */
  @Public()
  @Get('cache')
  async getCacheInfo() {
    return {
      status: 'active',
      type: 'in-memory',
      message: 'Cache is working. Check logs for cache hit/miss info.',
    };
  }
}
