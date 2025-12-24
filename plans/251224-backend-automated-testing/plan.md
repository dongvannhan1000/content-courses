# Backend Automated Testing Implementation Plan

**Project**: Nghe Content E-Learning Platform
**Date**: 2025-12-24
**Status**: Draft
**Priority**: High

---

## Executive Summary

This plan implements comprehensive automated testing for a NestJS e-learning backend. The codebase has **strong existing infrastructure** (factories, mocks, helpers, Jest config) but **minimal actual tests** (only 2 basic spec files).

**Key Insight**: Foundation is solid. Focus on writing actual tests using existing infrastructure.

---

## Existing Infrastructure Audit

### What Already Exists (Don't Rebuild)

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| Jest Config | `jest.config.js` | ✅ Complete | 80% coverage thresholds, reporters configured |
| Test Setup | `test-setup/jest.setup.ts` | ✅ Complete | Global helpers, custom matchers, test environment |
| DB Helper | `test-setup/helpers/database.helper.ts` | ✅ Complete | Reset, cleanup, migrations, transactions |
| Auth Helper | `test-setup/helpers/auth.helper.ts` | ✅ Complete | Token generation, test users, headers |
| Firebase Mock | `test-setup/mocks/firebase.mock.ts` | ✅ Complete | Full Firebase Admin SDK mock |
| PayOS Mock | `test-setup/mocks/payos.mock.ts` | ✅ Complete | Payment gateway mock + test scenarios |
| Base Factory | `test-setup/factories/base.factory.ts` | ✅ Complete | Abstract factory with CRUD methods |
| User Factory | `test-setup/factories/user.factory.ts` | ✅ Complete | User test data generation |
| Course Factory | `test-setup/factories/course.factory.ts` | ✅ Complete | Course test data generation |
| Category Factory | `test-setup/factories/category.factory.ts` | ✅ Complete | Category test data generation |
| Payment Factory | `test-setup/factories/payment.factory.ts` | ✅ Complete | Payment test data generation |
| Docker Test DB | `test-setup/docker-compose.test.yml` | ✅ Complete | PostgreSQL test container |
| NPM Scripts | `package.json` | ✅ Complete | test:unit, test:integration, test:e2e, test:ci |
| Performance Test | `test-setup/tests/performance/load-test.yml` | ✅ Complete | Artillery load test config |

### Test Structure Folders

| Folder | Location | Current State | Action Needed |
|--------|----------|---------------|---------------|
| Unit | `test-setup/tests/unit/` | Empty (placeholder) | Fill with unit tests |
| Integration | `test-setup/tests/integration/` | Empty (placeholder) | Fill with integration tests |
| E2E | `test/` (root) | Not configured | Create e2e test structure |

### Module Analysis

| Module | Service Complexity | Controller Endpoints | Priority | Risk |
|--------|-------------------|---------------------|----------|------|
| auth | Medium (8 methods) | 8 endpoints | P0 | High (security) |
| payments | High (PayOS integration) | 8 endpoints | P0 | High (financial) |
| enrollments | Medium (business logic) | 6 endpoints | P1 | Medium |
| courses | Medium (CRUD + filtering) | 8 endpoints | P1 | Medium |
| users | Low (CRUD) | 4 endpoints | P2 | Low |
| categories | Low (CRUD) | 5 endpoints | P2 | Low |
| lessons | Low (CRUD) | 5 endpoints | P2 | Low |
| cart | Low (CRUD) | 4 endpoints | P3 | Low |
| progress | Medium (tracking logic) | 3 endpoints | P3 | Low |
| media | Low (CRUD) | 3 endpoints | P3 | Low |

---

## Phase 1: Foundation & CI/CD (Week 1)

### 1.1 Verify & Complete Test Infrastructure

**Tasks**:
1. Create `.env.test` file (if not exists)
2. Verify test database connectivity with Docker
3. Run test suite to confirm infrastructure works
4. Document test execution in README

**Success Criteria**:
- `npm run test:db:setup` starts test DB successfully
- `npm run test` runs without errors (even with 0 tests passing)
- Test cleanup runs after execution

**Commands to verify**:
```bash
docker-compose -f test-setup/docker-compose.test.yml up -d
npm run test:db:migrate
npm run test:watch
```

### 1.2 GitHub Actions CI/CD Pipeline

**File**: `.github/workflows/test.yml`

```yaml
name: Backend Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres-test:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: nghe_content_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

      - name: Install dependencies
        run: npm ci
        working-directory: ./apps/backend

      - name: Generate Prisma Client
        run: npx prisma generate
        working-directory: ./apps/backend

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5433/nghe_content_test
        working-directory: ./apps/backend

      - name: Run unit tests
        run: npm run test:unit
        working-directory: ./apps/backend

      - name: Run integration tests
        run: npm run test:integration
        working-directory: ./apps/backend

      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: ./apps/backend

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          files: ./apps/backend/coverage/lcov.info
          flags: backend
          name: backend-coverage
```

**Success Criteria**:
- CI runs on push/PR
- Test database starts successfully
- All test types execute sequentially
- Coverage uploads to Codecov

---

## Phase 2: Unit Testing (Weeks 2-4)

### Test Organization Structure

```
test-setup/tests/unit/
├── auth/
│   ├── auth.service.spec.ts           # P0
│   └── auth.controller.spec.ts        # P1
├── payments/
│   ├── payments.service.spec.ts        # P0
│   ├── payos.service.spec.ts          # P0
│   └── payments.controller.spec.ts    # P1
├── enrollments/
│   ├── enrollments.service.spec.ts    # P1
│   └── enrollments.controller.spec.ts # P2
├── courses/
│   ├── courses.service.spec.ts        # P1
│   └── courses.controller.spec.ts     # P2
├── users/
│   ├── users.service.spec.ts          # P2
│   └── users.controller.spec.ts       # P3
├── categories/
│   ├── categories.service.spec.ts     # P2
│   └── categories.controller.spec.ts  # P3
├── lessons/
│   ├── lessons.service.spec.ts        # P2
│   └── lessons.controller.spec.ts     # P3
├── cart/
│   ├── cart.service.spec.ts           # P3
│   └── cart.controller.spec.ts        # P3
├── progress/
│   ├── progress.service.spec.ts       # P3
│   └── progress.controller.spec.ts    # P3
├── media/
│   ├── media.service.spec.ts          # P3
│   └── media.controller.spec.ts       # P3
└── shared/
    ├── guards.spec.ts                 # P1 (FirebaseAuthGuard, RolesGuard)
    ├── decorators.spec.ts             # P2
    ├── interceptors.spec.ts           # P2
    └── filters.spec.ts                # P3
```

### Unit Test Template Pattern

```typescript
// test-setup/tests/unit/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/modules/auth/auth.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { DatabaseHelper, MockFirebase } from '@/test-setup';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService - Unit Tests', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeAll(async () => {
    await DatabaseHelper.ensureTestDatabase();
  });

  afterAll(async () => {
    await DatabaseHelper.closeConnection();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    MockFirebase.setupMocks();
  });

  afterEach(async () => {
    await DatabaseHelper.cleanupTestData();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 1,
        firebaseUid: 'mock-uid',
        email: registerDto.email,
        name: registerDto.name,
        role: 'USER',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toHaveProperty('message', 'User registered successfully');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 1,
        email: registerDto.email,
      } as any);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('login', () => {
    it('should login user with valid Firebase token', async () => {
      // Arrange
      const mockToken = AuthHelper.generateStudentToken();
      const mockFirebaseUser = MockFirebase.createMockStudent();

      jest.spyOn(service['firebaseAdmin'].auth(), 'verifyIdToken')
        .mockResolvedValue(mockFirebaseUser);

      jest.spyOn(prisma.user, 'findFirst')
        .mockResolvedValue({
          id: 1,
          firebaseUid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          name: mockFirebaseUser.displayName,
          role: 'USER',
        } as any);

      // Act
      const result = await service.login({ idToken: mockToken });

      // Assert
      expect(result.user).toHaveProperty('id');
      expect(result.user.email).toBe(mockFirebaseUser.email);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      jest.spyOn(service['firebaseAdmin'].auth(), 'verifyIdToken')
        .mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(
        service.login({ idToken: 'invalid-token' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

### Phase 2 Task Breakdown

**Week 2: Auth & Payments (P0 - Critical Path)**

| Task | File | Test Cases | Est. Time |
|------|------|------------|-----------|
| Auth Service Unit Tests | `auth.service.spec.ts` | register, login, profile, forgotPassword, refresh, getAllUsers, updateUserRole | 4h |
| Auth Controller Unit Tests | `auth.controller.spec.ts` | All endpoint handlers | 2h |
| Payments Service Unit Tests | `payments.service.spec.ts` | createPayment, createBatchPayment, verifyPayment, handleWebhook, processRefund | 6h |
| Payments Controller Unit Tests | `payments.controller.spec.ts` | All endpoint handlers | 2h |
| PayOS Integration Tests | `payos.service.spec.ts` | createPaymentLink, getPaymentInfo, cancelPayment, verifyWebhook | 3h |

**Week 3: Enrollments & Courses (P1)**

| Task | File | Test Cases | Est. Time |
|------|------|------------|-----------|
| Enrollments Service | `enrollments.service.spec.ts` | enroll, checkEnrollment, getMyEnrollments, updateProgress, completeCourse | 4h |
| Enrollments Controller | `enrollments.controller.spec.ts` | All endpoint handlers | 2h |
| Courses Service | `courses.service.spec.ts` | create, update, publish, archive, findAll, findOne, findByInstructor | 4h |
| Courses Controller | `courses.controller.spec.ts` | All endpoint handlers | 2h |

**Week 4: Guards & Remaining Modules (P2-P3)**

| Task | File | Test Cases | Est. Time |
|------|------|------------|-----------|
| Guards Unit Tests | `guards.spec.ts` | FirebaseAuthGuard, RolesGuard, AdminGuard | 3h |
| Users Service | `users.service.spec.ts` | findById, update, delete, enrollInCourse | 2h |
| Categories Service | `categories.service.spec.ts` | create, update, delete, findAll, getTree | 2h |
| Lessons/Media/Cart/Progress | Combined specs | CRUD operations | 4h |

### Unit Test Coverage Targets

| Module | Target Lines | Target Branches | Priority |
|--------|-------------|-----------------|----------|
| auth.service.ts | 90% | 85% | P0 |
| payments.service.ts | 95% | 90% | P0 |
| enrollments.service.ts | 85% | 80% | P1 |
| courses.service.ts | 85% | 80% | P1 |
| All others | 80% | 75% | P2-P3 |

---

## Phase 3: Integration Testing (Weeks 5-6)

### Test Organization Structure

```
test-setup/tests/integration/
├── auth/
│   ├── auth.flow.spec.ts              # Register -> Login -> Profile flow
│   └── auth.database.spec.ts          # User CRUD with real DB
├── payments/
│   ├── payment.flow.spec.ts           # Create -> Webhook -> Verify -> Enrollment
│   └── payment.webhook.spec.ts        # Webhook idempotency
├── enrollments/
│   ├── enrollment.creation.spec.ts    # Payment -> Enrollment creation
│   └── enrollment.progress.spec.ts    # Progress tracking
├── courses/
│   ├── course.crud.spec.ts            # Course CRUD with real DB
│   └── course.publishing.spec.ts      # Draft -> Published flow
└── database/
    └── transaction.spec.ts            # Transaction rollback tests
```

### Integration Test Template Pattern

```typescript
// test-setup/tests/integration/payments/payment.flow.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  DatabaseHelper,
  AuthHelper,
  MockPayOS,
  CourseFactory,
  UserFactory,
} from '@/test-setup';

describe('Payment Flow - Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    await DatabaseHelper.ensureTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    MockPayOS.setupMocks();
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanupTestData();
  });

  describe('Complete Payment Flow', () => {
    it('should create payment, process webhook, and create enrollment', async () => {
      // 1. Create test user and course
      const user = await UserFactory.createAndSave({
        email: 'student@test.com',
        role: 'USER',
      });

      const course = await CourseFactory.createAndSave({
        price: 299000,
        status: 'PUBLISHED',
      });

      // 2. Create payment
      const studentToken = AuthHelper.generateMockToken({
        uid: user.firebaseUid,
        email: user.email,
        role: 'USER',
      });

      const createResponse = await request(app.getHttpServer())
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: course.id,
          returnUrl: 'http://localhost:3001/success',
          cancelUrl: 'http://localhost:3001/cancel',
        })
        .expect(201);

      expect(createResponse.body).toHaveProperty('orderCode');
      expect(createResponse.body).toHaveProperty('paymentId');

      const { orderCode, paymentId } = createResponse.body;

      // 3. Simulate PayOS webhook
      const webhookPayload = MockPayOS.createMockSuccessWebhook(orderCode);

      await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .set('x-payos-signature', 'mock-signature')
        .send(webhookPayload)
        .expect(200);

      // 4. Verify payment completed
      const verifyResponse = await request(app.getHttpServer())
        .get(`/api/payments/verify/${orderCode}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(verifyResponse.body.status).toBe('COMPLETED');

      // 5. Verify enrollment created
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      });

      expect(enrollment).not.toBeNull();
      expect(enrollment?.status).toBe('ACTIVE');
    });

    it('should handle idempotent webhooks correctly', async () => {
      // Setup
      const user = await UserFactory.createAndSave();
      const course = await CourseFactory.createAndSave({ status: 'PUBLISHED' });

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          amount: 299000,
          userId: user.id,
          enrollmentId: 1,
          status: 'PENDING',
        },
      });

      const webhookPayload = MockPayOS.createMockSuccessWebhook(payment.id);

      // First webhook
      await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .send(webhookPayload)
        .expect(200);

      // Second webhook (idempotent)
      const response = await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.message).toContain('Already processed');
    });
  });
});
```

### Phase 3 Task Breakdown

**Week 5: Auth & Payment Integration**

| Task | Test Scenarios | Est. Time |
|------|---------------|-----------|
| Auth Flow | Register -> Login -> Get Profile -> Logout | 3h |
| Auth Role Flow | User -> Admin Role Change -> Verify Admin Access | 2h |
| Payment Complete Flow | Create -> Webhook -> Verify -> Enrollment | 4h |
| Payment Failure Flow | Create -> Cancel -> Verify Failed | 2h |
| Payment Idempotency | Duplicate webhooks, concurrent requests | 3h |

**Week 6: Course & Enrollment Integration**

| Task | Test Scenarios | Est. Time |
|------|---------------|-----------|
| Course Publishing | Draft -> Pending -> Published | 3h |
| Course Enrollment | Create -> Enroll -> Check -> Complete | 3h |
| Progress Tracking | Start lesson -> Update progress -> Complete lesson | 2h |
| Database Transactions | Rollback on payment failure | 2h |

---

## Phase 4: E2E Testing (Weeks 7-8)

### Test Organization Structure

```
test/
├── jest-e2e.json                        # E2E Jest config
└── e2e/
    ├── auth.e2e-spec.ts                 # Auth full flow
    ├── payments.e2e-spec.ts             # Payment full flow
    ├── enrollments.e2e-spec.ts          # Enrollment full flow
    ├── courses.e2e-spec.ts              # Course management
    └── critical-journeys.e2e-spec.ts    # User journey tests
```

### E2E Test Configuration

**File**: `test/jest-e2e.json`

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/../src/$1"
  },
  "setupFilesAfterEnv": ["<rootDir>/../test-setup/jest.setup.ts"]
}
```

### E2E Test Template Pattern

```typescript
// test/e2e/critical-journeys.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  DatabaseHelper,
  AuthHelper,
  CourseFactory,
  CategoryFactory,
} from '@/test-setup';

describe('Critical User Journeys - E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    await DatabaseHelper.ensureTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanupTestData();
  });

  describe('New Student Onboarding Journey', () => {
    it('should complete full student onboarding flow', async () => {
      // 1. Browse courses (public)
      const browseResponse = await request(app.getHttpServer())
        .get('/api/courses?status=PUBLISHED')
        .expect(200);

      expect(browseResponse.body.data.length).toBeGreaterThan(0);

      // 2. Register new user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newstudent@example.com',
          password: 'SecurePass123!',
          name: 'New Student',
        })
        .expect(201);

      // 3. Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          idToken: AuthHelper.generateMockToken({
            uid: 'new-student-uid',
            email: 'newstudent@example.com',
            role: 'USER',
          }),
        })
        .expect(200);

      const { user } = loginResponse.body;

      // 4. Get profile
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${AuthHelper.generateStudentToken()}`)
        .expect(200);

      // 5. Enroll in a course (via payment)
      const course = await CourseFactory.createAndSave({
        status: 'PUBLISHED',
        price: 299000,
      });

      const paymentResponse = await request(app.getHttpServer())
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${AuthHelper.generateStudentToken()}`)
        .send({
          courseId: course.id,
          returnUrl: 'http://localhost:3001/success',
          cancelUrl: 'http://localhost:3001/cancel',
        })
        .expect(201);

      // 6. Verify enrollment
      await request(app.getHttpServer())
        .get(`/api/enrollments/${course.id}/check`)
        .set('Authorization', `Bearer ${AuthHelper.generateStudentToken()}`)
        .expect(200);

      // 7. View my enrollments
      const enrollmentsResponse = await request(app.getHttpServer())
        .get('/api/enrollments')
        .set('Authorization', `Bearer ${AuthHelper.generateStudentToken()}`)
        .expect(200);

      expect(enrollmentsResponse.body.length).toBeGreaterThan(0);
    });
  });

  describe('Instructor Course Creation Journey', () => {
    it('should complete instructor course creation flow', async () => {
      // 1. Login as instructor
      const instructorToken = AuthHelper.generateInstructorToken();

      // 2. Create category
      const categoryResponse = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          name: 'Test Category',
          slug: 'test-category',
          description: 'Test category description',
        })
        .expect(201);

      const categoryId = categoryResponse.body.id;

      // 3. Create course
      const courseResponse = await request(app.getHttpServer())
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Test Course',
          slug: 'test-course',
          description: 'Test course description',
          price: 299000,
          categoryId,
        })
        .expect(201);

      const courseId = courseResponse.body.id;

      // 4. Add lesson to course
      await request(app.getHttpServer())
        .post(`/api/courses/${courseId}/lessons`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Test Lesson',
          slug: 'test-lesson',
          type: 'VIDEO',
          content: 'Test content',
        })
        .expect(201);

      // 5. Publish course
      await request(app.getHttpServer())
        .patch(`/api/courses/${courseId}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(200);

      // 6. Verify course is published
      const verifyResponse = await request(app.getHttpServer())
        .get(`/api/courses/${courseId}`)
        .expect(200);

      expect(verifyResponse.body.status).toBe('PUBLISHED');
    });
  });
});
```

### Phase 4 Task Breakdown

**Week 7: Auth & Payments E2E**

| Task | Test Scenarios | Est. Time |
|------|---------------|-----------|
| Auth E2E | Register, Login, Refresh, Profile, Role Change | 4h |
| Payments E2E | Create, Webhook, Verify, Refund | 4h |
| Payment Failure E2E | Cancel, Expire, Failed scenarios | 2h |

**Week 8: Complete User Journeys**

| Task | Test Scenarios | Est. Time |
|------|---------------|-----------|
| Student Onboarding | Browse -> Register -> Enroll -> Learn | 4h |
| Instructor Flow | Create Course -> Add Lessons -> Publish | 3h |
| Admin Flow | Manage Users -> Review Courses -> Handle Payments | 3h |

---

## Phase 5: Advanced Testing (Week 9)

### 5.1 Performance Testing

**Update**: `test-setup/tests/performance/load-test.yml`

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Baseline"
    - duration: 120
      arrivalRate: 50
      name: "Normal Load"
    - duration: 60
      arrivalRate: 100
      name: "Peak Load"
    - duration: 60
      arrivalRate: 150
      name: "Stress Test"

scenarios:
  - name: "Browse Courses"
    flow:
      - get:
          url: "/api/courses"
          qs:
            status: "PUBLISHED"
            limit: 20

  - name: "View Course Details"
    weight: 30
    flow:
      - get:
          url: "/api/courses/{{$randomNumber(1, 100)}}"

  - name: "User Login Flow"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            idToken: "mock-test-token"
```

**Performance Targets**:

| Endpoint | p50 Response | p95 Response | p99 Response | Max Error Rate |
|----------|-------------|-------------|-------------|----------------|
| GET /api/courses | <100ms | <200ms | <500ms | <0.1% |
| GET /api/courses/:id | <50ms | <100ms | <200ms | <0.1% |
| POST /api/auth/login | <200ms | <400ms | <800ms | <0.5% |
| POST /api/payments/create | <500ms | <1000ms | <2000ms | <1% |

### 5.2 Security Testing

**Security Test Suite**: `test-setup/tests/integration/security/`

| Test Type | Scenarios | Priority |
|-----------|-----------|----------|
| Authentication | Invalid tokens, expired tokens, malformed tokens | P0 |
| Authorization | Role-based access, admin-only endpoints | P0 |
| Input Validation | SQL injection, XSS, CSRF protection | P0 |
| Rate Limiting | Brute force protection, DDoS mitigation | P1 |
| Data Privacy | User data isolation, payment data protection | P0 |

```typescript
// test-setup/tests/integration/security/security.spec.ts
describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with expired token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${AuthHelper.generateExpiredToken()}`)
        .expect(401);
    });
  });

  describe('Authorization Security', () => {
    it('should prevent non-admin from accessing admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${AuthHelper.generateStudentToken()}`)
        .expect(403);
    });

    it('should prevent users from accessing other users data', async () => {
      const user1 = await UserFactory.createAndSave();
      const user2 = await UserFactory.createAndSave();

      await request(app.getHttpServer())
        .get(`/api/users/${user2.id}`)
        .set('Authorization', `Bearer ${AuthHelper.generateMockToken({
          uid: user1.firebaseUid,
          email: user1.email,
          role: 'USER',
        })}`)
        .expect(403);
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize SQL injection attempts', async () => {
      await request(app.getHttpServer())
        .get('/api/courses?search=\'; DROP TABLE users; --')
        .expect(400);
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'ValidPass123!',
        })
        .expect(400);
    });
  });
});
```

---

## Mock Usage Guidelines

### When to Mock

| Scenario | Use Mock | Reason |
|----------|----------|--------|
| Firebase Admin SDK | YES | External service, no control |
| PayOS Payment Gateway | YES | External service, financial |
| Database Queries | NO | Use real test DB |
| Other Services | YES | For pure unit tests |

### Mock Patterns

```typescript
// 1. Mock External Service (Firebase)
jest.mock('firebase-admin', () => ({
  credential: { cert: jest.fn() },
  initializeApp: jest.fn(() => ({
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue(mockUser),
    }),
  })),
}));

// 2. Mock Prisma (for pure unit tests)
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

// 3. Use Real Helpers (integration tests)
const prisma = DatabaseHelper.getClient();
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml (complete)
name: Backend Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  DATABASE_URL: postgresql://test:test@localhost:5433/nghe_content_test

jobs:
  # Lint & Type Check
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
        working-directory: ./apps/backend
      - run: npm run lint
        working-directory: ./apps/backend

  # Unit Tests
  unit:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
        working-directory: ./apps/backend
      - run: npm run prisma:generate
        working-directory: ./apps/backend
      - run: npm run test:unit -- --coverage
        working-directory: ./apps/backend
      - uses: codecov/codecov-action@v4
        with:
          files: ./apps/backend/coverage/lcov.info
          flags: unit

  # Integration Tests
  integration:
    needs: lint
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: nghe_content_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
        working-directory: ./apps/backend
      - run: npm run prisma:generate
        working-directory: ./apps/backend
      - run: npx prisma migrate deploy
        working-directory: ./apps/backend
      - run: npm run test:integration -- --coverage
        working-directory: ./apps/backend
      - uses: codecov/codecov-action@v4
        with:
          files: ./apps/backend/coverage/lcov.info
          flags: integration

  # E2E Tests
  e2e:
    needs: [unit, integration]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: nghe_content_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
        working-directory: ./apps/backend
      - run: npm run prisma:generate
        working-directory: ./apps/backend
      - run: npx prisma migrate deploy
        working-directory: ./apps/backend
      - run: npm run test:e2e -- --coverage
        working-directory: ./apps/backend
      - uses: codecov/codecov-action@v4
        with:
          files: ./apps/backend/coverage/lcov.info
          flags: e2e

  # Performance Tests (scheduled)
  performance:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: nghe_content_test
        ports:
          - 5433:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
        working-directory: ./apps/backend
      - run: npx prisma migrate deploy
        working-directory: ./apps/backend
      - run: npm run build
        working-directory: ./apps/backend
      - run: npm run start:prod &
        working-directory: ./apps/backend
      - run: sleep 30
      - run: npm run test:perf
        working-directory: ./apps/backend
```

---

## Test Execution Commands

### Development

```bash
# Start test database
docker-compose -f test-setup/docker-compose.test.yml up -d

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only E2E tests
npm run test:e2e

# Run with coverage
npm run test:cov

# Run specific test file
npm run test -- auth.service.spec.ts

# Run tests matching pattern
npm run test -- --testNamePattern="should create payment"
```

### CI/CD

```bash
# Full test suite with coverage
npm run test:ci

# Performance tests
npm run test:perf

# Database operations
npm run test:db:setup    # Start test DB
npm run test:db:migrate  # Run migrations
npm run test:db:reset    # Reset database
npm run test:db:seed     # Seed test data
npm run test:db:teardown # Stop test DB
```

---

## Success Criteria & Coverage Targets

### Phase Completion Criteria

| Phase | Coverage Target | Test Count | Duration Target |
|-------|---------------|------------|-----------------|
| Phase 1 | N/A (Infrastructure) | 0 | 1 week |
| Phase 2 | 80%+ lines, 75%+ branches | 50+ tests | 3 weeks |
| Phase 3 | 70%+ critical paths | 20+ tests | 2 weeks |
| Phase 4 | 100% user journeys | 15+ tests | 2 weeks |
| Phase 5 | Performance baseline | 5+ tests | 1 week |

### Overall Project Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Line Coverage | 80% | Jest coverage report |
| Branch Coverage | 75% | Jest coverage report |
| Critical Path Coverage | 100% | Manual verification |
| Test Execution Time | <5 min | CI/CD logs |
| Flaky Test Rate | 0% | CI consistency |

### Module-Specific Targets

| Module | Lines | Branches | Rationale |
|--------|-------|----------|-----------|
| auth | 90% | 85% | Security critical |
| payments | 95% | 90% | Financial critical |
| enrollments | 85% | 80% | Core business logic |
| courses | 85% | 80% | Core feature |
| others | 80% | 75% | Standard CRUD |

---

## Implementation Best Practices

### Test Writing Guidelines

1. **AAA Pattern**: Arrange-Act-Assert structure
2. **Descriptive Names**: Test names should describe the scenario
3. **One Assertion Per Test**: Focus on single behavior
4. **Test Isolation**: Each test should be independent
5. **Mock External Services**: Firebase, PayOS
6. **Real Database**: Use test DB for integration tests

### Anti-Patterns to Avoid

| Anti-Pattern | Why | Alternative |
|--------------|-----|-------------|
| Testing framework code | Waste of time | Test only your code |
| Shared test data | Flaky tests | Create fresh data per test |
| Over-mocking | False confidence | Use real DB when appropriate |
| Testing implementation details | Brittle tests | Test behavior |
| Ignoring error paths | Low coverage | Test all branches |

### File Naming Conventions

- Unit tests: `<service>.spec.ts` (co-located with source)
- Integration tests: `<feature>.flow.spec.ts`
- E2E tests: `<journey>.e2e-spec.ts`

---

## Risk Mitigation

### Potential Issues & Solutions

| Risk | Impact | Mitigation |
|------|--------|------------|
| Firebase API changes | Test failures | Use comprehensive mocks |
| PayOS sandbox downtime | Blocked testing | Full mock implementation |
| Test data pollution | Flaky tests | beforeEach cleanup |
| Slow test execution | Long CI runs | Parallel test execution |
| External rate limits | CI failures | Use mocks for external calls |

---

## Timeline Summary

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Foundation | CI/CD pipeline, infrastructure verified |
| 2-4 | Unit Tests | Auth, payments, enrollments, courses (50+ tests) |
| 5-6 | Integration | Flows, database transactions (20+ tests) |
| 7-8 | E2E | Complete user journeys (15+ tests) |
| 9 | Advanced | Performance, security tests (5+ tests) |

**Total Estimated Duration**: 9 weeks
**Total Estimated Tests**: 90+ tests
**Target Coverage**: 80%+ lines, 75%+ branches

---

## Unresolved Questions

1. **Codecov Integration**: Should we set up Codecov for coverage tracking?
2. **Performance Baseline**: What are the current production response times?
3. **Test Data Volume**: How much test data should we seed for performance tests?
4. **Parallel Execution**: Should we enable Jest parallel execution for faster CI?
5. **E2E Test Data**: Should we use a separate seed file for E2E tests?

---

## Next Steps

1. **Review this plan** with development team
2. **Set up CI/CD** pipeline (Phase 1)
3. **Start P0 tests** (Auth & Payments unit tests)
4. **Establish coverage reporting** dashboard
5. **Schedule weekly** test review sessions

---

**Document Version**: 1.0
**Last Updated**: 2025-12-24
**Plan Location**: `plans/251224-backend-automated-testing/plan.md`
