# E2E Tests Documentation

Tài liệu này giải thích các E2E (End-to-End) tests cho backend application.

## Tổng quan

E2E tests kiểm tra toàn bộ flow từ HTTP request đến response, bao gồm:
- Validation (class-validator)
- Guards (FirebaseAuthGuard, RolesGuard, ThrottlerGuard)
- Controllers
- Services
- Database interactions

## Cấu trúc thư mục

```
test/
├── README.md              # File này
├── jest-e2e.json          # Jest configuration cho E2E tests
├── app.e2e-spec.ts        # Tests cho AppController
└── auth.e2e-spec.ts       # Tests cho AuthController
```

## Chạy tests

```bash
# Chạy tất cả E2E tests
npm run test:e2e

# Chạy với verbose output
npm run test:e2e -- --verbose

# Chạy một file cụ thể
npm run test:e2e -- --testPathPatterns=auth
```

## Yêu cầu

1. **Database PostgreSQL** đang chạy và có connection
2. **Firebase Admin SDK** được cấu hình đúng trong `.env`
3. **Dependencies** đã được cài đặt (`npm install`)

---

## Test Files

### 1. `app.e2e-spec.ts`

Tests cho AppController (root endpoint).

| Test | Mô tả | Expected |
|------|-------|----------|
| `/ (GET) should return 401 without auth` | Root endpoint yêu cầu auth | 401 |

> **Note:** Root endpoint được bảo vệ bởi global `FirebaseAuthGuard`.

---

### 2. `auth.e2e-spec.ts`

Tests cho AuthController - bao quát tất cả auth endpoints.

#### Registration Tests

| Test | Input | Expected |
|------|-------|----------|
| Invalid email format | `email: 'invalid-email'` | 400 |
| Missing email | Không có field email | 400 |
| Missing password | Không có field password | 400 |
| Password too short | `password: '123'` (< 8 chars) | 400 |

#### Login Tests

| Test | Input | Expected |
|------|-------|----------|
| Missing idToken | `{}` | 400 |
| Empty idToken | `idToken: ''` | 400 |
| Invalid idToken | `idToken: 'invalid_token_string'` | 401 |

#### Profile Tests

| Test | Authorization Header | Expected |
|------|---------------------|----------|
| No auth header | None | 401 |
| Invalid bearer token | `Bearer invalid_token` | 401 |

#### Refresh Session Tests

| Test | Authorization Header | Expected |
|------|---------------------|----------|
| No auth header | None | 401 |
| Invalid bearer token | `Bearer invalid_token` | 401 |

#### Forgot Password Tests

| Test | Input | Expected |
|------|-------|----------|
| Invalid email format | `email: 'invalid-email'` | 400 |
| Missing email | `{}` | 400 |

#### Admin Endpoints Tests

| Endpoint | Test | Expected |
|----------|------|----------|
| `GET /users` | No authorization | 401 |
| `GET /users` | Invalid token | 401 |
| `PATCH /users/:id/role` | No authorization | 401 |
| `PATCH /users/:id/role` | Invalid role | 401 |
| `PATCH /users/:id/role` | Invalid user id (non-numeric) | 400 |

---

## Known Limitations

### Firebase Verification

Một số tests có thể fail nếu Firebase Admin SDK không thể verify tokens.

**Tests bị ảnh hưởng:**
- Tests với `invalid_token_string` - Firebase cố gắng verify và fail
- Tests yêu cầu valid Firebase token

**Giải pháp trong production:**
1. Sử dụng Firebase Emulator cho tests
2. Mock FirebaseAuthGuard hoàn toàn
3. Tạo test Firebase project riêng

### Rate Limiting

Rate limiting (`@nestjs/throttler`) được **disabled** trong tests:

```typescript
.overrideGuard(ThrottlerGuard)
.useValue({ canActivate: () => true })
```

Điều này cho phép chạy nhiều requests liên tiếp mà không bị block.

---

## Validation Rules

### RegisterDto

| Field | Validation | Rules |
|-------|------------|-------|
| `email` | `@IsEmail()` | Phải là email hợp lệ |
| `password` | `@IsString()`, `@MinLength(8)` | String, tối thiểu 8 ký tự |
| `name` | `@IsString()`, `@IsOptional()` | String, tùy chọn |

### LoginDto

| Field | Validation | Rules |
|-------|------------|-------|
| `idToken` | `@IsString()`, `@IsNotEmpty()` | String, không được empty |

### UpdateRoleDto

| Field | Validation | Rules |
|-------|------------|-------|
| `role` | `@IsEnum(Role)`, `@IsNotEmpty()` | Phải là USER, INSTRUCTOR, hoặc ADMIN |

---

## Test Coverage

### Đã bao quát ✅

- Input validation errors (400)
- Authentication errors (401)
- Route protection với guards
- DTO validation với class-validator
- ParseIntPipe validation (numeric params)

### Chưa bao quát ❌

- Successful registration (cần Firebase)
- Successful login (cần valid Firebase token)
- Successful profile retrieval (cần auth)
- Role update success (cần admin user)
- Authorization errors (403) - cần valid user với wrong role

---

## Mở rộng Tests

### Thêm test mới

1. Tạo test case trong `describe()` block phù hợp
2. Sử dụng `request(app.getHttpServer())` để gửi HTTP request
3. Chain `.send()` cho body, `.set()` cho headers
4. Chain `.expect()` cho expected status code

**Ví dụ:**

```typescript
it('should return 400 for invalid data', () => {
  return request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email: 'bad-email' })
    .expect(400);
});
```

### Mock Firebase cho full integration

Để test successful flows, cần mock Firebase:

```typescript
const moduleFixture = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(FirebaseService)
  .useValue({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com',
    }),
  })
  .compile();
```

---

## Troubleshooting

### "Firebase credentials not found"

Đảm bảo `.env` có cấu hình Firebase Admin SDK.

### Tests timeout

Tăng timeout trong `jest-e2e.json`:

```json
{
  "testTimeout": 30000
}
```

### Rate limiting errors (429)

Kiểm tra `ThrottlerGuard` đã được override trong `beforeAll()`.
