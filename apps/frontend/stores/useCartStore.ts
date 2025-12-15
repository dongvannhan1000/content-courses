import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CourseListItem } from "@/types";

interface CartItem {
    course: CourseListItem;
    addedAt: Date;
}

interface CartState {
    // State
    items: CartItem[];

    // Computed (getters in zustand are just functions)
    getItemCount: () => number;
    getTotal: () => number;
    getDiscountedTotal: () => number;
    isInCart: (courseId: number) => boolean;

    // Actions
    addItem: (course: CourseListItem) => void;
    removeItem: (courseId: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            // Getters
            getItemCount: () => get().items.length,

            getTotal: () =>
                get().items.reduce((sum, item) => sum + item.course.price, 0),

            getDiscountedTotal: () =>
                get().items.reduce(
                    (sum, item) => sum + (item.course.discountPrice ?? item.course.price),
                    0
                ),

            isInCart: (courseId) =>
                get().items.some((item) => item.course.id === courseId),

            // Actions
            addItem: (course) => {
                const { items, isInCart } = get();
                if (isInCart(course.id)) return; // Already in cart

                set({
                    items: [...items, { course, addedAt: new Date() }],
                });
            },

            removeItem: (courseId) => {
                set({
                    items: get().items.filter((item) => item.course.id !== courseId),
                });
            },

            clearCart: () => set({ items: [] }),
        }),
        {
            name: "cart-storage",
            partialize: (state) => ({ items: state.items }),
        }
    )
);
