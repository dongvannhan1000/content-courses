import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
    courseIds: number[];

    // Actions
    addToWishlist: (courseId: number) => void;
    removeFromWishlist: (courseId: number) => void;
    toggleWishlist: (courseId: number) => void;
    isInWishlist: (courseId: number) => boolean;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            courseIds: [],

            addToWishlist: (courseId) => {
                const { courseIds } = get();
                if (!courseIds.includes(courseId)) {
                    set({ courseIds: [...courseIds, courseId] });
                }
            },

            removeFromWishlist: (courseId) => {
                set({
                    courseIds: get().courseIds.filter((id) => id !== courseId),
                });
            },

            toggleWishlist: (courseId) => {
                const { courseIds, addToWishlist, removeFromWishlist } = get();
                if (courseIds.includes(courseId)) {
                    removeFromWishlist(courseId);
                } else {
                    addToWishlist(courseId);
                }
            },

            isInWishlist: (courseId) => get().courseIds.includes(courseId),

            clearWishlist: () => set({ courseIds: [] }),
        }),
        {
            name: "wishlist-storage",
        }
    )
);
