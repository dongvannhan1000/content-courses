import apiClient from "./client";
import type { Category } from "@/types";

export const categoriesApi = {
    // Get all categories in tree structure with course counts
    getAll: async (): Promise<Category[]> => {
        const { data } = await apiClient.get("/categories");
        return data;
    },

    // Get category by slug
    getBySlug: async (slug: string): Promise<Category> => {
        const { data } = await apiClient.get(`/categories/${slug}`);
        return data;
    },
};

export default categoriesApi;
