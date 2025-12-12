# Categories API Testing Guide

Manual test cases for testing Categories API with Postman.

## Base URL
```
http://localhost:3000/api
```

## Prerequisites
- Server running: `npm run dev`
- Database seeded with test data: `npm run prisma:seed`
- For admin endpoints: Valid Firebase ID token with ADMIN role

---

## 1. GET /api/categories (Public)

**Purpose:** Get all categories in tree structure for navigation/sidebar

### Test Case 1.1: Success - Get all categories
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/categories` |
| Headers | None required |
| Expected Status | 200 OK |

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "Lập trình",
    "slug": "lap-trinh",
    "icon": "code",
    "courseCount": 5,
    "children": [
      {
        "id": 2,
        "name": "JavaScript",
        "slug": "javascript",
        "icon": "js",
        "courseCount": 3
      }
    ]
  }
]
```

---

## 2. GET /api/categories/:slug (Public)

**Purpose:** Get category detail for category page with breadcrumb

### Test Case 2.1: Success - Get existing category
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/categories/javascript` |
| Headers | None required |
| Expected Status | 200 OK |

### Test Case 2.2: Not Found
| Field | Value |
|-------|-------|
| Method | GET |
| URL | `{{baseUrl}}/categories/non-existent-slug` |
| Expected Status | 404 Not Found |

---

## 3. POST /api/categories (Admin Only)

**Purpose:** Create new category

### Test Case 3.1: Success - Create category
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/categories` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Content-Type | application/json |
| Expected Status | 201 Created |

**Request Body:**
```json
{
  "name": "Machine Learning",
  "slug": "machine-learning",
  "description": "Các khóa học về ML và AI",
  "icon": "brain",
  "order": 5
}
```

### Test Case 3.2: Unauthorized - No token
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/categories` |
| Headers | None |
| Expected Status | 401 Unauthorized |

### Test Case 3.3: Forbidden - Non-admin user
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/categories` |
| Headers | `Authorization: Bearer {{userToken}}` |
| Expected Status | 403 Forbidden |

### Test Case 3.4: Validation Error - Missing required fields
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/categories` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Body | `{}` |
| Expected Status | 400 Bad Request |

### Test Case 3.5: Conflict - Duplicate slug
| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{baseUrl}}/categories` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Body | `{"name": "Test", "slug": "javascript"}` |
| Expected Status | 409 Conflict |

---

## 4. PUT /api/categories/:id (Admin Only)

**Purpose:** Update existing category

### Test Case 4.1: Success - Update category
| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `{{baseUrl}}/categories/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 200 OK |

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Test Case 4.2: Not Found
| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `{{baseUrl}}/categories/99999` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 404 Not Found |

### Test Case 4.3: Soft Delete - Deactivate category
| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `{{baseUrl}}/categories/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Body | `{"isActive": false}` |
| Expected Status | 200 OK |

---

## 5. DELETE /api/categories/:id (Admin Only)

**Purpose:** Delete category (hard delete)

### Test Case 5.1: Success - Delete empty category
| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `{{baseUrl}}/categories/10` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 204 No Content |

### Test Case 5.2: Conflict - Category has courses
| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `{{baseUrl}}/categories/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 409 Conflict |

**Expected Error:**
```json
{
  "message": "Cannot delete category with X courses. Remove courses first or use soft delete."
}
```

### Test Case 5.3: Conflict - Category has children
| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `{{baseUrl}}/categories/1` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Expected Status | 409 Conflict |

---

## Postman Environment Variables

```json
{
  "baseUrl": "http://localhost:3000/api",
  "adminToken": "<Firebase ID token from admin user>",
  "userToken": "<Firebase ID token from regular user>"
}
```

## How to Get Firebase ID Token

1. Login via frontend or use Firebase REST API
2. Get `idToken` from response
3. Use as Bearer token in Authorization header
