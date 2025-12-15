import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseListItem } from "@/types";

export interface CartItem {
    course: CourseListItem;
    addedAt: Date;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;

    // Computed
    totalItems: () => number;
    totalPrice: () => number;

    // Actions
    addItem: (course: CourseListItem) => void;
    removeItem: (courseId: number) => void;
    clearCart: () => void;
    isInCart: (courseId: number) => boolean;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            totalItems: () => get().items.length,

            totalPrice: () =>
                get().items.reduce(
                    (total, item) =>
                        total + (item.course.discountPrice || item.course.price),
                    0
                ),

            addItem: (course) => {
                const { items } = get();
                const exists = items.some((item) => item.course.id === course.id);

                if (!exists) {
                    set({
                        items: [
                            ...items,
                            { course, addedAt: new Date() },
                        ],
                    });
                }
            },

            removeItem: (courseId) => {
                set({
                    items: get().items.filter((item) => item.course.id !== courseId),
                });
            },

            clearCart: () => set({ items: [] }),

            isInCart: (courseId) =>
                get().items.some((item) => item.course.id === courseId),

            toggleCart: () => set({ isOpen: !get().isOpen }),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
        }),
        {
            name: "cart-storage",
            partialize: (state) => ({
                items: state.items,
            }),
        }
    )
);
