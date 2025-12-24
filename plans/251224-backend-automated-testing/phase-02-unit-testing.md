# Phase 02: Unit Testing Implementation

**Parent Plan**: [plan.md](./plan.md)
**Dependencies**: [Phase 01](./phase-01-foundation-setup.md)
**Status**: Draft
**Priority**: P0 (Critical Path)
**Estimated Duration**: 3 weeks

## Context Links

- **Research**: [NestJS Testing Strategies](./research/researcher-01-nestjs-testing-strategies.md)
- **Scout**: Module structure analysis in `scout/scout-report-*.md`
- **Test Infrastructure**: Leverage existing helpers, factories, mocks from `test-setup/`

## Overview

**Date**: 2025-12-24
**Description**: Implement comprehensive unit tests for all service and controller layers, focusing on business logic isolation with mocked dependencies
**Implementation Status**: Not Started
**Review Status**: Pending Review

## Key Insights

- **Existing Infrastructure is Excellent**: Factories, mocks, helpers all ready
- **Test Pattern Established**: Use `DatabaseHelper`, `AuthHelper`, `MockFirebase`, `MockPayOS`
- **Priority-Based Approach**: Start with P0 modules (auth, payments), then P1-P3

## Requirements

### Functional Requirements
1. Unit tests for all service methods (50+ tests total)
2. Unit tests for all controller handlers
3. DTO validation tests
4. Guard and decorator tests
5. 80%+ line coverage, 75%+ branch coverage

### Non-Functional Requirements
- Test execution time: <2 minutes for full unit suite
- Zero test interdependencies
- Clear test names following AAA pattern
- Comprehensive error path testing

## Architecture

### Test Organization
```
test-setup/tests/unit/
├── auth/
│   ├── auth.service.spec.ts           # P0 - 8 service methods
│   └── auth.controller.spec.ts        # P1 - 8 endpoints
├── payments/
│   ├── payments.service.spec.ts        # P0 - 6 service methods
│   ├── payos.service.spec.ts          # P0 - 4 integration methods
│   └── payments.controller.spec.ts    # P1 - 8 endpoints
├── enrollments/
│   ├── enrollments.service.spec.ts    # P1 - 6 service methods
│   └── enrollments.controller.spec.ts # P2 - 8 endpoints
├── courses/
│   ├── courses.service.spec.ts        # P1 - 8 service methods
│   └── courses.controller.spec.ts     # P2 - 8 endpoints
├── users/
│   ├── users.service.spec.ts          # P2 - 4 service methods
│   └── users.controller.spec.ts       # P3 - 4 endpoints
├── categories/
│   ├── categories.service.spec.ts     # P2 - 5 service methods
│   └── categories.controller.spec.ts  # P3 - 5 endpoints
├── lessons/
│   ├── lessons.service.spec.ts        # P2 - 6 service methods
│   └── lessons.controller.spec.ts     # P3 - 6 endpoints
├── cart/
│   ├── cart.service.spec.ts           # P3 - 4 service methods
│   └── cart.controller.spec.ts        # P3 - 4 endpoints
├── progress/
│   ├── progress.service.spec.ts       # P3 - 3 service methods
│   └── progress.controller.spec.ts    # P3 - 3 endpoints
├── media/
│   ├── media.service.spec.ts          # P3 - 5 service methods
│   └── media.controller.spec.ts       # P3 - 3 endpoints
└── shared/
    ├── guards.spec.ts                 # P1 - 3 guards
    ├── decorators.spec.ts             # P2 - 2 decorators
    └── filters.spec.ts                # P3 - 1 filter
```

### Unit Test Pattern
```typescript
// Standard unit test structure
describe('ServiceName - Unit Tests', () => {
  let service: ServiceName;
  let prisma: PrismaService;

  beforeAll(async () => {
    await DatabaseHelper.ensureTestDatabase();
  });

  afterAll(async () => {
    await DatabaseHelper.closeConnection();
  });

  beforeEach(async () => {
    // Create testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await DatabaseHelper.cleanupTestData();
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should succeed with valid input', async () => {
      // Arrange
      const input = { /* test data */ };
      jest.spyOn(prisma.model, 'method').mockResolvedValue(expected);

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toEqual(expected);
      expect(prisma.model.method).toHaveBeenCalledWith(input);
    });

    it('should throw error with invalid input', async () => {
      // Arrange
      const input = { /* invalid data */ };
      jest.spyOn(prisma.model, 'method').mockRejectedValue(new Error());

      // Act & Assert
      await expect(service.methodName(input)).rejects.toThrow(Error);
    });
  });
});
```

## Related Code Files

### Files to Create
- `test-setup/tests/unit/auth/auth.service.spec.ts`
- `test-setup/tests/unit/auth/auth.controller.spec.ts`
- `test-setup/tests/unit/payments/payments.service.spec.ts`
- `test-setup/tests/unit/payments/payos.service.spec.ts`
- `test-setup/tests/unit/payments/payments.controller.spec.ts`
- `test-setup/tests/unit/enrollments/enrollments.service.spec.ts`
- `test-setup/tests/unit/enrollments/enrollments.controller.spec.ts`
- `test-setup/tests/unit/courses/courses.service.spec.ts`
- `test-setup/tests/unit/courses/courses.controller.spec.ts`
- `test-setup/tests/unit/shared/guards.spec.ts`
- Plus all remaining module test files

### Files to Read
- `apps/backend/src/modules/auth/auth.service.ts` - Understand methods to test
- `apps/backend/src/modules/payments/payments.service.ts` - Complex payment logic
- `apps/backend/src/modules/enrollments/enrollments.service.ts` - Business logic
- `test-setup/helpers/auth.helper.ts` - Use for test tokens
- `test-setup/mocks/firebase.mock.ts` - Firebase mock setup
- `test-setup/mocks/payos.mock.ts` - PayOS mock setup
- `test-setup/factories/*.factory.ts` - Test data factories

## Implementation Steps

### Week 2: P0 Modules (Auth & Payments)

#### 2.1 Auth Service Unit Tests
**File**: `test-setup/tests/unit/auth/auth.service.spec.ts`

**Test Cases**:
1. `register` - Success with new user
2. `register` - Conflict with existing email
3. `register` - Invalid input validation
4. `login` - Success with valid Firebase token
5. `login` - Unauthorized with invalid token
6. `login` - Creates new user on first login
7. `getProfile` - Success with authenticated user
8. `forgotPassword` - Success with existing email
9. `forgotPassword` - Success even with non-existent email (security)
10. `resetPassword` - Success with valid token
11. `resetPassword` - Unauthorized with invalid token
12. `refreshSession` - Success with valid token
13. `getAllUsers` - Success for admin
14. `getAllUsers` - Forbidden for non-admin
15. `updateUserRole` - Success for admin
16. `updateUserRole` - Forbidden for non-admin

**Coverage Target**: 90% lines, 85% branches

**Estimated Time**: 4 hours

#### 2.2 Auth Controller Unit Tests
**File**: `test-setup/tests/unit/auth/auth.controller.spec.ts`

**Test Cases**:
1. All 8 endpoint handlers
2. Request validation
3. Response formatting
4. Error handling

**Estimated Time**: 2 hours

#### 2.3 Payments Service Unit Tests
**File**: `test-setup/tests/unit/payments/payments.service.spec.ts`

**Test Cases**:
1. `createPayment` - Success with valid course
2. `createPayment` - Conflict with existing active payment
3. `createPayment` - Not found with invalid course
4. `createBatchPayment` - Success with multiple courses
5. `createBatchPayment` - Validation errors
6. `verifyPayment` - Success with completed payment
7. `verifyPayment` - Not found with invalid order code
8. `handleWebhook` - Success with valid webhook
9. `handleWebhook` - Idempotency (duplicate webhook)
10. `processRefund` - Success with refundable payment
11. `processRefund` - Conflict with non-refundable payment

**Coverage Target**: 95% lines, 90% branches

**Estimated Time**: 6 hours

#### 2.4 PayOS Service Unit Tests
**File**: `test-setup/tests/unit/payments/payos.service.spec.ts`

**Test Cases**:
1. `createPaymentLink` - Success
2. `getPaymentInfo` - Success
3. `cancelPayment` - Success
4. `verifyWebhookSignature` - Valid signature
5. `verifyWebhookSignature` - Invalid signature

**Estimated Time**: 3 hours

#### 2.5 Payments Controller Unit Tests
**File**: `test-setup/tests/unit/payments/payments.controller.spec.ts`

**Test Cases**: All 8 endpoint handlers

**Estimated Time**: 2 hours

### Week 3: P1 Modules (Enrollments & Courses)

#### 2.6 Enrollments Service Unit Tests
**File**: `test-setup/tests/unit/enrollments/enrollments.service.spec.ts`

**Test Cases**:
1. `enroll` - Success with payment
2. `enroll` - Conflict with existing enrollment
3. `checkEnrollment` - Success with active enrollment
4. `checkEnrollment` - Not found without enrollment
5. `getMyEnrollments` - Success with enrolled user
6. `updateProgress` - Success
7. `completeCourse` - Success

**Coverage Target**: 85% lines, 80% branches

**Estimated Time**: 4 hours

#### 2.7 Courses Service Unit Tests
**File**: `test-setup/tests/unit/courses/courses.service.spec.ts`

**Test Cases**: CRUD operations, filtering, publishing workflow

**Coverage Target**: 85% lines, 80% branches

**Estimated Time**: 4 hours

### Week 4: P2-P3 Modules & Guards

#### 2.8 Guards & Shared Tests
**File**: `test-setup/tests/unit/shared/guards.spec.ts`

**Test Cases**:
1. `FirebaseAuthGuard` - Valid token
2. `FirebaseAuthGuard` - Invalid token
3. `FirebaseAuthGuard` - Missing token
4. `RolesGuard` - Valid role
5. `RolesGuard` - Invalid role
6. `RolesGuard` - No roles required

**Estimated Time**: 3 hours

#### 2.9 Remaining Modules (Users, Categories, Lessons, Cart, Progress, Media)

**Test Cases**: CRUD operations for each module

**Estimated Time**: 4 hours (combined)

## Todo List

### Week 2: P0 Modules
- [ ] 2.1 Auth Service Unit Tests (4h)
- [ ] 2.2 Auth Controller Unit Tests (2h)
- [ ] 2.3 Payments Service Unit Tests (6h)
- [ ] 2.4 PayOS Service Unit Tests (3h)
- [ ] 2.5 Payments Controller Unit Tests (2h)

### Week 3: P1 Modules
- [ ] 2.6 Enrollments Service Unit Tests (4h)
- [ ] 2.7 Enrollments Controller Unit Tests (2h)
- [ ] 2.8 Courses Service Unit Tests (4h)
- [ ] 2.9 Courses Controller Unit Tests (2h)

### Week 4: Guards & P2-P3 Modules
- [ ] 2.10 Guards Unit Tests (3h)
- [ ] 2.11 Users Module Unit Tests (2h)
- [ ] 2.12 Categories Module Unit Tests (2h)
- [ ] 2.13 Lessons Module Unit Tests (2h)
- [ ] 2.14 Combined P3 Modules (Cart, Progress, Media) (4h)
- [ ] 2.15 Coverage Verification & Gap Filling (4h)

## Success Criteria

### Phase Completion
- [ ] 50+ unit tests written
- [ ] 80%+ line coverage achieved
- [ ] 75%+ branch coverage achieved
- [ ] P0 modules (auth, payments) at 90%+ coverage
- [ ] All tests pass consistently
- [ ] Test execution time <2 minutes

### Module-Specific Targets
| Module | Lines | Branches | Priority |
|--------|-------|----------|----------|
| auth.service.ts | 90% | 85% | P0 |
| payments.service.ts | 95% | 90% | P0 |
| enrollments.service.ts | 85% | 80% | P1 |
| courses.service.ts | 85% | 80% | P1 |
| All others | 80% | 75% | P2-P3 |

### Quality Gates
- [ ] Zero flaky tests
- [ ] All error paths tested
- [ ] Clear test names
- [ ] AAA pattern followed
- [ ] No test interdependencies

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Complex payment logic hard to test | Medium | High | Break into smaller test cases |
| Firebase mock incomplete | Low | Medium | Extend mock as needed |
| Slow test execution | Medium | Medium | Optimize setup/teardown |
| Insufficient coverage on edge cases | Medium | Medium | Manual coverage review |

## Security Considerations

- **Authentication Tests**: Verify all auth paths (valid/invalid/expired tokens)
- **Authorization Tests**: Test role-based access control thoroughly
- **Input Validation**: Test all DTO validation rules
- **Payment Security**: Test payment verification, webhook signature validation
- **Data Isolation**: Ensure users can't access others' data

## Next Steps

1. **Complete Week 2** P0 module tests (auth & payments)
2. **Verify CI/CD** runs unit tests successfully
3. **Proceed to Phase 3** integration testing after unit tests complete

---

**Dependencies**: Phase 01 must be complete
**Estimated Completion**: 3 weeks
**Blockers**: None identified
**Test Count Target**: 50+ tests
