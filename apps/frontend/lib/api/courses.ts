import apiClient from "./client";
import type { CourseListItem, PaginatedResponse } from "@/types";

export interface CourseFilters {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sort?: "price_asc" | "price_desc" | "rating" | "newest" | "popular";
}

export const coursesApi = {
    // Get all courses with filters
    getAll: async (filters: CourseFilters = {}): Promise<PaginatedResponse<CourseListItem>> => {
        const { data } = await apiClient.get("/courses", { params: filters });
        return data;
    },

    // Get course by slug
    getBySlug: async (slug: string) => {
        const { data } = await apiClient.get(`/courses/slug/${slug}`);
        return data;
    },

    // Get course by ID
    getById: async (id: number) => {
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

    // Get courses by category
    getByCategory: async (categorySlug: string, limit: number = 12) => {
        const { data } = await apiClient.get(`/courses/category/${categorySlug}`, {
            params: { limit },
        });
        return data;
    },
};

export default coursesApi;
