import apiClient from "./client";
import type { CourseListItem, CourseDetail, PaginatedResponse } from "@/types";

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
};

export default coursesApi;

