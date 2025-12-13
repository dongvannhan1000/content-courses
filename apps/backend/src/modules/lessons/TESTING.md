# Lessons API Testing Guide

Manual test cases for testing Lessons API with Postman.

## Base URL
```
http://localhost:3000/api
```

## Prerequisites
- Server running: `npm run dev`
- Database seeded: `npm run db:seed`
- Course ID to test with (e.g., `courseId = 1`)

---

## 1. GET /api/courses/:courseId/lessons (Public)

**Purpose:** Get lessons list for course detail page

### Test Case 1.1: Success - Get published lessons (no auth)
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/1/lessons` |
| Headers | None |
| Expected Status | 200 OK |

### Test Case 1.2: Course owner sees all lessons (including unpublished)
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/1/lessons` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 200 OK |

### Test Case 1.3: Not Found - Invalid course
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/99999/lessons` |
| Expected Status | 404 Not Found |

---

## 2. GET /api/courses/:courseId/lessons/:slug (Varies)

**Purpose:** Get lesson content

### Test Case 2.1: Free lesson - anyone can view
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/1/lessons/gioi-thieu` |
| Headers | None |
| Expected Status | 200 OK (if `isFree = true`) |

### Test Case 2.2: Paid lesson - forbidden without enrollment
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/1/lessons/bai-2-paid` |
| Headers | `Authorization: Bearer {{userToken}}` (not enrolled) |
| Expected Status | 403 Forbidden |

### Test Case 2.3: Paid lesson - enrolled user can view
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/1/lessons/bai-2-paid` |
| Headers | `Authorization: Bearer {{enrolledUserToken}}` |
| Expected Status | 200 OK |

### Test Case 2.4: Course owner can view any lesson
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/1/lessons/bai-2-paid` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 200 OK |

---

## 3. POST /api/courses/:courseId/lessons (Owner)

**Purpose:** Create new lesson

### Test Case 3.1: Success - Owner creates lesson
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses/1/lessons` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 201 Created |

**Request Body:**
```json
{
  "title": "Bài mới",
  "slug": "bai-moi",
  "description": "Mô tả bài học",
  "type": "VIDEO",
  "isFree": true
}
```

### Test Case 3.2: Forbidden - Not course owner
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses/1/lessons` |
| Headers | `Authorization: Bearer {{otherInstructorToken}}` |
| Expected Status | 403 Forbidden |

### Test Case 3.3: Conflict - Duplicate slug
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses/1/lessons` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Body | `{"title": "Test", "slug": "existing-slug"}` |
| Expected Status | 409 Conflict |

---

## 4. PUT /api/courses/:courseId/lessons/:id (Owner)

**Purpose:** Update lesson

### Test Case 4.1: Success - Update lesson
| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `{{baseUrl}}/courses/1/lessons/1` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Body | `{"title": "Updated Title", "isPublished": true}` |
| Expected Status | 200 OK |

---

## 5. DELETE /api/courses/:courseId/lessons/:id (Owner)

**Purpose:** Delete lesson

### Test Case 5.1: Success - Delete lesson
| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `{{baseUrl}}/courses/1/lessons/10` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 204 No Content |

---

## 6. PATCH /api/courses/:courseId/lessons/reorder (Owner)

**Purpose:** Reorder lessons (drag-drop)

### Test Case 6.1: Success - Reorder lessons
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/courses/1/lessons/reorder` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 200 OK |

**Request Body:**
```json
{
  "lessonIds": [3, 1, 2, 4]
}
```

---

## Postman Environment Variables

```json
{
  "baseUrl": "http://localhost:3000/api",
  "instructorToken": "<Firebase ID token from course owner>",
  "otherInstructorToken": "<Firebase ID token from different instructor>",
  "userToken": "<Firebase ID token from regular user (not enrolled)>",
  "enrolledUserToken": "<Firebase ID token from user enrolled in course>"
}
```

## Access Control Summary

| Lesson Type | No Auth | User (not enrolled) | Enrolled User | Owner/Admin |
|-------------|---------|---------------------|---------------|-------------|
| Free + Published | ✅ View | ✅ View | ✅ View | ✅ View |
| Paid + Published | ❌ 403 | ❌ 403 | ✅ View | ✅ View |
| Unpublished | ❌ 404 | ❌ 404 | ❌ 404 | ✅ View |
