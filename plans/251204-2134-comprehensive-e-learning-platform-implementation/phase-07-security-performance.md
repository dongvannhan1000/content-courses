# Phase 07: Security & Performance

## Context Links
- [MVP Architecture Research](../research/researcher-01-mvp-architecture.md)
- [Cost-Effective Deployment Infrastructure](../research/researcher-251204-cost-effective-deployment-infrastructure.md)

## Overview
Implement critical security measures and performance optimizations to protect user data, ensure secure video streaming, prevent abuse, and achieve <2.5s load times while supporting 500-1000 concurrent users with cost-effective infrastructure.

## Key Insights
- Video token security with latest Node.js 22+ crypto essential to prevent content theft
- Rate limiting with @nestjs/throttler prevents API abuse and reduces costs
- CDN crucial for global performance and cost reduction with Cloudflare latest features
- Database optimization with PostgreSQL 16+ required for 1000+ concurrent users
- Mobile performance with React 19 and Next.js 15.1+ impacts user retention significantly
- Latest security patches protect against recent vulnerabilities in web frameworks

## Requirements
1. Secure video streaming with access tokens
2. API rate limiting and abuse prevention
3. Database query optimization and caching
4. CDN configuration for static assets
5. Mobile performance optimization
6. Security headers and CSP configuration
7. DDoS protection and monitoring
8. Performance monitoring and alerts

## Architecture

### Security Layers
1. **Network**: Cloudflare DDoS protection, WAF rules
2. **Application**: Rate limiting, input validation, CORS
3. **Data**: Encrypted storage, secure tokens, audit logs
4. **Content**: Video access tokens, watermarking, DRM

### Performance Stack
```
Performance Optimizations:
├── CDN Layer (Cloudflare)
│   ├── Static assets caching
│   ├── Video streaming optimization
│   └── Global edge distribution
├── Application Layer (Vercel Edge)
│   ├── Server-side rendering
│   ├── API response caching
│   └── Image optimization
├── Database Layer (Supabase)
│   ├── Query optimization
│   ├── Connection pooling
│   └── Read replicas
└── Cache Layer (Upstash Redis)
    ├── Session storage
    ├── API response cache
    └── Rate limiting
```

### Security Measures
```typescript
// Security Configuration
const securityConfig = {
  // Rate limiting
  rateLimits: {
    auth: { requests: 5, window: '15m' },
    api: { requests: 100, window: '1m' },
    upload: { requests: 10, window: '1m' },
    video: { requests: 20, window: '1m' }
  },

  // Video tokens
  videoToken: {
    expiry: '1h',
    refreshWindow: '5m',
    maxConcurrentStreams: 3
  },

  // Security headers
  headers: {
    'Strict-Transport-Security': 'max-age=31536000',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': 'default-src \'self\''
  }
}
```

## Related Code Files
- `middleware.ts` - Rate limiting and security middleware
- `lib/video-tokens.ts` - Video access token management
- `lib/redis.ts` - Redis caching configuration
- `lib/security.ts` - Security utilities
- `next.config.js` - Performance optimizations
- `vercel.json` - Edge function configuration

## Implementation Steps

### Step 1: Video Token Security
```typescript
// lib/video-tokens.ts
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

const VIDEO_TOKEN_SECRET = process.env.VIDEO_TOKEN_SECRET!

export interface VideoTokenPayload {
  userId: string
  lessonId: string
  courseId: string
  expiresAt: number
  sessionId: string
}

export async function generateVideoToken(
  userId: string,
  lessonId: string
): Promise<string> {
  // Verify user has access to course
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: await getCourseIdFromLesson(lessonId)
      }
    }
  })

  if (!enrollment || enrollment.status !== 'ACTIVE') {
    throw new Error('User not enrolled in course')
  }

  // Check concurrent streams
  const activeStreams = await getActiveVideoStreams(userId)
  if (activeStreams.length >= 3) {
    throw new Error('Maximum concurrent streams exceeded')
  }

  const payload: VideoTokenPayload = {
    userId,
    lessonId,
    courseId: enrollment.courseId,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    sessionId: crypto.randomUUID()
  }

  const token = jwt.sign(payload, VIDEO_TOKEN_SECRET, {
    algorithm: 'HS256'
  })

  // Store active session
  await storeVideoSession(payload)

  return token
}

export function verifyVideoToken(token: string): VideoTokenPayload {
  try {
    const decoded = jwt.verify(token, VIDEO_TOKEN_SECRET) as VideoTokenPayload

    if (Date.now() > decoded.expiresAt) {
      throw new Error('Token expired')
    }

    return decoded
  } catch (error) {
    throw new Error('Invalid video token')
  }
}

// Middleware for video streaming
export async function requireVideoToken(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new Error('No token provided')
  }

  const decoded = verifyVideoToken(token)

  // Verify session still active
  const session = await getVideoSession(decoded.sessionId)
  if (!session || session.revoked) {
    throw new Error('Session revoked')
  }

  return decoded
}
```

### Step 2: API Rate Limiting
```typescript
// middleware.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

interface RateLimitConfig {
  requests: number
  window: number // in seconds
}

const rateLimits: Record<string, RateLimitConfig> = {
  '/api/auth': { requests: 5, window: 900 }, // 5 requests per 15 min
  '/api/payments': { requests: 10, window: 60 }, // 10 requests per min
  '/api/upload': { requests: 5, window: 60 }, // 5 uploads per min
  '/api/video': { requests: 20, window: 60 }, // 20 video requests per min
  default: { requests: 100, window: 60 } // 100 requests per min
}

async function rateLimit(
  ip: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const config = rateLimits[endpoint] || rateLimits.default
  const key = `rate_limit:${endpoint}:${ip}`

  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, config.window)
  }

  return {
    allowed: current <= config.requests,
    remaining: Math.max(0, config.requests - current)
  }
}

export async function middleware(request: Request) {
  const ip = request.ip || 'unknown'
  const pathname = request.nextUrl.pathname

  // Find matching rate limit config
  const endpoint = Object.keys(rateLimits).find(ep => pathname.startsWith(ep)) || 'default'

  const { allowed, remaining } = await rateLimit(ip, endpoint)

  if (!allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': rateLimits[endpoint as string].requests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'Retry-After': rateLimits[endpoint as string].window.toString()
      }
    })
  }

  // Add security headers
  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-RateLimit-Remaining', remaining.toString())

  return response
}

export const config = {
  matcher: ['/api/:path*']
}
```

### Step 3: Database Optimization
```typescript
// lib/db-optimized.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

// Connection pooling for serverless
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Optimized queries
export const optimizedQueries = {
  // Dashboard with minimal fields
  getStudentDashboard: (userId: string) =>
    prisma.enrollment.findMany({
      where: { userId },
      select: {
        id: true,
        enrolledAt: true,
        completedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            instructor: {
              select: { name: true }
            }
          }
        },
        progress: {
          select: {
            completedLessons: true,
            totalLessons: true
          }
        }
      },
      orderBy: { enrolledAt: 'desc' },
      take: 10
    }),

  // Course listing with aggregation
  getCoursesList: (filters: any) =>
    prisma.course.findMany({
      where: filters,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        thumbnail: true,
        createdAt: true,
        instructor: {
          select: { id: true, name: true, image: true }
        },
        category: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            enrollments: true,
            sections: {
              select: {
                _count: { select: { lessons: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),

  // Pagination helpers
  paginate: <T>(query: any, page: number, take: number) => ({
    data: query,
    pagination: {
      page,
      take,
      total: query.length,
      pages: Math.ceil(query.length / take)
    }
  })
}
```

### Step 4: Caching Strategy
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const cache = {
  // Course data cache (5 minutes)
  async getCourse(courseId: string) {
    const cached = await redis.get(`course:${courseId}`)
    if (cached) return JSON.parse(cached)

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { name: true, image: true } },
        sections: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                duration: true,
                isPreview: true
              }
            },
            orderBy: { order: 'asc' }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    await redis.setex(`course:${courseId}`, 300, JSON.stringify(course))
    return course
  },

  // User session cache (15 minutes)
  async getUserSession(userId: string) {
    return await redis.get(`session:${userId}`)
  },

  // Video stream tracking (real-time)
  async trackVideoStream(sessionId: string, data: any) {
    await redis.setex(`stream:${sessionId}`, 3600, JSON.stringify(data))
  },

  // API response cache (1 minute)
  async cacheApiResponse(key: string, data: any, ttl = 60) {
    await redis.setex(`api:${key}`, ttl, JSON.stringify(data))
  },

  async getCachedApiResponse(key: string) {
    const cached = await redis.get(`api:${key}`)
    return cached ? JSON.parse(cached) : null
  },

  // Invalidate patterns
  async invalidate(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}
```

### Step 5: CDN and Asset Optimization
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    domains: ['cdn.mux.com', 'res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // Compression
  compress: true,

  // Headers for caching
  async headers() {
    return [
      {
        source: '/api/video/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store' }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' }
        ]
      }
    ]
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/courses/:id',
        destination: '/courses/:id/overview',
        permanent: true
      }
    ]
  },

  // Bundle analysis
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
          video: {
            test: /[\\/]node_modules[\\/](video\.js|@mux)[\\/]/,
            name: 'video',
            chunks: 'all'
          }
        }
      }
    }
    return config
  }
}

module.exports = nextConfig
```

### Step 6: Mobile Performance Optimization
```typescript
// components/optimized/video-player-mobile.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useDeviceDetection } from '@/hooks/use-device-detection'

export function OptimizedVideoPlayer({
  lessonId,
  videoUrl,
  poster
}: VideoPlayerProps) {
  const { isMobile, isSlowConnection } = useDeviceDetection()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [quality, setQuality] = useState('auto')

  useEffect(() => {
    // Auto-adjust quality based on device and connection
    if (isMobile) {
      setQuality(isSlowConnection ? '360p' : '720p')
    }

    // Lazy load video
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.load()
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (videoRef.current) {
      observer.observe(videoRef.current)
    }

    return () => observer.disconnect()
  }, [isMobile, isSlowConnection])

  return (
    <div className="relative w-full bg-black">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        poster={poster}
        controls
        playsInline
        muted
        preload="none"
        posterLoad="lazy"
      >
        {quality === 'auto' ? (
          <>
            <source src={`${videoUrl}?quality=1080p`} type="video/mp4" />
            <source src={`${videoUrl}?quality=720p`} type="video/mp4" />
            <source src={`${videoUrl}?quality=480p`} type="video/mp4" />
          </>
        ) : (
          <source src={`${videoUrl}?quality=${quality}`} type="video/mp4" />
        )}
      </video>
    </div>
  )
}
```

### Step 7: Security Headers and CSP
```typescript
// lib/security-headers.ts
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.mux.com https://api.payos.vn",
    "media-src 'self' https://cdn.mux.com https://stream.mux.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),

  // Other security headers
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}

// Apply to API responses
export function addSecurityHeaders(response: Response) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}
```

### Step 8: Performance Monitoring
```typescript
// lib/performance-monitoring.ts
import { Analytics } from '@vercel/analytics/react'

// Core Web Vitals tracking
export function reportWebVitals({
  id,
  name,
  label,
  value
}: {
  id: string
  name: string
  label: string
  value: number
}) {
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', name, {
      event_category:
        label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true
    })
  }

  // Alert on poor performance
  if (name === 'LCP' && value > 2500) {
    console.warn(`Slow LCP detected: ${value}ms`)
  }
  if (name === 'FID' && value > 100) {
    console.warn(`Slow FID detected: ${value}ms`)
  }
  if (name === 'CLS' && value > 0.1) {
    console.warn(`High CLS detected: ${value}`)
  }
}

// Performance budget monitoring
export const performanceBudget = {
  javascript: 244, // KB
  css: 100, // KB
  images: 1000, // KB
  total: 1500 // KB
}

// Bundle analyzer integration
export async function analyzeBundle() {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true'
  })

  return withBundleAnalyzer
}
```

### Step 9: Error Handling and Recovery
```typescript
// app/api/error-handler.ts
export function handleAPIError(error: unknown) {
  console.error('API Error:', error)

  // Don't expose sensitive errors
  if (error instanceof Error) {
    if (error.message.includes('prisma')) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (error.message.includes('jwt')) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

// Retry mechanism for failed requests
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) throw error

    await new Promise(resolve => setTimeout(resolve, delay))
    return withRetry(fn, retries - 1, delay * 2)
  }
}
```

### Step 10: DDoS Protection Setup
```typescript
// Cloudflare Workers script for DDoS protection
export const ddosProtectionRules = {
  // Rate limiting per IP
  ipRateLimit: {
    threshold: 1000, // requests per minute
    window: 60,
    action: 'challenge'
  },

  // Bot detection
  botProtection: {
    enabled: true,
    challengeBots: true,
    allowGoodBots: true
  },

  // Traffic pattern analysis
  anomalyDetection: {
    enabled: true,
    sensitivity: 'medium',
    action: 'js_challenge'
  }
}

// Server-side rate limiting for critical endpoints
export const criticalRateLimits = {
  '/api/auth/login': { requests: 5, window: 900 },
  '/api/payments/create-order': { requests: 10, window: 300 },
  '/api/video/stream': { requests: 50, window: 60 }
}
```

## Todo List
- [ ] Implement video token security system
- [ ] Set up API rate limiting with Redis
- [ ] Optimize database queries and indexing
- [ ] Configure Redis caching layer
- [ ] Set up CDN for static assets
- [ ] Implement security headers and CSP
- [ ] Optimize images and video streaming
- [ ] Set up performance monitoring
- [ ] Implement DDoS protection
- [ ] Create mobile optimizations
- [ ] Add error handling and retry logic
- [ ] Set up automated security scanning
- [ ] Implement backup encryption
- [ ] Create performance alerts
- [ ] Set up log aggregation
- [ ] Configure uptime monitoring

## Success Criteria
1. ✅ All video streams secured with tokens
2. ✅ API endpoints rate limited
3. ✅ Page load times <2.5 seconds
4. ✅ Mobile performance optimized
5. ✅ Security headers implemented
6. ✅ Database queries optimized (<100ms)

## Risk Assessment

**Low Risk**:
- Basic caching implementation
- Security headers configuration
- Performance monitoring setup

**Medium Risk**:
- Video token complexity
- Cache invalidation strategy
- Database optimization

**High Risk**:
- **DDoS Attack Impact**: Overwhelming platform resources and Bunny Stream costs
- **Cache Key Collision**: Redis cache failures causing performance degradation
- **Performance Regression**: Node.js 22+ or React 19 compatibility issues
- **Video Token Security**: Bunny Stream token bypass or manipulation
- **Rate Limiting Failures**: @nestjs/throttler bypass or abuse
- **Memory Leaks**: Long-running processes causing system instability

**Mitigation**:
- Test token system thoroughly
- Use versioned cache keys
- Monitor performance metrics
- Have rollback plans ready
- Regular load testing

## Security Considerations
1. Token encryption and rotation
2. IP-based blocking for abuse
3. Input sanitization everywhere
4. SQL injection prevention
5. XSS protection with CSP
6. Secure file uploads
7. Session fixation prevention
8. Regular security audits

## Next Steps
1. Perform load testing with 1000+ users
2. Set up production monitoring
3. Create security audit checklist
4. Begin Phase 08: Testing & Deployment
5. Document security procedures
6. Set up automated security scans