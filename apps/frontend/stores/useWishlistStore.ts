import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CourseListItem } from "@/types";

interface WishlistState {
    // State
    items: CourseListItem[];

    // Getters
    isInWishlist: (courseId: number) => boolean;

    // Actions
    addItem: (course: CourseListItem) => void;
    removeItem: (courseId: number) => void;
    toggleItem: (course: CourseListItem) => void;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],

            isInWishlist: (courseId) =>
                get().items.some((item) => item.id === courseId),

            addItem: (course) => {
                if (get().isInWishlist(course.id)) return;
                set({ items: [...get().items, course] });
            },

            removeItem: (courseId) => {
                set({
                    items: get().items.filter((item) => item.id !== courseId),
                });
            },

            toggleItem: (course) => {
                if (get().isInWishlist(course.id)) {
                    get().removeItem(course.id);
                } else {
                    get().addItem(course);
                }
            },

            clearWishlist: () => set({ items: [] }),
        }),
        {
            name: "wishlist-storage",
            partialize: (state) => ({ items: state.items }),
        }
    )
);
