import apiClient from "./client";
import type { CourseListItem, CourseDetail, PaginatedResponse, CreateCourseDto, UpdateCourseDto, CourseDto } from "@/types";

export interface CourseFilters {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: "price" | "newest" | "popular" | "rating";
    sortOrder?: "asc" | "desc";
}

// Map frontend sort to backend params
function mapSortParams(filters: CourseFilters): Record<string, unknown> {
    const params: Record<string, unknown> = { ...filters };

    // Remove undefined values
    Object.keys(params).forEach(key => {
        if (params[key] === undefined) delete params[key];
    });

    return params;
}

export const coursesApi = {
    // Get all courses with filters
    getAll: async (filters: CourseFilters = {}): Promise<PaginatedResponse<CourseListItem>> => {
        const params = mapSortParams(filters);
        const { data } = await apiClient.get("/courses", { params });
        return data;
    },

    // Get course by slug
    getBySlug: async (slug: string): Promise<CourseDetail> => {
        const { data } = await apiClient.get(`/courses/${slug}`);
        return data;
    },

    // Get course by ID
    getById: async (id: number): Promise<CourseDetail> => {
        const { data } = await apiClient.get(`/courses/${id}`);
        return data;
    },

    // Get featured courses
    getFeatured: async (limit: number = 6): Promise<CourseListItem[]> => {
        const { data } = await apiClient.get("/courses/featured", {
            params: { limit },
        });
        return data;
    },

    // ============ Instructor/Admin Functions ============

    // Get my courses (for instructor dashboard)
    getMyCourses: async (): Promise<CourseListItem[]> => {
        const { data } = await apiClient.get("/courses/my-courses");
        return data;
    },

    // Create new course
    create: async (dto: CreateCourseDto): Promise<CourseDto> => {
        const { data } = await apiClient.post("/courses", dto);
        return data;
    },

    // Update course
    update: async (id: number, dto: UpdateCourseDto): Promise<CourseDto> => {
        const { data } = await apiClient.put(`/courses/${id}`, dto);
        return data;
    },

    // Delete course
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/courses/${id}`);
    },

    // Submit for review (DRAFT → PENDING for instructor, DRAFT → PUBLISHED for admin)
    submitForReview: async (id: number): Promise<CourseDto> => {
        const { data } = await apiClient.patch(`/courses/${id}/submit`);
        return data;
    },
};

export default coursesApi;
