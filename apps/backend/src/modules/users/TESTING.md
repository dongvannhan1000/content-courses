# Users API Testing Guide

Manual test cases for testing Users API with Postman.

## Base URL
```
http://localhost:3000/api
```

## Prerequisites
- Server running: `npm run dev`
- Database seeded: `npm run db:seed`

---

## 1. GET /api/users/me (Authenticated)

**Purpose:** Get current user's full profile

### Test Case 1.1: Success
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/users/me` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Nguyen Van A",
  "photoURL": null,
  "bio": null,
  "role": "USER",
  "emailVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Test Case 1.2: Unauthorized
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/users/me` |
| Headers | None |
| Expected Status | 401 Unauthorized |

---

## 2. PATCH /api/users/me (Authenticated)

**Purpose:** Update current user's profile

### Test Case 2.1: Success - Update name and bio
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/users/me` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Request Body:**
```json
{
  "name": "Nguyen Van A Updated",
  "bio": "10 năm kinh nghiệm..."
}
```

### Test Case 2.2: Validation error - bio too long
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/users/me` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Body | `{"bio": "<1001 characters>"}` |
| Expected Status | 400 Bad Request |

---

## 3. GET /api/users (Admin only)

**Purpose:** List all users with pagination

### Test Case 3.1: Success - Admin
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/users?page=1&limit=10` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "users": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Test Case 3.2: Forbidden - Non-admin
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/users` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 403 Forbidden |

---

## 4. GET /api/users/:id (Public)

**Purpose:** Get public profile (for viewing instructor, etc.)

### Test Case 4.1: Success
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/users/1` |
| Headers | None |
| Expected Status | 200 OK |

**Response:**
```json
{
  "id": 1,
  "name": "Nguyen Van A",
  "photoURL": null,
  "bio": "Instructor bio...",
  "role": "INSTRUCTOR"
}
```

### Test Case 4.2: Not Found
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/users/99999` |
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
| GET /users/me | ❌ 401 | ✅ | ✅ |
| PATCH /users/me | ❌ 401 | ✅ | ✅ |
| GET /users | ❌ 401 | ❌ 403 | ✅ |
| GET /users/:id | ✅ | ✅ | ✅ |
