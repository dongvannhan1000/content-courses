# ⚙️ Backend Status

> **Framework:** NestJS 11.0.1  
> **ORM:** Prisma 7.1.0  
> **Database:** PostgreSQL  
> **Port:** 3001

---

## 📦 Modules Overview

| # | Module | Status | Tests | Description |
|---|--------|--------|-------|-------------|
| 1 | **Auth** | ✅ Complete | 46 | Firebase authentication, JWT, role-based access |
| 2 | **Users** | ✅ Complete | 15 | User CRUD, profile management |
| 3 | **Categories** | ✅ Complete | 37 | Category tree, slug-based routing |
| 4 | **Courses** | ✅ Complete | 48 | Course CRUD, search, filtering, admin approval |
| 5 | **Lessons** | ✅ Complete | 17 | Lesson management, ordering, access control |
| 6 | **Enrollments** | ✅ Complete | 47 | Enrollment lifecycle, progress tracking |
| 7 | **Payments** | ✅ Complete | 20 | PayOS integration, webhooks, refunds |
| 8 | **Cart** | ✅ Complete | 13 | Server-side cart, conflict detection |
| 9 | **Progress** | ✅ Complete | 11 | Video progress, completion tracking |
| 10 | **Media** | ✅ Complete | 15 | Video/document management, YouTube embed |

---

## 🔧 Module Details

### 1. Auth Module

**Files:** `src/modules/auth/`

| Feature | Status |
|---------|--------|
| Firebase token verification | ✅ |
| Auto-create user on first login | ✅ |
| Role-based guards (USER, INSTRUCTOR, ADMIN) | ✅ |
| Logging user actions | ✅ |

**Key Endpoints:**
- `POST /auth/login` - Login/register with Firebase token
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout

---

### 2. Users Module

**Files:** `src/modules/users/`

| Feature | Status |
|---------|--------|
| Profile update (name, bio, photo) | ✅ |
| Admin user management | ✅ |
| Role assignment | ✅ |

**Key Endpoints:**
- `GET /users` - List all users (Admin)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `PATCH /users/:id/role` - Change role (Admin)

---

### 3. Categories Module

**Files:** `src/modules/categories/`

| Feature | Status |
|---------|--------|
| Hierarchical categories (parent/child) | ✅ |
| Slug-based routing | ✅ |
| Order management | ✅ |
| Course count aggregation | ✅ |

**Key Endpoints:**
- `GET /categories` - List all categories
- `GET /categories/:slug` - Get by slug with courses
- `POST /categories` - Create (Admin)
- `PATCH /categories/:id` - Update (Admin)

---

### 4. Courses Module

**Files:** `src/modules/courses/`

| Feature | Status |
|---------|--------|
| Full CRUD operations | ✅ |
| Search & filtering | ✅ |
| Pagination | ✅ |
| Status workflow (DRAFT → PENDING → PUBLISHED) | ✅ |
| Instructor ownership check | ✅ |
| Admin approval | ✅ |

**Key Endpoints:**
- `GET /courses` - Search with filters
- `GET /courses/:slug` - Get course detail
- `POST /courses` - Create (Instructor)
- `PATCH /courses/:id` - Update (Owner)
- `POST /courses/:id/approve` - Approve (Admin)

---

### 5. Lessons Module

**Files:** `src/modules/lessons/`

| Feature | Status |
|---------|--------|
| Lesson CRUD | ✅ |
| Video & Document types | ✅ |
| Ordering & reorder | ✅ |
| Free preview support | ✅ |
| Enrollment access check | ✅ |

**Key Endpoints:**
- `GET /courses/:courseId/lessons` - Get course lessons
- `GET /lessons/:id` - Get lesson detail (enrolled only)
- `POST /courses/:courseId/lessons` - Create (Instructor)
- `PATCH /lessons/:id/reorder` - Reorder lessons

---

### 6. Enrollments Module

**Files:** `src/modules/enrollments/`

| Feature | Status |
|---------|--------|
| Enrollment creation via payment | ✅ |
| Progress calculation | ✅ |
| Completion tracking | ✅ |
| Refund handling | ✅ |

**Key Endpoints:**
- `GET /enrollments` - My enrollments
- `GET /enrollments/:id` - Enrollment detail
- `POST /enrollments` - Manual enroll (Admin)

---

### 7. Payments Module

**Files:** `src/modules/payments/`

| Feature | Status |
|---------|--------|
| PayOS integration | ✅ |
| Webhook handling | ✅ |
| Payment verification | ✅ |
| Refund processing | ✅ |
| Transaction logging | ✅ |

**Services:**
- `PaymentsService` - Main orchestrator
- `PayOSService` - PayOS API integration
- `PaymentMapperService` - DTO mapping

**Key Endpoints:**
- `POST /payments` - Create payment
- `POST /payments/webhook` - PayOS webhook
- `GET /payments/:orderCode/verify` - Verify payment
- `GET /payments` - List user payments

---

### 8. Cart Module

**Files:** `src/modules/cart/`

| Feature | Status |
|---------|--------|
| Server-side cart storage | ✅ |
| Add/Remove items | ✅ |
| Enrollment conflict detection | ✅ |
| Merge carts on login | ✅ |

**Key Endpoints:**
- `GET /cart` - Get user cart
- `POST /cart` - Add to cart
- `DELETE /cart/:courseId` - Remove item
- `DELETE /cart` - Clear cart

---

### 9. Progress Module

**Files:** `src/modules/progress/`

| Feature | Status |
|---------|--------|
| Lesson completion tracking | ✅ |
| Video watch position | ✅ |
| Course progress calculation | ✅ |
| Enrollment progress sync | ✅ |

**Key Endpoints:**
- `GET /progress/:lessonId` - Get lesson progress
- `PATCH /progress/:lessonId` - Update progress
- `POST /progress/:lessonId/complete` - Mark complete

---

### 10. Media Module

**Files:** `src/modules/media/`

| Feature | Status |
|---------|--------|
| Video upload support | ✅ |
| Document handling | ✅ |
| YouTube embed | ✅ |
| Duration tracking | ✅ |

**Key Endpoints:**
- `GET /lessons/:lessonId/media` - Get lesson media
- `POST /lessons/:lessonId/media` - Add media
- `DELETE /media/:id` - Remove media

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|----------------|
| **Rate Limiting** | @nestjs/throttler - 60 req/min |
| **CORS** | Configured for frontend origin |
| **Helmet** | HTTP security headers |
| **Validation** | class-validator + class-transformer |
| **Auth Guards** | Firebase token verification |
| **Role Guards** | Custom RolesGuard decorator |

---

## 📝 API Documentation

Swagger UI available at: `http://localhost:3001/api/docs`
