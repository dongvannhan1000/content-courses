# Payments API Testing Guide

Manual test cases for testing Payments API with Postman.

## Base URL
```
http://localhost:3000/api
```

## Prerequisites
- Server running: `npm run dev`
- Database seeded: `npm run db:seed`
- For mock mode, set env: `PAYOS_MOCK_MODE=true`

---

## 1. POST /api/payments/create (Create Payment)

**Purpose:** Create payment and get PayOS payment URL

### Test Case 1.1: Success
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/payments/create` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 201 Created |

**Request Body:**
```json
{
  "courseId": 1,
  "returnUrl": "http://localhost:3001/payment/success",
  "cancelUrl": "http://localhost:3001/payment/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "http://localhost:3000/api/payments/mock-pay/1234567890",
  "orderCode": 1234567890,
  "paymentId": 1,
  "enrollmentId": 1
}
```

### Test Case 1.2: Already Enrolled
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/payments/create` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Body | `{ "courseId": 1 }` (already enrolled course) |
| Expected Status | 409 Conflict |

### Test Case 1.3: Course Not Found
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/payments/create` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Body | `{ "courseId": 99999 }` |
| Expected Status | 404 Not Found |

### Test Case 1.4: Unpublished Course
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/payments/create` |
| Body | `{ "courseId": <DRAFT_COURSE_ID> }` |
| Expected Status | 403 Forbidden |

---

## 2. POST /api/payments/webhook (PayOS Webhook)

**Purpose:** Handle PayOS payment callback

### Test Case 2.1: Mock Successful Payment
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/payments/webhook` |
| Headers | `x-payos-signature: mock-signature` |
| Expected Status | 200 OK |

**Request Body:**
```json
{
  "code": "00",
  "desc": "success",
  "success": true,
  "data": {
    "orderCode": 1234567890,
    "amount": 599000,
    "description": "Thanh toán khóa học",
    "accountNumber": "mock",
    "reference": "mock-ref",
    "transactionDateTime": "2024-01-01T00:00:00.000Z",
    "currency": "VND",
    "paymentLinkId": "mock",
    "code": "00",
    "desc": "success",
    "counterAccountBankId": null,
    "counterAccountBankName": null,
    "counterAccountName": null,
    "counterAccountNumber": null,
    "virtualAccountName": null,
    "virtualAccountNumber": null
  },
  "signature": "mock-signature"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment completed"
}
```

### Test Case 2.2: Idempotency - Already Processed
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/payments/webhook` |
| Body | Same as 2.1 with already-completed orderCode |
| Expected Status | 200 OK |

**Response:**
```json
{
  "success": true,
  "message": "Already processed"
}
```

---

## 3. GET /api/payments/mock-pay/:orderCode (Mock Payment - DEV)

**Purpose:** Simulate successful payment (mock mode only)

### Test Case 3.1: Complete Mock Payment
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/payments/mock-pay/1234567890` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "success": true,
  "status": "COMPLETED",
  "message": "Mock payment completed",
  "paymentId": 1,
  "enrollmentId": 1,
  "course": { "id": 1, "title": "...", "slug": "...", "thumbnail": "..." }
}
```

---

## 4. GET /api/payments/verify/:orderCode (Verify Payment)

**Purpose:** Check payment status after return from PayOS

### Test Case 4.1: Successful Payment
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/payments/verify/1234567890` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "success": true,
  "status": "COMPLETED",
  "message": "Thanh toán thành công",
  "paymentId": 1,
  "enrollmentId": 1,
  "course": { ... }
}
```

### Test Case 4.2: Pending Payment
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/payments/verify/<PENDING_ORDER_CODE>` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "success": false,
  "status": "PENDING",
  "message": "Đang chờ thanh toán",
  ...
}
```

### Test Case 4.3: Not Your Payment
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/payments/verify/<OTHER_USER_ORDER>` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 403 Forbidden |

---

## 5. GET /api/payments/my-payments (Payment History)

**Purpose:** Get user's payment history

### Test Case 5.1: Success
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/payments/my-payments` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
[
  {
    "id": 1,
    "amount": 599000,
    "currency": "VND",
    "status": "COMPLETED",
    "method": "PAYOS",
    "transactionId": "1234567890",
    "course": { ... },
    "createdAt": "...",
    "paidAt": "..."
  }
]
```

---

## 6. GET /api/payments/admin (Admin - List All)

**Purpose:** Get all payments with pagination

### Test Case 6.1: Success - Admin
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/payments/admin?page=1&limit=10` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

### Test Case 6.2: With Filters
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/payments/admin?status=COMPLETED&userId=1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

### Test Case 6.3: Forbidden - Non-admin
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/payments/admin` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 403 Forbidden |

---

## 7. GET /api/payments/admin/:id (Admin - Get By ID)

### Test Case 7.1: Success
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/payments/admin/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

---

## 8. POST /api/payments/admin/:id/refund (Admin - Refund)

**Purpose:** Process refund for a payment

### Test Case 8.1: Success
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/payments/admin/1/refund` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "payment": { "status": "REFUNDED", ... }
}
```

### Test Case 8.2: Not Completed Payment
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/payments/admin/<PENDING_PAYMENT_ID>/refund` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 400 Bad Request |

---

## Complete Payment Flow Test

1. **Create Payment:**
   ```
   POST /payments/create { courseId: 1 }
   → Note orderCode and paymentUrl
   ```

2. **Mock Payment (dev mode):**
   ```
   GET /payments/mock-pay/:orderCode
   → Simulates PayOS webhook
   ```

3. **Verify Payment:**
   ```
   GET /payments/verify/:orderCode
   → Check payment completed
   ```

4. **Confirm Enrollment:**
   ```
   GET /enrollments/:courseId/check
   → enrolled: true, status: ACTIVE
   ```

---

## Environment Variables

```bash
# .env
PAYOS_MOCK_MODE=true      # Enable mock mode for testing
PAYOS_CLIENT_ID=          # PayOS client ID (production)
PAYOS_API_KEY=            # PayOS API key (production)
PAYOS_CHECKSUM_KEY=       # PayOS checksum key (production)
FRONTEND_URL=http://localhost:3001
```

## Postman Environment Variables

```json
{
  "baseUrl": "http://localhost:3000/api",
  "userToken": "<Firebase ID token from regular user>",
  "adminToken": "<Firebase ID token from admin user>"
}
```

## Access Control Summary

| Endpoint | No Auth | User | Admin |
|----------|---------|------|-------|
| POST /payments/create | ❌ 401 | ✅ | ✅ |
| POST /payments/webhook | ✅ (public) | ✅ | ✅ |
| GET /payments/verify/:code | ❌ 401 | ✅ (own) | ✅ |
| GET /payments/my-payments | ❌ 401 | ✅ | ✅ |
| GET /payments/mock-pay/:code | ✅ (dev) | ✅ | ✅ |
| GET /payments/admin | ❌ 401 | ❌ 403 | ✅ |
| GET /payments/admin/:id | ❌ 401 | ❌ 403 | ✅ |
| POST /payments/admin/:id/refund | ❌ 401 | ❌ 403 | ✅ |

## Security Checklist

- [x] Webhook signature verification
- [x] Idempotency for duplicate webhooks
- [x] Atomic transactions for status updates
- [x] Ownership verification for user endpoints
- [x] Admin-only access for sensitive operations
- [x] Mock mode disabled in production
