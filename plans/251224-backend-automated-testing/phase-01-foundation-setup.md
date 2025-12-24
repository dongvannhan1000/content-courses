# Phase 01: Foundation & CI/CD Setup

**Parent Plan**: [plan.md](./plan.md)
**Status**: Draft
**Priority**: P0 (Critical Path)
**Estimated Duration**: 1 week

## Context Links

- **Research Reports**:
  - [NestJS Testing Strategies](./research/researcher-01-nestjs-testing-strategies.md)
  - [Test Infrastructure Patterns](./research/researcher-02-test-infrastructure-patterns.md)
- **Scout Reports**: See `scout/` directory for codebase analysis

## Overview

**Date**: 2025-12-24
**Description**: Verify test infrastructure completeness and setup CI/CD pipeline for automated testing
**Implementation Status**: Not Started
**Review Status**: Pending Review

## Key Insights

- **Existing Infrastructure is Solid**: Comprehensive test setup already exists (Jest config, helpers, factories, mocks, Docker test DB)
- **CI/CD Missing**: No GitHub Actions workflow configured for automated test execution
- **Low Hanging Fruit**: Infrastructure ready, only need to verify and add CI/CD

## Requirements

### Functional Requirements
1. Test database connectivity verified with Docker
2. GitHub Actions workflow for automated testing
3. Coverage reporting integrated with CI/CD
4. Test execution documented in README

### Non-Functional Requirements
- Test execution time: <5 minutes for full suite
- Zero flaky tests
- 100% CI reliability
- Clear test execution documentation

## Architecture

```
GitHub Actions Workflow (.github/workflows/test.yml)
├── Lint Job
├── Unit Test Job (with coverage)
├── Integration Test Job (with PostgreSQL service)
├── E2E Test Job (with PostgreSQL service)
└── Performance Test Job (scheduled)
```

## Related Code Files

### Files to Create
- `.github/workflows/test.yml` - Complete CI/CD pipeline
- `apps/backend/TESTING.md` - Test execution guide (or update main README)

### Files to Verify
- `jest.config.js` - Jest configuration
- `test-setup/jest.setup.ts` - Global test setup
- `test-setup/docker-compose.test.yml` - Test database
- `.env.test` - Test environment variables

### Files to Read
- `apps/backend/package.json` - Test scripts

## Implementation Steps

### 1.1 Verify Test Infrastructure

**Tasks**:
1. Create `.env.test` file with mock service configurations
2. Start test database: `docker-compose -f test-setup/docker-compose.test.yml up -d`
3. Run database migrations: `npm run test:db:migrate`
4. Execute test suite: `npm run test` (verify it runs without errors, even with 0 tests passing)
5. Verify test cleanup: `docker-compose -f test-setup/docker-compose.test.yml down`

**Commands**:
```bash
# Start test DB
docker-compose -f test-setup/docker-compose.test.yml up -d

# Verify database is ready
docker ps | grep postgres-test

# Run migrations
DATABASE_URL="postgresql://test:test@localhost:5433/nghe_content_test" npx prisma migrate deploy

# Run tests (watch mode)
npm run test:watch

# Cleanup
docker-compose -f test-setup/docker-compose.test.yml down
```

**Success Criteria**:
- [ ] Test database starts successfully on port 5433
- [ ] Migrations apply without errors
- [ ] `npm run test` executes Jest successfully
- [ ] Test database container stops cleanly

### 1.2 Create GitHub Actions CI/CD Workflow

**File**: `.github/workflows/test.yml`

**Steps**:
1. Create `.github/workflows/` directory in project root
2. Create `test.yml` workflow file with:
   - Lint job
   - Unit test job (no DB required)
   - Integration test job (with PostgreSQL service)
   - E2E test job (with PostgreSQL service)
   - Coverage upload to Codecov (optional)
3. Configure workflow triggers:
   - Push to `main` and `develop` branches
   - Pull requests to `main` and `develop`
4. Add Node.js setup (version 20)
5. Add dependency caching
6. Configure PostgreSQL service with health checks

**Workflow Structure**:
```yaml
name: Backend Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    # ESLint checks

  unit:
    # Unit tests with coverage

  integration:
    # Integration tests with PostgreSQL
    services:
      postgres-test:
        image: postgres:15-alpine
        ports:
          - 5433:5432

  e2e:
    # E2E tests with PostgreSQL
```

**Success Criteria**:
- [ ] Workflow triggers on push/PR
- [ ] All jobs execute sequentially
- [ ] PostgreSQL service starts with health checks
- [ ] Coverage reports upload (if Codecov configured)
- [ ] Workflow completes in <5 minutes

### 1.3 Document Test Execution

**File**: `apps/backend/TESTING.md` or update `README.md`

**Content**:
1. How to start test database
2. How to run different test types
3. How to run tests with coverage
4. How to run specific test files
5. Troubleshooting common issues

**Structure**:
```markdown
# Testing Guide

## Prerequisites
- Docker and Docker Compose installed
- Node.js 20+

## Local Testing

### Start Test Database
\`\`\`bash
docker-compose -f test-setup/docker-compose.test.yml up -d
\`\`\`

### Run Tests
\`\`\`bash
npm run test              # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # E2E tests only
npm run test:cov          # With coverage
\`\`\`

### Stop Test Database
\`\`\`bash
docker-compose -f test-setup/docker-compose.test.yml down
\`\`\`

## CI/CD
Tests automatically run on GitHub Actions for all PRs.
```

**Success Criteria**:
- [ ] Documentation is clear and concise
- [ ] All commands are tested and working
- [ ] Troubleshooting section covers common issues

## Todo List

- [ ] Task 1.1: Verify test infrastructure
  - [ ] Create `.env.test` file
  - [ ] Start test database
  - [ ] Run migrations
  - [ ] Execute test suite
  - [ ] Verify cleanup
- [ ] Task 1.2: Create GitHub Actions workflow
  - [ ] Create `.github/workflows/test.yml`
  - [ ] Configure lint job
  - [ ] Configure unit test job
  - [ ] Configure integration test job
  - [ ] Configure E2E test job
  - [ ] Test workflow locally (act CLI)
- [ ] Task 1.3: Document test execution
  - [ ] Create or update TESTING.md
  - [ ] Document all test commands
  - [ ] Add troubleshooting section

## Success Criteria

### Phase Completion
- [ ] Test infrastructure verified and working
- [ ] CI/CD pipeline running on GitHub Actions
- [ ] Test execution documented
- [ ] All tests pass in CI/CD (even if 0 tests initially)

### Quality Gates
- [ ] CI/CD workflow runs successfully on push
- [ ] Test database starts reliably in CI
- [ ] Coverage reports generate correctly
- [ ] Documentation reviewed by team

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Docker not available in CI | Low | High | Use GitHub Actions PostgreSQL service |
| Test environment conflicts | Medium | Medium | Use separate test database on port 5433 |
| Slow CI execution | Medium | Low | Enable dependency caching, parallel jobs |

## Security Considerations

- **Environment Variables**: Never commit real credentials to `.env.test`
- **Firebase Mocks**: Use mock Firebase Admin SDK in tests
- **PayOS Mocks**: Use mock PayOS service, never real API keys
- **Database Credentials**: Test database credentials can be public (test/test)

## Next Steps

1. **Complete Phase 1** infrastructure setup
2. **Begin Phase 2** with unit testing for auth and payments modules
3. **Monitor CI/CD** for first few days to ensure stability

---

**Dependencies**: None (this is the foundation phase)
**Estimated Completion**: 1 week
**Blockers**: None identified
