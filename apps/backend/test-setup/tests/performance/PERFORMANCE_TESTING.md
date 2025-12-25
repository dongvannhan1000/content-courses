# Performance Testing Guide

## Overview

This document covers how to run and interpret performance tests for the backend API.

## Prerequisites

```bash
# Install Artillery globally
npm install -g artillery

# Or use local installation
npx artillery --version
```

## Test Types

### 1. Load Test (`load-test.yml`)

Simulates normal to moderate traffic to verify system stability under expected load.

**Configuration:**
- Duration: ~5 minutes
- Phases:
  - Warm up: 5 req/s for 60s
  - Load test: 10 req/s for 120s
  - Peak load: 20 req/s for 60s
  - Cool down: 5 req/s for 60s

**Run:**
```bash
npm run test:perf

# Or directly:
artillery run test-setup/tests/performance/load-test.yml
```

### 2. Stress Test (`stress-test.yml`)

Pushes the system to its limits to find breaking points.

**Configuration:**
- Duration: ~4.5 minutes
- Phases:
  - Warm up: 10 req/s for 30s
  - Ramp up: 50 req/s for 60s
  - High load: 100 req/s for 60s
  - Stress: 200 req/s for 60s
  - Breaking point: 300 req/s for 30s
  - Cool down: 10 req/s for 30s

**Run:**
```bash
npm run test:stress

# Or directly:
artillery run test-setup/tests/performance/stress-test.yml
```

---

## Running Tests

### Local Testing

1. **Start the backend server:**
```bash
npm run start:dev
# Server runs at http://localhost:3000
```

2. **Run load test in another terminal:**
```bash
npm run test:perf
```

3. **Generate HTML report:**
```bash
artillery run test-setup/tests/performance/load-test.yml -o results.json
artillery report results.json
# Opens results.json.html in browser
```

### Against Staging

```bash
# Override target URL
artillery run -t https://staging-api.example.com test-setup/tests/performance/load-test.yml
```

---

## Test Scenarios

### Health Check (Weight: 20%)
- Simple health endpoint check
- Baseline for measuring overhead

### Public API Endpoints (Weight: 40%)
- Browse categories
- List published courses
- No authentication required

### Authenticated User Flow (Weight: 40%)
- Login with mock token
- Access protected endpoints (profile, enrollments)
- Simulates logged-in user behavior

---

## Interpreting Results

### Key Metrics

| Metric | Description | Good | Warning | Critical |
|--------|-------------|------|---------|----------|
| **http.response_time.p50** | Median response time | < 100ms | 100-500ms | > 500ms |
| **http.response_time.p95** | 95th percentile | < 500ms | 500ms-2s | > 2s |
| **http.response_time.p99** | 99th percentile | < 1s | 1-5s | > 5s |
| **http.requests** | Total requests | - | - | - |
| **http.codes.2xx** | Successful responses | > 99% | 95-99% | < 95% |
| **http.codes.5xx** | Server errors | 0% | < 1% | > 1% |
| **vusers.failed** | Failed virtual users | 0 | < 5% | > 5% |

### Sample Output

```
All VUs finished. Total time: 5 minutes, 0 seconds

--------------------------------
Summary report @ 14:30:00(+0700)
--------------------------------

http.codes.200: ............................ 5234
http.codes.201: ............................ 423
http.codes.401: ............................ 12
http.codes.500: ............................ 3
http.request_rate: ......................... 15/sec
http.requests: ............................. 5672
http.response_time:
  min: ..................................... 5
  max: ..................................... 2341
  median: .................................. 45
  p95: ..................................... 234
  p99: ..................................... 567
vusers.completed: .......................... 1200
vusers.created: ............................ 1200
vusers.created_by_name.Health Check: ....... 240
vusers.created_by_name.Public API: ......... 480
vusers.created_by_name.Authenticated: ...... 480
```

---

## Performance Baselines

Based on initial testing, here are expected baselines:

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| GET /health | 5ms | 15ms | 30ms |
| GET /api/courses | 50ms | 150ms | 300ms |
| GET /api/categories | 30ms | 80ms | 150ms |
| POST /api/auth/login | 100ms | 300ms | 500ms |
| GET /api/enrollments | 80ms | 200ms | 400ms |

---

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Ensure server is running on correct port
   - Check firewall/network settings

2. **High error rate (401)**
   - Check mock token configuration
   - Ensure `FIREBASE_MOCK_MODE=true` in test environment

3. **Timeout errors**
   - Server may be overloaded
   - Check database connection pool
   - Review slow queries

### Debugging

```bash
# Run with debug output
DEBUG=artillery:* artillery run test-setup/tests/performance/load-test.yml

# Run with fewer users first
artillery run --count 10 --num 2 test-setup/tests/performance/load-test.yml
```

---

## CI/CD Integration

Performance tests are automatically run in the GitHub Actions pipeline:

1. **Trigger**: Only on `main` branch (after all other tests pass)
2. **Environment**: Ubuntu with PostgreSQL service
3. **Server**: Application started in production mode
4. **Execution**: `npm run test:perf`

See `.github/workflows/backend-tests.yml` for details.

---

## Best Practices

1. **Run tests on isolated environment** - Don't run against production
2. **Establish baselines first** - Know your normal performance
3. **Test during off-peak hours** - Minimize external factors
4. **Monitor server resources** - CPU, memory, DB connections
5. **Review slow queries** - Use database query logging
6. **Iterate and improve** - Performance testing is continuous
