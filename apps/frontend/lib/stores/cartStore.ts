"use client";

import { create } from "zustand";
import type { CourseListItem } from "@/types";
import { cartApi, type CartItemResponse } from "@/lib/api/cart";

export interface CartItem {
    course: CourseListItem;
    addedAt: Date;
}

interface CartState {
    items: CartItem[];
    isLoading: boolean;
    error: string | null;

    // Computed
    totalItems: () => number;
    totalPrice: () => number;
    isInCart: (courseId: number) => boolean;

    // Actions
    fetchCart: () => Promise<void>;
    addItem: (course: CourseListItem) => Promise<void>;
    removeItem: (courseId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    resetCart: () => void;
}

/**
 * Convert API response to CartItem format
 */
function apiItemToCartItem(item: CartItemResponse): CartItem {
    return {
        course: {
            id: item.course.id,
            title: item.course.title,
            slug: item.course.slug,
            thumbnail: item.course.thumbnail,
            price: item.course.price,
            discountPrice: item.course.discountPrice,
            instructor: {
                id: item.course.instructor.id,
                name: item.course.instructor.name || "",
                photoURL: undefined,
            },
            shortDesc: undefined,
            level: undefined,
            duration: 0,
            status: "PUBLISHED",
            publishedAt: undefined,
            category: { id: 0, name: "", slug: "" },
            lessonCount: 0,
            enrollmentCount: 0,
            reviewCount: 0,
            rating: undefined,
        },
        addedAt: new Date(item.addedAt),
    };
}

export const useCartStore = create<CartState>()((set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    totalItems: () => get().items.length,

    totalPrice: () =>
        get().items.reduce(
            (total, item) =>
                total + (item.course.discountPrice || item.course.price),
            0
        ),

    isInCart: (courseId) =>
        get().items.some((item) => item.course.id === courseId),

    // Fetch cart from server (called on login)
    fetchCart: async () => {
        try {
            set({ isLoading: true, error: null });
            const response = await cartApi.getCart();
            set({ items: response.items.map(apiItemToCartItem), isLoading: false });
        } catch (error) {
            console.error("Failed to fetch cart:", error);
            set({ error: "Không thể tải giỏ hàng", isLoading: false });
        }
    },

    // Add item to cart (server)
    addItem: async (course) => {
        const { items } = get();
        const exists = items.some((item) => item.course.id === course.id);
        if (exists) return;

        try {
            set({ isLoading: true, error: null });
            const response = await cartApi.addItem(course.id);
            set({ items: response.items.map(apiItemToCartItem), isLoading: false });
        } catch (error) {
            console.error("Failed to add item to cart:", error);
            set({ error: "Không thể thêm vào giỏ hàng", isLoading: false });
        }
    },

    // Remove item from cart (server)
    removeItem: async (courseId) => {
        try {
            set({ isLoading: true, error: null });
            const response = await cartApi.removeItem(courseId);
            set({ items: response.items.map(apiItemToCartItem), isLoading: false });
        } catch (error) {
            console.error("Failed to remove item from cart:", error);
            set({ error: "Không thể xóa khỏi giỏ hàng", isLoading: false });
        }
    },

    // Clear cart (server)
    clearCart: async () => {
        try {
            set({ isLoading: true, error: null });
            await cartApi.clearCart();
            set({ items: [], isLoading: false });
        } catch (error) {
            console.error("Failed to clear cart:", error);
            set({ error: "Không thể xóa giỏ hàng", isLoading: false });
        }
    },

    // Reset cart state (called on logout)
    resetCart: () => {
        set({ items: [], isLoading: false, error: null });
    },
}));
