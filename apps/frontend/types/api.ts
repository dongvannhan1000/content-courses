// ============ Enums ============

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
export type UserRole = "USER" | "INSTRUCTOR" | "ADMIN";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

// ============ Reference Types ============

export interface InstructorRef {
    id: number;
    name: string;
    photoURL?: string;
    bio?: string;
}

export interface CategoryRef {
    id: number;
    name: string;
    slug: string;
}

// ============ Course Types ============

export interface CourseListItem {
    id: number;
    title: string;
    slug: string;
    shortDesc?: string;
    thumbnail?: string;
    price: number;
    discountPrice?: number;
    level?: CourseLevel;
    duration: number; // seconds
    status: CourseStatus;
    publishedAt?: string;
    instructor: InstructorRef;
    category?: CategoryRef;
    lessonCount: number;
    enrollmentCount: number;
    reviewCount: number;
    rating?: number;
}

export interface LessonSummary {
    id: number;
    title: string;
    slug: string;
    order: number;
    duration: number; // seconds
    isFree: boolean;
}

export interface CourseDetail extends CourseListItem {
    description: string;
    lessons: LessonSummary[];
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedCourses {
    data: CourseListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============ Category Types ============

export interface CategoryTreeItem {
    id: number;
    name: string;
    slug: string;
    icon?: string;
    courseCount: number;
    children?: CategoryTreeItem[];
}

// ============ User Types ============

export interface User {
    id: number;
    email: string;
    name?: string;
    photoURL?: string;
    bio?: string;
    role: UserRole;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

// ============ Enrollment Types ============

export interface CourseRef {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string;
    instructor: InstructorRef;
}

export interface EnrollmentListItem {
    id: number;
    status: EnrollmentStatus;
    progressPercent: number;
    enrolledAt: string;
    course: CourseRef;
}

export interface EnrollmentCheck {
    enrolled: boolean;
    status?: EnrollmentStatus;
    progressPercent?: number;
    enrollmentId?: number;
}

// ============ API Response Types ============

export interface ApiError {
    message: string;
    statusCode: number;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============ Query Filters ============

export interface CourseFilters {
    search?: string;
    categoryId?: number;
    categorySlug?: string;
    level?: CourseLevel;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    instructorId?: number;
    status?: CourseStatus;
    page?: number;
    limit?: number;
    sortBy?: "newest" | "popular" | "rating" | "price_asc" | "price_desc";
}
