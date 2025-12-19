# Progress API Testing Guide

Manual test cases for testing Progress API with Postman.

## Base URL
```
http://localhost:3000/api
```

## Prerequisites
- Server running: `npm run dev`
- User enrolled in a course with published lessons
- Firebase token for authentication

---

## 1. POST /api/courses/:courseId/lessons/:lessonId/complete (Mark Lesson Complete)

**Purpose:** Mark a lesson as completed and update enrollment progress

### Test Case 1.1: Success - Mark Complete
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses/1/lessons/1/complete` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 201 Created |

**Response:**
```json
{
  "id": 1,
  "lessonId": 1,
  "isCompleted": true,
  "watchedSeconds": 0,
  "lastPosition": 0,
  "completedAt": "2024-12-19T00:00:00.000Z"
}
```

### Test Case 1.2: Already Complete (Idempotent)
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses/1/lessons/1/complete` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 201 Created |

**Note:** Calling again should succeed without errors.

### Test Case 1.3: Not Enrolled
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses/999/lessons/1/complete` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 403 Forbidden |

**Response:**
```json
{
  "statusCode": 403,
  "message": "You must be enrolled in this course to track progress"
}
```

### Test Case 1.4: Lesson Not Found
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses/1/lessons/99999/complete` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 404 Not Found |

### Test Case 1.5: Unauthorized
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/courses/1/lessons/1/complete` |
| Headers | None |
| Expected Status | 401 Unauthorized |

---

## 2. GET /api/courses/:courseId/progress (Course Progress Summary)

**Purpose:** Get overall course progress with per-lesson breakdown

### Test Case 2.1: Success
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/1/progress` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Response:**
```json
{
  "courseId": 1,
  "totalLessons": 5,
  "completedLessons": 2,
  "progressPercent": 40,
  "lessons": [
    { "id": 1, "title": "Giới thiệu", "order": 0, "isCompleted": true },
    { "id": 2, "title": "Bài 1", "order": 1, "isCompleted": true },
    { "id": 3, "title": "Bài 2", "order": 2, "isCompleted": false },
    { "id": 4, "title": "Bài 3", "order": 3, "isCompleted": false },
    { "id": 5, "title": "Kết luận", "order": 4, "isCompleted": false }
  ]
}
```

### Test Case 2.2: Not Enrolled
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/999/progress` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 403 Forbidden |

### Test Case 2.3: Unauthorized
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/1/progress` |
| Headers | None |
| Expected Status | 401 Unauthorized |

---

## 3. [Placeholder] GET /api/courses/:courseId/lessons/:lessonId/progress

**Purpose:** Get single lesson progress for video resume

### Test Case 3.1: Basic Test
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/courses/1/lessons/1/progress` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Note:** Placeholder endpoint - returns default or existing progress values.

---

## 4. [Placeholder] PATCH /api/courses/:courseId/lessons/:lessonId/progress

**Purpose:** Update watch position (for video resume)

### Test Case 4.1: Basic Test
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/courses/1/lessons/1/progress` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 200 OK |

**Request Body:**
```json
{
  "watchedSeconds": 120,
  "lastPosition": 115
}
```

**Note:** Placeholder endpoint - saves data but no video player integration yet.

---

## Verification: Enrollment Progress Auto-Update

After marking lessons complete, verify enrollment progress updates:

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check current enrollment | Note `progressPercent` |
| 2 | Complete 1 lesson | Call POST complete |
| 3 | Check enrollment again | `progressPercent` should increase |
| 4 | Complete all lessons | `progressPercent` = 100, `status` = COMPLETED |

---

## Postman Environment Variables

```json
{
  "baseUrl": "http://localhost:3000/api",
  "userToken": "<Firebase ID token from enrolled user>"
}
```

## Access Control Summary

| Endpoint | No Auth | Enrolled User | Not Enrolled |
|----------|---------|---------------|--------------|
| POST .../complete | ❌ 401 | ✅ 201 | ❌ 403 |
| GET .../progress (course) | ❌ 401 | ✅ 200 | ❌ 403 |
| GET .../progress (lesson) | ❌ 401 | ✅ 200 | ❌ 403 |
| PATCH .../progress (lesson) | ❌ 401 | ✅ 200 | ❌ 403 |
