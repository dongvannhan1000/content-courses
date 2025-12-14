 n# Media API Testing Guide

Manual test cases for testing Media API with Postman.

## Base URL
```
http://localhost:3000/api
```

## Prerequisites
- Server running: `npm run dev`
- Database seeded: `npm run db:seed`
- Lesson ID to test with (e.g., `lessonId = 1`)

---

## Upload Flow (Direct Upload)

### Step 1: Get Presigned URL

**POST** `/lessons/:lessonId/media/presigned-url`

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/lessons/1/media/presigned-url` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 201 Created |

**Request Body:**
```json
{
  "filename": "video-bai-1.mp4",
  "type": "VIDEO"
}
```

**Response:**
```json
{
  "uploadUrl": "https://storage.bunnycdn.com/...",
  "key": "lesson-1/abc123.mp4",
  "publicUrl": "https://cdn.example.bunny.net/lesson-1/abc123.mp4"
}
```

### Step 2: Upload to Storage

Upload file directly to `uploadUrl` (done by frontend, not via backend).

### Step 3: Create Media Record

**POST** `/lessons/:lessonId/media`

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/lessons/1/media` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 201 Created |

**Request Body:**
```json
{
  "type": "VIDEO",
  "key": "lesson-1/abc123.mp4",
  "title": "Video bài giảng",
  "filename": "video-bai-1.mp4",
  "mimeType": "video/mp4",
  "size": 10485760,
  "duration": 600
}
```

---

## 1. GET /api/lessons/:lessonId/media (Public)

**Purpose:** Get media list for a lesson

### Test Case 1.1: Success - Get media (no auth)
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/lessons/1/media` |
| Headers | None |
| Expected Status | 200 OK |

### Test Case 1.2: Not Found - Invalid lesson
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/lessons/99999/media` |
| Expected Status | 404 Not Found |

---

## 2. PUT /api/lessons/:lessonId/media/:id (Owner)

**Purpose:** Update media metadata

### Test Case 2.1: Success - Update title
| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `{{baseUrl}}/lessons/1/media/1` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Body | `{"title": "Updated Title"}` |
| Expected Status | 200 OK |

### Test Case 2.2: Forbidden - Not owner
| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `{{baseUrl}}/lessons/1/media/1` |
| Headers | `Authorization: Bearer {{otherInstructorToken}}` |
| Expected Status | 403 Forbidden |

---

## 3. DELETE /api/lessons/:lessonId/media/:id (Owner)

**Purpose:** Delete media

### Test Case 3.1: Success - Delete media
| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `{{baseUrl}}/lessons/1/media/10` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 204 No Content |

---

## 4. PATCH /api/lessons/:lessonId/media/reorder (Owner)

**Purpose:** Reorder media (drag-drop)

### Test Case 4.1: Success - Reorder media
| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `{{baseUrl}}/lessons/1/media/reorder` |
| Headers | `Authorization: Bearer {{instructorToken}}` |
| Expected Status | 200 OK |

**Request Body:**
```json
{
  "mediaIds": [3, 1, 2]
}
```

---

## 5. GET /api/media/:id (Public)

**Purpose:** Get single media

### Test Case 5.1: Success
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/media/1` |
| Expected Status | 200 OK |

---

## 6. GET /api/media/:id/signed-url (Varies)

**Purpose:** Get signed URL for private content

### Test Case 6.1: Free lesson - anyone can get
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/media/1/signed-url` |
| Expected Status | 200 OK (if lesson is free) |

### Test Case 6.2: Paid lesson - forbidden without enrollment
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/media/2/signed-url` |
| Headers | `Authorization: Bearer {{userToken}}` (not enrolled) |
| Expected Status | 403 Forbidden |

### Test Case 6.3: Paid lesson - enrolled user can get
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/media/2/signed-url` |
| Headers | `Authorization: Bearer {{enrolledUserToken}}` |
| Expected Status | 200 OK |

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

| Action | No Auth | User (not enrolled) | Enrolled User | Owner/Admin |
|--------|---------|---------------------|---------------|-------------|
| GET /lessons/:id/media | ✅ (published) | ✅ (published) | ✅ | ✅ All |
| POST presigned-url | ❌ | ❌ | ❌ | ✅ |
| POST create media | ❌ | ❌ | ❌ | ✅ |
| PUT update media | ❌ | ❌ | ❌ | ✅ |
| DELETE media | ❌ | ❌ | ❌ | ✅ |
| PATCH reorder | ❌ | ❌ | ❌ | ✅ |
| GET signed-url (free) | ✅ | ✅ | ✅ | ✅ |
| GET signed-url (paid) | ❌ | ❌ | ✅ | ✅ |
