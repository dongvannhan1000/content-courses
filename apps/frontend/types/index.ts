// ============ Common Types ============

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============ User Types ============

export type Role = 'USER' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
    id: number;
    email: string;
    name?: string;
    photoURL?: string;
    bio?: string;
    role: Role;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PublicUser {
    id: number;
    name?: string;
    photoURL?: string;
    bio?: string;
    role: Role;
}

// ============ Category Types ============

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    courseCount: number;
    children?: Category[];
}

export interface CategoryRef {
    id: number;
    name: string;
    slug: string;
}

// ============ Instructor Reference ============

export interface InstructorRef {
    id: number;
    name: string;
    photoURL?: string;
    bio?: string;
}

// ============ Course Types ============

export type CourseStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

// DTOs for Course CRUD
export interface CreateCourseDto {
    title: string;
    slug?: string; // Optional - auto-generated from title if not provided
    description: string;
    shortDesc?: string;
    thumbnail?: string;
    price: number;
    discountPrice?: number;
    level?: CourseLevel;
    categoryId?: number;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> { }

export interface CourseDto {
    id: number;
    title: string;
    slug: string;
    description: string;
    shortDesc?: string;
    thumbnail?: string;
    price: number;
    discountPrice?: number;
    level?: string;
    status: CourseStatus;
    categoryId?: number;
    instructorId: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CourseListItem {
    id: number;
    title: string;
    slug: string;
    shortDesc?: string;
    thumbnail?: string;
    price: number;
    discountPrice?: number;
    level?: CourseLevel;
    duration: number; // in seconds
    status: CourseStatus;
    publishedAt?: Date;
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
    duration: number;
    isFree: boolean;
}

export interface CourseDetail extends CourseListItem {
    description: string;
    lessons: LessonSummary[];
    createdAt: Date;
    updatedAt: Date;
}

// ============ Lesson Types ============

export type LessonType = 'VIDEO' | 'DOCUMENT' | 'QUIZ';

// DTOs for Lesson CRUD
export interface CreateLessonDto {
    title: string;
    slug: string;
    description?: string;
    type?: LessonType;
    content?: string;        // Markdown content or YouTube URL
    order?: number;
    duration?: number;
    isFree?: boolean;
    isPublished?: boolean;
}

export interface UpdateLessonDto extends Partial<CreateLessonDto> { }

export interface Media {
    id: number;
    type: 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'YOUTUBE_EMBED';
    title?: string;
    url: string;
    filename?: string;
    mimeType?: string;
    size?: number;
    duration?: number;
    order: number;
}

export interface LessonListItem {
    id: number;
    title: string;
    slug: string;
    description?: string;
    type: LessonType;
    order: number;
    duration: number;
    isFree: boolean;
    isPublished: boolean;
}

export interface LessonDetail extends LessonListItem {
    content?: string;
    media: Media[];
    createdAt: Date;
    updatedAt: Date;
}

// ============ Enrollment Types ============

export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export interface CourseRef {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string;
    instructor: { id: number; name: string };
    lessonCount?: number;
    duration?: number;
}

export interface EnrollmentListItem {
    id: number;
    status: EnrollmentStatus;
    progressPercent: number;
    enrolledAt: Date;
    course: CourseRef;
}

export interface EnrollmentDetail extends EnrollmentListItem {
    expiresAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface EnrollmentCheck {
    enrolled: boolean;
    status?: EnrollmentStatus;
    progressPercent?: number;
    enrollmentId?: number;
}

// ============ Payment Types ============

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface PaymentListItem {
    id: number;
    amount: number;
    currency: string;
    status: PaymentStatus;
    method?: string;
    transactionId?: string;
    course: {
        id: number;
        title: string;
        slug: string;
        thumbnail?: string;
    };
    createdAt: Date;
    paidAt?: Date;
}

export interface CreatePaymentResponse {
    success: boolean;
    paymentUrl: string;
    orderCode: number;
    paymentId: number;
    enrollmentId: number;
}

export interface PaymentVerifyResponse {
    success: boolean;
    status: PaymentStatus;
    message?: string;
    paymentId: number;
    enrollmentId?: number;
    course?: CourseRef;
}

// ============ Cart Types (Frontend Only) ============

export interface CartItem {
    course: CourseListItem;
    addedAt: Date;
}

// ============ Auth Types ============

export interface AuthUser {
    id: number;
    email: string;
    name?: string;
    photoURL?: string;
    role: Role;
    emailVerified: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    name?: string;
}

// ============ API Response Types ============

export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

// ============ Progress Types ============

export interface ProgressDto {
    id: number;
    lessonId: number;
    isCompleted: boolean;
    watchedSeconds: number;
    lastPosition: number;
    completedAt?: Date;
}

export interface LessonProgressSummary {
    id: number;
    title: string;
    order: number;
    isCompleted: boolean;
}

export interface CourseProgressDto {
    courseId: number;
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
    lessons: LessonProgressSummary[];
}

