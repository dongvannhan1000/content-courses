# Tài Liệu Tổng Hợp Test Cases

## Tổng Quan

| Phase | Loại Test | Số Tests |
|-------|-----------|----------|
| Phase 1 | Unit Tests Cơ Bản | 59 |
| Phase 2 | Unit Tests Phức Tạp | 104 |
| Phase 3 | Integration Tests | 106 |
| **Tổng** | | **269** |

---

## Phase 1: Unit Tests Cơ Bản

### 1. CategoriesService (18 tests)

| # | Test Case | Mục Đích |
|---|-----------|----------|
| 1 | should return all active categories | Trả về danh sách categories đang active |
| 2 | should return categories with course counts | Đếm số courses trong mỗi category |
| 3 | should return categories in tree structure | Trả về categories dạng cây (parent-child) |
| 4 | should return category by slug | Tìm category theo slug |
| 5 | should throw NotFoundException for invalid slug | Lỗi 404 khi slug không tồn tại |
| 6 | should create category successfully | Tạo category mới thành công |
| 7 | should throw ConflictException for duplicate slug | Lỗi 409 khi slug đã tồn tại |
| 8 | should update category successfully | Cập nhật category thành công |
| 9 | should throw NotFoundException when updating non-existent | Lỗi 404 khi cập nhật category không tồn tại |
| 10 | should throw ConflictException for duplicate slug on update | Lỗi 409 khi slug trùng khi cập nhật |
| 11 | should delete category successfully | Xóa category thành công |
| 12 | should throw NotFoundException when deleting non-existent | Lỗi 404 khi xóa category không tồn tại |
| 13-18 | Validation tests | Kiểm tra validation các field |

### 2. UsersService (15 tests)

| # | Test Case | Mục Đích |
|---|-----------|----------|
| 1 | should return all users | Trả về danh sách tất cả users |
| 2 | should return user by ID | Tìm user theo ID |
| 3 | should throw NotFoundException for invalid ID | Lỗi 404 khi ID không tồn tại |
| 4 | should return user by firebaseUid | Tìm user theo Firebase UID |
| 5 | should return user by email | Tìm user theo email |
| 6 | should create user successfully | Tạo user mới thành công |
| 7 | should update user profile | Cập nhật thông tin user |
| 8 | should update user role (admin only) | Admin thay đổi role của user |
| 9 | should delete user | Xóa user thành công |
| 10-15 | Permission & validation tests | Kiểm tra quyền và validation |

### 3. CoursesService (26 tests)

| # | Test Case | Mục Đích |
|---|-----------|----------|
| 1 | should return paginated courses | Trả về danh sách courses có phân trang |
| 2 | should filter courses by category | Lọc courses theo category |
| 3 | should filter courses by level | Lọc courses theo level |
| 4 | should filter courses by price range | Lọc courses theo khoảng giá |
| 5 | should search courses by keyword | Tìm kiếm courses theo từ khóa |
| 6 | should return course by slug | Tìm course theo slug |
| 7 | should throw NotFoundException for invalid slug | Lỗi 404 khi slug không tồn tại |
| 8 | should return featured courses | Trả về courses nổi bật |
| 9 | should return instructor's courses | Trả về courses của instructor |
| 10 | should create course for instructor | Instructor tạo course mới |
| 11 | should create course for admin | Admin tạo course mới |
| 12 | should throw ConflictException for duplicate slug | Lỗi 409 khi slug đã tồn tại |
| 13 | should update own course | Instructor cập nhật course của mình |
| 14 | should throw ForbiddenException for non-owner | Lỗi 403 khi không phải owner |
| 15 | should allow admin to update any course | Admin có thể cập nhật mọi course |
| 16 | should submit course for review | Submit course để xét duyệt |
| 17 | should publish course (admin) | Admin publish course |
| 18 | should delete own course | Xóa course của mình |
| 19 | should throw ForbiddenException on delete non-owner | Lỗi 403 khi xóa course không phải mình |
| 20-26 | Edge cases & validation | Các trường hợp đặc biệt |

---

## Phase 2: Unit Tests Phức Tạp

### 4. AuthService (22 tests)

| # | Test Case | Mục Đích |
|---|-----------|----------|
| 1 | should register new user successfully | Đăng ký user mới thành công |
| 2 | should throw ConflictException if email exists | Lỗi 409 khi email đã tồn tại |
| 3 | should login existing user | Đăng nhập user đã có trong DB |
| 4 | should create new user on first login | Tạo user mới khi đăng nhập lần đầu |
| 5 | should return user profile | Lấy thông tin profile |
| 6 | should update user profile | Cập nhật profile |
| 7 | should request password reset | Gửi yêu cầu reset password |
| 8 | should validate Firebase token | Xác thực token Firebase |
| 9 | should throw UnauthorizedException for invalid token | Lỗi 401 khi token không hợp lệ |
| 10-22 | Edge cases & role tests | Các trường hợp đặc biệt và kiểm tra role |

### 5. EnrollmentsService (26 tests)

| # | Test Case | Mục Đích |
|---|-----------|----------|
| 1 | should return user enrollments | Trả về danh sách enrollments của user |
| 2 | should check enrollment status | Kiểm tra user đã enroll course chưa |
| 3 | should create enrollment successfully | Tạo enrollment mới |
| 4 | should throw ConflictException if already enrolled | Lỗi 409 nếu đã enroll |
| 5 | should throw NotFoundException for invalid course | Lỗi 404 nếu course không tồn tại |
| 6 | should update progress percentage | Cập nhật tiến độ học |
| 7 | should throw ForbiddenException for non-owner | Lỗi 403 khi cập nhật enrollment người khác |
| 8 | should mark enrollment as complete | Đánh dấu hoàn thành khóa học |
| 9 | should return all enrollments (admin) | Admin xem tất cả enrollments |
| 10 | should return enrollment by ID (admin) | Admin xem enrollment theo ID |
| 11 | should update enrollment (admin) | Admin cập nhật enrollment |
| 12 | should delete enrollment (admin) | Admin xóa enrollment |
| 13-26 | Pagination, filtering, edge cases | Phân trang, lọc và các edge cases |

### 6. CartService (13 tests)

| # | Test Case | Mục Đích |
|---|-----------|----------|
| 1 | should return user cart items | Trả về các items trong cart của user |
| 2 | should add course to cart | Thêm course vào cart |
| 3 | should throw ConflictException if course in cart | Lỗi 409 nếu course đã có trong cart |
| 4 | should throw ConflictException if already enrolled | Lỗi 409 nếu đã enroll course |
| 5 | should throw NotFoundException for invalid course | Lỗi 404 nếu course không tồn tại |
| 6 | should remove course from cart | Xóa course khỏi cart |
| 7 | should clear all cart items | Xóa toàn bộ cart |
| 8 | should return cart count | Trả về số lượng items trong cart |
| 9 | should merge guest cart on login | Merge cart khi user login |
| 10-13 | Edge cases | Các trường hợp đặc biệt |

### 7. ProgressService (11 tests)

| # | Test Case | Mục Đích |
|---|-----------|----------|
| 1 | should return user progress for course | Trả về tiến độ học của user trong course |
| 2 | should update lesson progress | Cập nhật tiến độ lesson |
| 3 | should mark lesson as completed | Đánh dấu lesson đã hoàn thành |
| 4 | should calculate course progress percentage | Tính % tiến độ course |
| 5 | should throw ForbiddenException if not enrolled | Lỗi 403 nếu chưa enroll |
| 6-11 | Edge cases & validation | Các edge cases |

### 8. LessonsService (17 tests)

| # | Test Case | Mục Đích |
|---|-----------|----------|
| 1 | should return lessons by course | Trả về lessons của course |
| 2 | should return lesson by slug | Tìm lesson theo slug |
| 3 | should return free lessons for unauthenticated | Trả về free lessons cho guest |
| 4 | should return all lessons for enrolled users | Trả về tất cả lessons cho enrolled user |
| 5 | should create lesson (instructor) | Instructor tạo lesson |
| 6 | should throw ForbiddenException for non-owner | Lỗi 403 nếu không phải owner |
| 7 | should update lesson (instructor) | Cập nhật lesson |
| 8 | should delete lesson (instructor) | Xóa lesson |
| 9 | should reorder lessons | Sắp xếp lại thứ tự lessons |
| 10-17 | Edge cases & access control | Access control và edge cases |

### 9. MediaService (15 tests)

| # | Test Case | Mục Đích |
|---|-----------|----------|
| 1 | should return media by lesson | Trả về media của lesson |
| 2 | should create media (instructor) | Tạo media mới |
| 3 | should update media (instructor) | Cập nhật media |
| 4 | should delete media (instructor) | Xóa media |
| 5 | should throw ForbiddenException for non-owner | Lỗi 403 nếu không phải owner |
| 6 | should throw NotFoundException for invalid media | Lỗi 404 nếu media không tồn tại |
| 7-15 | Edge cases & validation | Các edge cases |

---

## Phase 3: Integration Tests

### 10. AuthController (24 tests)

| Endpoint | Test Case | Mục Đích |
|----------|-----------|----------|
| POST /auth/register | should register new user | Đăng ký user mới |
| POST /auth/register | should return 409 for existing email | Lỗi khi email đã tồn tại |
| POST /auth/register | should return 400 for invalid data | Lỗi validation |
| POST /auth/login | should login user | Đăng nhập thành công |
| POST /auth/login | should create user on first login | Tạo user khi login lần đầu |
| POST /auth/login | should return 401 for invalid token | Token không hợp lệ |
| GET /auth/profile | should return user profile | Lấy thông tin profile |
| GET /auth/profile | should return 401 for unauthenticated | Chưa đăng nhập |
| PUT /auth/profile | should update profile | Cập nhật profile |
| PUT /auth/profile | should return 401 for unauthenticated | Chưa đăng nhập |
| POST /auth/password-reset | should request password reset | Gửi yêu cầu reset password |
| GET /auth/users | should return all users (admin) | Admin xem tất cả users |
| GET /auth/users | should return 403 for non-admin | Non-admin bị chặn |
| PUT /auth/users/:id/role | should update user role (admin) | Admin thay đổi role |
| PUT /auth/users/:id/role | should return 403 for non-admin | Non-admin bị chặn |
| ... | Additional edge cases | Các edge cases khác |

### 11. CategoriesController (19 tests)

| Endpoint | Test Case | Mục Đích |
|----------|-----------|----------|
| GET /categories | should return all categories | Trả về danh sách categories |
| GET /categories | should return categories with course counts | Đếm courses theo category |
| GET /categories | should be public | Endpoint public |
| GET /categories/:slug | should return category by slug | Tìm theo slug |
| GET /categories/:slug | should return 404 for invalid slug | Slug không tồn tại |
| POST /categories | should create category (admin) | Admin tạo category |
| POST /categories | should return 403 for non-admin | Non-admin bị chặn |
| POST /categories | should return 401 for unauthenticated | Chưa đăng nhập |
| POST /categories | should return 409 for duplicate slug | Slug trùng |
| POST /categories | should return 400 for missing fields | Thiếu field bắt buộc |
| PUT /categories/:id | should update category (admin) | Admin cập nhật |
| PUT /categories/:id | should return 404 for non-existent | Category không tồn tại |
| PUT /categories/:id | should return 403 for non-admin | Non-admin bị chặn |
| PUT /categories/:id | should return 409 for duplicate slug | Slug trùng khi update |
| DELETE /categories/:id | should delete category (admin) | Admin xóa category |
| DELETE /categories/:id | should return 404 for non-existent | Category không tồn tại |
| DELETE /categories/:id | should return 403 for non-admin | Non-admin bị chặn |
| DELETE /categories/:id | should return 401 for unauthenticated | Chưa đăng nhập |

### 12. CoursesController (22 tests)

| Endpoint | Test Case | Mục Đích |
|----------|-----------|----------|
| GET /courses | should return paginated courses | Phân trang courses |
| GET /courses | should be public | Endpoint public |
| GET /courses | should filter by category | Lọc theo category |
| GET /courses/featured | should return featured courses | Courses nổi bật |
| GET /courses/my-courses | should return instructor courses | Courses của instructor |
| GET /courses/my-courses | should return 401 for unauthenticated | Chưa đăng nhập |
| GET /courses/:slug | should return course by slug | Tìm theo slug |
| GET /courses/:slug | should return 404 for invalid slug | Slug không tồn tại |
| POST /courses | should create course (instructor) | Instructor tạo course |
| POST /courses | should create course (admin) | Admin tạo course |
| POST /courses | should return 403 for regular user | User thường bị chặn |
| POST /courses | should return 401 for unauthenticated | Chưa đăng nhập |
| PUT /courses/:id | should update own course | Update course của mình |
| PUT /courses/:id | should return 403 for non-owner | Không phải owner |
| PUT /courses/:id | should allow admin to update any | Admin update mọi course |
| PUT /courses/:id | should return 404 for non-existent | Course không tồn tại |
| PATCH /courses/:id/status | should update status (admin) | Admin thay đổi status |
| PATCH /courses/:id/status | should return 403 for non-admin | Non-admin bị chặn |
| DELETE /courses/:id | should delete own course | Xóa course của mình |
| DELETE /courses/:id | should return 403 for non-owner | Không phải owner |
| DELETE /courses/:id | should return 404 for non-existent | Course không tồn tại |
| DELETE /courses/:id | should return 401 for unauthenticated | Chưa đăng nhập |

### 13. EnrollmentsController (21 tests)

| Endpoint | Test Case | Mục Đích |
|----------|-----------|----------|
| GET /enrollments | should return user enrollments | Courses đã enroll |
| GET /enrollments | should return 401 for unauthenticated | Chưa đăng nhập |
| GET /enrollments/:courseId/check | should return enrollment status | Kiểm tra đã enroll chưa |
| GET /enrollments/:courseId/check | should return not enrolled | Chưa enroll |
| GET /enrollments/:courseId/check | should return 401 for unauthenticated | Chưa đăng nhập |
| POST /enrollments | should enroll in free course | Enroll khóa miễn phí |
| POST /enrollments | should return 409 if already enrolled | Đã enroll rồi |
| POST /enrollments | should return 401 for unauthenticated | Chưa đăng nhập |
| PATCH /enrollments/:id/progress | should update progress | Cập nhật tiến độ |
| PATCH /enrollments/:id/progress | should return 403 for non-owner | Không phải enrollment của mình |
| POST /enrollments/:id/complete | should mark complete | Đánh dấu hoàn thành |
| POST /enrollments/:id/complete | should return 403 for non-owner | Không phải enrollment của mình |
| GET /enrollments/admin | should return all (admin) | Admin xem tất cả |
| GET /enrollments/admin | should return 403 for non-admin | Non-admin bị chặn |
| GET /enrollments/admin/:id | should return by ID (admin) | Admin xem theo ID |
| GET /enrollments/admin/:id | should return 404 for non-existent | Enrollment không tồn tại |
| PATCH /enrollments/admin/:id | should update (admin) | Admin cập nhật |
| PATCH /enrollments/admin/:id | should return 403 for non-admin | Non-admin bị chặn |
| DELETE /enrollments/admin/:id | should delete (admin) | Admin xóa |
| DELETE /enrollments/admin/:id | should return 403 for non-admin | Non-admin bị chặn |
| DELETE /enrollments/admin/:id | should return 404 for non-existent | Enrollment không tồn tại |

### 14. PaymentsController (20 tests)

| Endpoint | Test Case | Mục Đích |
|----------|-----------|----------|
| POST /payments/create | should create payment | Tạo payment cho course |
| POST /payments/create | should return 401 for unauthenticated | Chưa đăng nhập |
| POST /payments/create | should return 404 for invalid course | Course không tồn tại |
| POST /payments/create-batch | should create batch payment | Tạo payment cho nhiều courses |
| POST /payments/create-batch | should return 401 for unauthenticated | Chưa đăng nhập |
| POST /payments/webhook | should be public | Webhook public |
| GET /payments/verify/:orderCode | should return 401 for unauthenticated | Chưa đăng nhập |
| GET /payments/verify/:orderCode | should return 404 for invalid order | Order không tồn tại |
| GET /payments/my-payments | should return payment history | Lịch sử thanh toán |
| GET /payments/my-payments | should return 401 for unauthenticated | Chưa đăng nhập |
| GET /payments/mock-pay/:orderCode | should be public | Mock endpoint public |
| GET /payments/admin | should return all (admin) | Admin xem tất cả |
| GET /payments/admin | should return 403 for non-admin | Non-admin bị chặn |
| GET /payments/admin | should return 401 for unauthenticated | Chưa đăng nhập |
| GET /payments/admin/:id | should return by ID (admin) | Admin xem theo ID |
| GET /payments/admin/:id | should return 404 for non-existent | Payment không tồn tại |
| GET /payments/admin/:id | should return 403 for non-admin | Non-admin bị chặn |
| POST /payments/admin/:id/refund | should return 404 for non-existent | Payment không tồn tại |
| POST /payments/admin/:id/refund | should return 403 for non-admin | Non-admin bị chặn |
| POST /payments/admin/:id/refund | should return 401 for unauthenticated | Chưa đăng nhập |

---

## Cách Chạy Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Tất cả tests
npm run test

# Với coverage
npm run test:cov
```
