import { apiClient } from "./client";
import type { CourseListItem } from "@/types";

export interface CartItemResponse {
    id: number;
    course: {
        id: number;
        title: string;
        slug: string;
        thumbnail?: string;
        price: number;
        discountPrice?: number;
        instructor: {
            id: number;
            name: string;
        };
    };
    addedAt: string;
}

export interface CartResponse {
    items: CartItemResponse[];
    totalItems: number;
    totalPrice: number;
}

export const cartApi = {
    /**
     * Get user's cart from server
     */
    getCart: async (): Promise<CartResponse> => {
        const { data } = await apiClient.get("/cart");
        return data;
    },

    /**
     * Add item to cart on server
     */
    addItem: async (courseId: number): Promise<CartResponse> => {
        const { data } = await apiClient.post("/cart/items", { courseId });
        return data;
    },

    /**
     * Remove item from cart on server
     */
    removeItem: async (courseId: number): Promise<CartResponse> => {
        const { data } = await apiClient.delete(`/cart/items/${courseId}`);
        return data;
    },

    /**
     * Clear cart on server
     */
    clearCart: async (): Promise<{ success: boolean }> => {
        const { data } = await apiClient.delete("/cart");
        return data;
    },

    /**
     * Merge local cart with server cart (after login)
     */
    mergeCart: async (courseIds: number[]): Promise<CartResponse> => {
        const { data } = await apiClient.post("/cart/merge", { courseIds });
        return data;
    },
};
