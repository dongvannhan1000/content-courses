# Enrollments API Testing Guide

Manual test cases for testing Enrollments API with Postman.

## Base URL
```
http://localhost:3000/api
```

## Prerequisites
- Server running: `npm run dev`
- Database seeded: `npm run db:seed`

---

## 1. GET /api/enrollments (User - My Enrollments)

**Purpose:** Get current user's enrolled courses

### Test Case 1.1: Success
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/enrollments` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
[
  {
    "id": 1,
    "status": "ACTIVE",
    "progressPercent": 25,
    "enrolledAt": "2024-01-01T00:00:00.000Z",
    "course": {
      "id": 1,
      "title": "Khóa học React",
      "slug": "khoa-hoc-react",
      "thumbnail": "https://...",
      "instructor": { "id": 1, "name": "Nguyen Van A" }
    }
  }
]
```

### Test Case 1.2: Unauthorized
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/enrollments` |
| Headers | None |
| Expected Status | 401 Unauthorized |

---

## 2. GET /api/enrollments/:courseId/check (Check Enrollment)

**Purpose:** Check if user is enrolled in a course

### Test Case 2.1: Enrolled
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/enrollments/1/check` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "enrolled": true,
  "status": "ACTIVE",
  "progressPercent": 25,
  "enrollmentId": 1
}
```

### Test Case 2.2: Not Enrolled
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/enrollments/999/check` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "enrolled": false
}
```

---

## 3. POST /api/enrollments (Enroll in Course)

**Purpose:** Enroll user in a course

### Test Case 3.1: Success
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/enrollments` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 201 Created |

**Request Body:**
```json
{
  "courseId": 2
}
```

### Test Case 3.2: Already Enrolled
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/enrollments` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Body | `{ "courseId": 1 }` |
| Expected Status | 409 Conflict |

### Test Case 3.3: Course Not Found
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/enrollments` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Body | `{ "courseId": 99999 }` |
| Expected Status | 404 Not Found |

---

## 4. PATCH /api/enrollments/:id/progress (Update Progress)

**Purpose:** Update learning progress

### Test Case 4.1: Success
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/enrollments/1/progress` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Request Body:**
```json
{
  "progressPercent": 50
}
```

### Test Case 4.2: Not Your Enrollment
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/enrollments/999/progress` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Body | `{ "progressPercent": 50 }` |
| Expected Status | 403 Forbidden |

### Test Case 4.3: Validation Error
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/enrollments/1/progress` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Body | `{ "progressPercent": 150 }` |
| Expected Status | 400 Bad Request |

---

## 5. POST /api/enrollments/:id/complete (Mark Complete)

**Purpose:** Mark course as completed

### Test Case 5.1: Success
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/enrollments/1/complete` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "id": 1,
  "status": "COMPLETED",
  "progressPercent": 100,
  "completedAt": "2024-01-15T00:00:00.000Z",
  ...
}
```

---

## 6. GET /api/enrollments/admin (Admin - List All)

**Purpose:** Get all enrollments with pagination

### Test Case 6.1: Success - Admin
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/enrollments/admin?page=1&limit=10` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "enrollments": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Test Case 6.2: With Filters
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/enrollments/admin?status=ACTIVE&courseId=1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

### Test Case 6.3: Forbidden - Non-admin
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/enrollments/admin` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 403 Forbidden |

---

## 7. GET /api/enrollments/admin/:id (Admin - Get By ID)

### Test Case 7.1: Success
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/enrollments/admin/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

### Test Case 7.2: Not Found
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/enrollments/admin/99999` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 404 Not Found |

---

## 8. PATCH /api/enrollments/admin/:id (Admin - Update)

**Purpose:** Update enrollment status or expiry

### Test Case 8.1: Update Status
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/enrollments/admin/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

**Request Body:**
```json
{
  "status": "EXPIRED"
}
```

### Test Case 8.2: Extend Expiry
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/enrollments/admin/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

**Request Body:**
```json
{
  "expiresAt": "2025-12-31T00:00:00.000Z"
}
```

---

## 9. DELETE /api/enrollments/admin/:id (Admin - Delete)

### Test Case 9.1: Success
| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `{{baseUrl}}/enrollments/admin/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 204 No Content |

### Test Case 9.2: Not Found
| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `{{baseUrl}}/enrollments/admin/99999` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 404 Not Found |

---

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
| GET /enrollments | ❌ 401 | ✅ | ✅ |
| GET /enrollments/:courseId/check | ❌ 401 | ✅ | ✅ |
| POST /enrollments | ❌ 401 | ✅ | ✅ |
| PATCH /enrollments/:id/progress | ❌ 401 | ✅ (own) | ✅ |
| POST /enrollments/:id/complete | ❌ 401 | ✅ (own) | ✅ |
| GET /enrollments/admin | ❌ 401 | ❌ 403 | ✅ |
| GET /enrollments/admin/:id | ❌ 401 | ❌ 403 | ✅ |
| PATCH /enrollments/admin/:id | ❌ 401 | ❌ 403 | ✅ |
| DELETE /enrollments/admin/:id | ❌ 401 | ❌ 403 | ✅ |
