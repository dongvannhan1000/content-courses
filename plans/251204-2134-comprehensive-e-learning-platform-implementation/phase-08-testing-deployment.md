# Phase 08: Testing & Deployment

## Context Links
- [All Previous Phases](../research/)
- [Cost-Effective Deployment Infrastructure](../research/researcher-251204-cost-effective-deployment-infrastructure.md)

## Overview
Execute comprehensive testing strategy and production deployment for the e-learning platform MVP, ensuring quality, reliability, and performance for 500-1000 concurrent users with cost-effective infrastructure and monitoring.

## Key Insights
- Automated testing with latest Jest/Vitest versions essential for solo developer efficiency
- Load testing with modern tools critical before production launch
- Staging environment mirrors production for validation with latest Node.js 22+
- Monitoring setup with latest Sentry and custom logging crucial for early issue detection
- Rollback plan mandatory for deployment safety with GitOps practices
- CI/CD pipeline with Dependabot security scanning ensures latest vulnerability protection
- Latest framework versions (React 19, Next.js 15.1+, NestJS 11.0+) require updated testing strategies

## Requirements
1. Comprehensive test suite (unit, integration, E2E)
2. Load testing for 1000 concurrent users
3. Staging environment for validation
4. Production deployment with zero downtime
5. Monitoring and alerting setup
6. Backup and recovery procedures
7. Performance optimization validation
8. Security audit completion

## Architecture

### Testing Strategy
```
Testing Pyramid:
├── E2E Tests (10%)
│   ├── Critical user journeys
│   ├── Payment flows
│   └── Cross-browser testing
├── Integration Tests (20%)
│   ├── API endpoints
│   ├── Database operations
│   └── Third-party integrations
└── Unit Tests (70%)
    ├── Utility functions
    ├── Component logic
    └── Business rules
```

### Deployment Pipeline
1. **Development** → Git push → Automated tests → Build
2. **Staging** → Manual deployment → Full test suite → Performance testing
3. **Production** → Blue-green deployment → Smoke tests → Monitor

### Production Infrastructure
```
Infrastructure Stack:
├── Frontend (Vercel Pro)
│   ├── Edge functions
│   ├── Global CDN
│   └── Analytics
├── Backend (Railway/Supabase)
│   ├── API server
│   ├── Database (PostgreSQL)
│   └── Redis cache
├── Services
│   ├── Mux (video streaming)
│   ├── Cloudinary (images)
│   └── PayOS (payments)
└── Monitoring
    ├── Sentry (errors)
    ├── Vercel Analytics
    └── Custom dashboards
```

## Related Code Files
- `jest.config.js` - Unit test configuration
- `cypress.config.ts` - E2E test setup
- `k6-config.js` - Load testing scenarios
- `.github/workflows/deploy.yml` - CI/CD pipeline
- `scripts/deploy.sh` - Deployment script
- `monitoring/docker-compose.yml` - Local monitoring stack

## Implementation Steps

### Step 1: Unit Testing Setup
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Step 2: Critical Component Tests
```typescript
// __tests__/components/video-player.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoPlayer } from '@/components/ui/video-player'

describe('VideoPlayer', () => {
  const mockProps = {
    lessonId: 'lesson-1',
    videoUrl: 'https://example.com/video.mp4',
    poster: 'https://example.com/poster.jpg',
    onProgress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders video element with correct props', () => {
    render(<VideoPlayer {...mockProps} />)

    const video = screen.getByTestId('video-player')
    expect(video).toHaveAttribute('src', mockProps.videoUrl)
    expect(video).toHaveAttribute('poster', mockProps.poster)
  })

  it('handles quality change', () => {
    render(<VideoPlayer {...mockProps} />)

    const qualityButton = screen.getByText('Quality')
    fireEvent.click(qualityButton)

    const qualityOption = screen.getByText('720p')
    fireEvent.click(qualityOption)

    expect(screen.getByText('720p')).toBeInTheDocument()
  })

  it('saves progress periodically', async () => {
    jest.useFakeTimers()
    render(<VideoPlayer {...mockProps} />)

    const video = screen.getByTestId('video-player')
    fireEvent.timeUpdate(video, { target: { currentTime: 30 } })

    // Fast-forward 5 seconds
    jest.advanceTimersByTime(5000)

    expect(mockProps.onProgress).toHaveBeenCalledWith(
      expect.closeTo(10, 1) // 30s out of 300s ≈ 10%
    )

    jest.useRealTimers()
  })
})
```

### Step 3: API Integration Tests
```typescript
// __tests__/api/courses.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/courses/route'

describe('/api/courses', () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })

  it('creates a new course successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer valid-instructor-token'
      },
      body: {
        title: 'Test Course',
        description: 'A test course for testing',
        price: 99.99,
        categoryId: 'category-1'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.title).toBe('Test Course')
    expect(data.status).toBe('DRAFT')
  })

  it('validates required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer valid-instructor-token'
      },
      body: {
        title: '',
        description: 'Missing title'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('title is required')
  })

  it('handles unauthorized access', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { title: 'Test Course' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
  })
})
```

### Step 4: E2E Testing with Cypress
```typescript
// cypress/e2e/course-enrollment.cy.ts
describe('Course Enrollment Flow', () => {
  beforeEach(() => {
    cy.login('student@example.com', 'password')
  })

  it('enrolls in a free course successfully', () => {
    cy.visit('/courses')

    // Find and click on a free course
    cy.contains('[data-testid="course-card"]', 'Free')
      .first()
      .within(() => {
        cy.get('[data-testid="enroll-button"]').click()
      })

    // Should redirect to course page
    cy.url().should('match', /\/courses\/[^\/]+$/)

    // Verify enrolled
    cy.get('[data-testid="enrollment-status"]').should('contain', 'Enrolled')

    // Start learning
    cy.get('[data-testid="start-learning"]').click()
    cy.url().should('match', /\/learn$/)
  })

  it('completes payment for paid course', () => {
    cy.visit('/courses')

    // Find paid course
    cy.contains('[data-testid="course-card"]', '$')
      .first()
      .within(() => {
        cy.get('[data-testid="course-title"]').click()
      })

    // Click enroll button
    cy.get('[data-testid="enroll-button"]').click()

    // Payment modal should appear
    cy.get('[data-testid="payment-modal"]').should('be.visible')

    // Select PayOS payment
    cy.get('[data-testid="payment-method-payos"]').click()
    cy.get('[data-testid="confirm-payment"]').click()

    // Should redirect to PayOS
    cy.url().should('include', 'payos.vn')
  })

  it('tracks video progress', () => {
    // Enroll in course first
    cy.enrollInCourse('course-1')
    cy.visit('/courses/course-1/learn')

    // Play video
    cy.get('[data-testid="video-player"]')
      .trigger('timeupdate', { currentTime: 30 })

    // Check progress saved
    cy.wait(5000) // Wait for progress save
    cy.reload()

    cy.get('[data-testid="progress-bar"]')
      .should('have.attr', 'data-progress')
      .and('match', /\d+/)
  })
})
```

### Step 5: Load Testing with k6
```javascript
// k6-config.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 500 }, // Ramp up to 500 users
    { duration: '5m', target: 500 }, // Stay at 500 users
    { duration: '2m', target: 1000 }, // Ramp up to 1000 users
    { duration: '5m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.1'],    // Error rate < 10%
    errors: ['rate<0.1'],
  },
}

const BASE_URL = 'https://your-staging-url.com'

export function setup() {
  // Create test users
  for (let i = 0; i < 1000; i++) {
    http.post(`${BASE_URL}/api/auth/register`, {
      email: `user${i}@test.com`,
      password: 'testpassword123',
      name: `Test User ${i}`
    })
  }
}

export default function() {
  // Browse courses
  let response = http.get(`${BASE_URL}/courses`)
  let success = check(response, {
    'courses page status is 200': (r) => r.status === 200,
    'courses page response time < 500ms': (r) => r.timings.duration < 500,
  })
  errorRate.add(!success)

  // View course details
  response = http.get(`${BASE_URL}/courses/course-1`)
  success = check(response, {
    'course page status is 200': (r) => r.status === 200,
    'course page contains title': (r) => r.body.includes('Course Title'),
  })
  errorRate.add(!success)

  // Stream video (authenticated)
  const token = getAuthToken()
  response = http.get(`${BASE_URL}/api/video/stream/lesson-1`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  success = check(response, {
    'video stream status is 200': (r) => r.status === 200,
    'video stream returns m3u8': (r) => r.headers['Content-Type'] === 'application/vnd.apple.mpegurl',
  })
  errorRate.add(!success)

  sleep(1)
}

function getAuthToken() {
  const response = http.post(`${BASE_URL}/api/auth/login`, {
    email: `user${Math.floor(Math.random() * 1000)}@test.com`,
    password: 'testpassword123'
  })
  return response.json('token')
}
```

### Step 6: CI/CD Pipeline Setup
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start staging app
        run: npm run build && npm run start &
        env:
          NEXT_PUBLIC_APP_URL: http://localhost:3000
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      - name: Wait for app
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CYPRESS_baseUrl: http://localhost:3000

  deploy-staging:
    needs: [test, e2e-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--env Environment=staging'

  deploy-production:
    needs: [test, e2e-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Step 7: Production Deployment Script
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Starting deployment process..."

# Check if we're on main branch
if [ "$(git branch --show-current)" != "main" ]; then
  echo "❌ Must be on main branch to deploy to production"
  exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Build application
echo "🔨 Building application..."
npm run build

# Database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

# Health check
echo "❤️ Running health check..."
sleep 30
curl -f https://your-domain.com/api/health || exit 1

# Notify team
echo "📧 Sending notification..."
curl -X POST "https://api.slack.com/..." \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -H 'Content-type: application/json' \
  --data "{\"text\":\"✅ Production deployment successful!\"}"

echo "✅ Deployment completed successfully!"
```

### Step 8: Monitoring Setup
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
})

// Custom metrics
export const metrics = {
  // Video streaming metrics
  videoStreamStart: () => {
    window.gtag('event', 'video_stream_start', {
      event_category: 'video',
      custom_parameter_1: location.pathname
    })
  },

  videoStreamError: (error: string) => {
    Sentry.captureException(new Error(`Video Stream Error: ${error}`))
    window.gtag('event', 'video_stream_error', {
      event_category: 'video',
      event_label: error
    })
  },

  // Payment metrics
  paymentInitiated: (amount: number, method: string) => {
    window.gtag('event', 'payment_initiated', {
      event_category: 'ecommerce',
      value: amount,
      custom_parameter_1: method
    })
  },

  paymentCompleted: (amount: number, method: string) => {
    window.gtag('event', 'purchase', {
      transaction_id: generateTransactionId(),
      value: amount,
      currency: 'VND',
      payment_method: method
    })
  },

  // Performance metrics
  pageLoadTime: (time: number) => {
    window.gtag('event', 'page_load_time', {
      event_category: 'performance',
      value: Math.round(time)
    })
  }
}

// Health check endpoint
export async function healthCheck() {
  const checks = await Promise.allSettled([
    // Database connectivity
    prisma.$queryRaw`SELECT 1`,
    // Redis connectivity
    redis.ping(),
    // External services
    fetch('https://api.mux.com/health'),
  ])

  const allHealthy = checks.every(check => check.status === 'fulfilled')

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status,
      cache: checks[1].status,
      videoService: checks[2].status
    }
  }
}
```

### Step 9: Backup and Recovery
```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups/e-learning"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
echo "📦 Creating database backup..."
pg_dump $DATABASE_URL > "$BACKUP_DIR/db_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/db_$DATE.sql"

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR/db_$DATE.sql.gz" "s3://your-backup-bucket/database/"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed: db_$DATE.sql.gz"
```

### Step 10: Production Checklist
```typescript
// scripts/production-checklist.ts
export const productionChecklist = {
  // Performance
  performance: [
    '✅ Page load time < 2.5 seconds',
    '✅ First Contentful Paint < 1.5 seconds',
    '✅ Largest Contentful Paint < 2.5 seconds',
    '✅ Cumulative Layout Shift < 0.1',
    '✅ First Input Delay < 100ms'
  ],

  // Security
  security: [
    '✅ HTTPS enforced',
    '✅ Security headers configured',
    '✅ CSP policies active',
    '✅ Rate limiting enabled',
    '✅ Video tokens implemented',
    '✅ Input validation active',
    '✅ Secrets are secure'
  ],

  // Functionality
  functionality: [
    '✅ User registration/login',
    '✅ Course enrollment',
    '✅ Video streaming',
    '✅ Payment processing',
    '✅ Progress tracking',
    '✅ Email notifications',
    '✅ Admin dashboard'
  ],

  // Monitoring
  monitoring: [
    '✅ Error tracking (Sentry)',
    '✅ Performance monitoring',
    '✅ Uptime monitoring',
    '✅ Database metrics',
    '✅ Cost alerts',
    '✅ Backup automation'
  ]
}
```

## Todo List
- [ ] Set up unit testing framework (Jest)
- [ ] Write critical component tests
- [ ] Create API integration tests
- [ ] Build E2E test suite (Cypress)
- [ ] Configure load testing (k6)
- [ ] Set up CI/CD pipeline
- [ ] Create staging environment
- [ ] Implement monitoring (Sentry)
- [ ] Set up backup automation
- [ ] Create deployment scripts
- [ ] Run performance tests
- [ ] Complete security audit
- [ ] Verify all integrations
- [ ] Test rollback procedures
- [ ] Create troubleshooting guide
- [ ] Document production setup

## Success Criteria
1. ✅ All tests passing (80%+ coverage)
2. ✅ Load test passes for 1000 CCUs
3. ✅ Production deployed without issues
4. ✅ Monitoring and alerts active
5. ✅ Performance benchmarks met
6. ✅ Security audit passed

## Risk Assessment

**Low Risk**:
- Unit test implementation
- CI/CD setup
- Monitoring configuration

**Medium Risk**:
- Load testing accuracy
- Production deployment issues
- Performance regressions

**High Risk**:
- **Data Loss During Migration**: PostgreSQL 16+ schema changes or data corruption
- **Payment Integration Failures**: PayOS webhook issues or transaction failures
- **Deployment Security Vulnerabilities**: Exposed environment variables or misconfigurations
- **Version Compatibility Issues**: Node.js 22+ or React 19 deployment problems
- **Zero-Downtime Deployment Failures**: Service interruptions during updates
- **CI/CD Security Breaches**: Compromised deployment pipelines or secrets

**Mitigation**:
- Full database backups
- Staging environment validation
- Gradual traffic ramp-up
- Rollback procedures tested
- 24/7 monitoring first week

## Security Considerations
1. All secrets in production
2. HTTPS enforcement
3. Database access restricted
4. API authentication
5. Rate limiting active
6. Error tracking without sensitive data
7. Regular security scans
8. Dependency vulnerability checks

## Next Steps
1. Execute final production deployment
2. Monitor first 24 hours closely
3. Collect user feedback
4. Plan Phase 2 features
5. Scale infrastructure as needed
6. Document lessons learned