import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseListItem } from "@/types";
import { cartApi, type CartItemResponse } from "@/lib/api/cart";

export interface CartItem {
    course: CourseListItem;
    addedAt: Date;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    isSyncing: boolean;
    isLoggedIn: boolean;

    // Computed
    totalItems: () => number;
    totalPrice: () => number;

    // Actions
    addItem: (course: CourseListItem) => Promise<void>;
    removeItem: (courseId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    isInCart: (courseId: number) => boolean;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;

    // Sync actions
    setLoggedIn: (loggedIn: boolean) => void;
    syncWithServer: () => Promise<void>;
    mergeWithServer: () => Promise<void>;
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
            // These fields may not be in cart response, use defaults
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

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            isSyncing: false,
            isLoggedIn: false,

            totalItems: () => get().items.length,

            totalPrice: () =>
                get().items.reduce(
                    (total, item) =>
                        total + (item.course.discountPrice || item.course.price),
                    0
                ),

            addItem: async (course) => {
                const { items, isLoggedIn } = get();
                const exists = items.some((item) => item.course.id === course.id);

                if (exists) return;

                if (isLoggedIn) {
                    // Logged in: sync with server
                    try {
                        set({ isSyncing: true });
                        const response = await cartApi.addItem(course.id);
                        set({ items: response.items.map(apiItemToCartItem), isSyncing: false });
                    } catch (error) {
                        console.error("Failed to add item to server cart:", error);
                        // Fallback to local
                        set({
                            items: [...items, { course, addedAt: new Date() }],
                            isSyncing: false,
                        });
                    }
                } else {
                    // Guest: local only
                    set({
                        items: [...items, { course, addedAt: new Date() }],
                    });
                }
            },

            removeItem: async (courseId) => {
                const { items, isLoggedIn } = get();

                if (isLoggedIn) {
                    try {
                        set({ isSyncing: true });
                        const response = await cartApi.removeItem(courseId);
                        set({ items: response.items.map(apiItemToCartItem), isSyncing: false });
                    } catch (error) {
                        console.error("Failed to remove item from server cart:", error);
                        // Fallback to local
                        set({
                            items: items.filter((item) => item.course.id !== courseId),
                            isSyncing: false,
                        });
                    }
                } else {
                    set({
                        items: items.filter((item) => item.course.id !== courseId),
                    });
                }
            },

            clearCart: async () => {
                const { isLoggedIn } = get();

                if (isLoggedIn) {
                    try {
                        set({ isSyncing: true });
                        await cartApi.clearCart();
                        set({ items: [], isSyncing: false });
                    } catch (error) {
                        console.error("Failed to clear server cart:", error);
                        set({ items: [], isSyncing: false });
                    }
                } else {
                    set({ items: [] });
                }
            },

            isInCart: (courseId) =>
                get().items.some((item) => item.course.id === courseId),

            toggleCart: () => set({ isOpen: !get().isOpen }),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            // Set login state - called from AuthProvider
            setLoggedIn: (loggedIn) => {
                set({ isLoggedIn: loggedIn });
            },

            // Sync: Replace local cart with server cart
            syncWithServer: async () => {
                try {
                    set({ isSyncing: true });
                    const response = await cartApi.getCart();
                    set({ items: response.items.map(apiItemToCartItem), isSyncing: false });
                } catch (error) {
                    console.error("Failed to sync cart with server:", error);
                    set({ isSyncing: false });
                }
            },

            // Merge: Combine local cart with server cart (after login)
            mergeWithServer: async () => {
                const { items } = get();
                const localCourseIds = items.map((item) => item.course.id);

                if (localCourseIds.length === 0) {
                    // No local items, just sync from server
                    return get().syncWithServer();
                }

                try {
                    set({ isSyncing: true });
                    const response = await cartApi.mergeCart(localCourseIds);
                    set({ items: response.items.map(apiItemToCartItem), isSyncing: false });
                } catch (error) {
                    console.error("Failed to merge cart with server:", error);
                    // Keep local items on failure
                    set({ isSyncing: false });
                }
            },
        }),
        {
            name: "cart-storage",
            partialize: (state) => ({
                items: state.items,
            }),
        }
    )
);
