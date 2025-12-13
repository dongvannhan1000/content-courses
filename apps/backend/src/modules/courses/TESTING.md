# Courses API Testing Guide

Manual test cases for testing Courses API with Postman.

## Base URL
```
http://localhost:3000/api
```

## Prerequisites
- Server running: `npm run dev`
- Database seeded with test data: `npm run db:seed`
- For instructor endpoints: Valid Firebase ID token with INSTRUCTOR or ADMIN role
- For admin endpoints: Valid Firebase ID token with ADMIN role

---

## 1. GET /api/courses (Public)

**Purpose:** Get all published courses with filters and pagination

### Test Case 1.1: Success - Get all courses
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses` |
| Headers | None required |
| Expected Status | 200 OK |

**Expected Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Khóa học JavaScript",
      "slug": "khoa-hoc-javascript",
      "shortDesc": "...",
      "price": 599000,
      "instructor": { "id": 1, "name": "Instructor Name" },
      "category": { "id": 1, "name": "Lập trình", "slug": "lap-trinh" },
      "lessonCount": 10,
      "rating": 4.5
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Test Case 1.2: Filter by category
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses?category=javascript` |
| Expected Status | 200 OK |

### Test Case 1.3: Filter by level
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses?level=beginner` |
| Expected Status | 200 OK |

### Test Case 1.4: Filter by price range
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses?minPrice=0&maxPrice=500000` |
| Expected Status | 200 OK |

### Test Case 1.5: Search by keyword
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses?search=javascript` |
| Expected Status | 200 OK |

### Test Case 1.6: Pagination
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses?page=2&limit=5` |
| Expected Status | 200 OK |

### Test Case 1.7: Sort by price ascending
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses?sortBy=price&sortOrder=asc` |
| Expected Status | 200 OK |

---

## 2. GET /api/courses/featured (Public)

**Purpose:** Get featured courses for homepage

### Test Case 2.1: Success - Get featured courses
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/featured` |
| Expected Status | 200 OK |

### Test Case 2.2: Custom limit
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/featured?limit=3` |
| Expected Status | 200 OK |

---

## 3. GET /api/courses/:slug (Public)

**Purpose:** Get course detail for course page

### Test Case 3.1: Success - Get existing course
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/khoa-hoc-javascript` |
| Expected Status | 200 OK |

### Test Case 3.2: Not Found
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/non-existent-slug` |
| Expected Status | 404 Not Found |

---

## 4. GET /api/courses/my-courses (Instructor/Admin)

**Purpose:** Get courses created by current instructor

### Test Case 4.1: Success - Instructor gets own courses
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/my-courses` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 200 OK |

### Test Case 4.2: Unauthorized - No token
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/my-courses` |
| Expected Status | 401 Unauthorized |

### Test Case 4.3: Forbidden - Regular user
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/my-courses` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 403 Forbidden |

---

## 5. POST /api/courses (Instructor/Admin)

**Purpose:** Create new course

### Test Case 5.1: Success - Instructor creates course
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Content-Type | application/json |
| Expected Status | 201 Created |

**Request Body:**
```json
{
  "title": "Test Course",
  "slug": "test-course",
  "description": "This is a test course description",
  "shortDesc": "Short description",
  "price": 299000,
  "level": "beginner",
  "categoryId": 1
}
```

### Test Case 5.2: Unauthorized - No token
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses` |
| Expected Status | 401 Unauthorized |

### Test Case 5.3: Forbidden - Regular user
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 403 Forbidden |

### Test Case 5.4: Validation Error - Missing required fields
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Body | `{}` |
| Expected Status | 400 Bad Request |

### Test Case 5.5: Conflict - Duplicate slug
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Body | `{"title": "Test", "slug": "existing-slug", ...}` |
| Expected Status | 409 Conflict |

---

## 6. PUT /api/courses/:id (Owner/Admin)

**Purpose:** Update existing course

### Test Case 6.1: Success - Owner updates course
| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `{{baseUrl}}/courses/1` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 200 OK |

**Request Body:**
```json
{
  "title": "Updated Course Title",
  "description": "Updated description"
}
```

### Test Case 6.2: Forbidden - Not owner
| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `{{baseUrl}}/courses/1` |
| Headers | `Authorization: Bearer {{otherInstructorToken}}` |
| Expected Status | 403 Forbidden |

### Test Case 6.3: Success - Admin updates any course
| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `{{baseUrl}}/courses/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

### Test Case 6.4: Not Found
| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `{{baseUrl}}/courses/99999` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 404 Not Found |

---

## 7. PATCH /api/courses/:id/submit (Owner/Admin)

**Purpose:** Submit course for review (DRAFT → PENDING/PUBLISHED)

### Test Case 7.1: Success - Instructor submits course (DRAFT → PENDING)
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/courses/1/submit` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 200 OK |

**Expected:** Course status changes to `PENDING`

### Test Case 7.2: Success - Admin self-publishes (DRAFT → PUBLISHED)
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/courses/1/submit` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

**Expected:** Course status changes to `PUBLISHED`, `publishedAt` is set

### Test Case 7.3: Conflict - Course not in DRAFT status
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/courses/1/submit` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 409 Conflict |

---

## 8. PATCH /api/courses/:id/status (Admin only)

**Purpose:** Admin approve/reject course

### Test Case 8.1: Success - Admin approves course
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/courses/1/status` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Body | `{"status": "PUBLISHED"}` |
| Expected Status | 200 OK |

### Test Case 8.2: Success - Admin rejects course
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/courses/1/status` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Body | `{"status": "DRAFT"}` |
| Expected Status | 200 OK |

### Test Case 8.3: Forbidden - Instructor tries to approve
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/courses/1/status` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 403 Forbidden |

---

## 9. DELETE /api/courses/:id (Owner/Admin)

**Purpose:** Delete course

### Test Case 9.1: Success - Delete course without enrollments
| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `{{baseUrl}}/courses/10` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 204 No Content |

### Test Case 9.2: Conflict - Course has enrollments
| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `{{baseUrl}}/courses/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 409 Conflict |

**Expected Error:**
```json
{
  "message": "Cannot delete course with X enrollments. Archive the course instead."
}
```

### Test Case 9.3: Forbidden - Not owner
| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `{{baseUrl}}/courses/1` |
| Headers | `Authorization: Bearer {{otherInstructorToken}}` |
| Expected Status | 403 Forbidden |

---

## Postman Environment Variables

```json
{
  "baseUrl": "http://localhost:3000/api",
  "adminToken": "<Firebase ID token from admin user>",
  "instructorToken": "<Firebase ID token from instructor user>",
  "userToken": "<Firebase ID token from regular user>",
  "otherInstructorToken": "<Firebase ID token from different instructor>"
}
```

## How to Get Firebase ID Token

1. Login via frontend or use Firebase REST API
2. Get `idToken` from response
3. Use as Bearer token in Authorization header

## Status Flow

```
DRAFT → PENDING → PUBLISHED
        ↓
        DRAFT (rejected)
        
ADMIN can: DRAFT → PUBLISHED (skip PENDING)
```
