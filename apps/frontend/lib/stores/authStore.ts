import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, User } from "@/types";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    login: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            error: null,

            setUser: (user) =>
                set({
                    user,
                    isAuthenticated: !!user,
                    isLoading: false,
                }),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error, isLoading: false }),

            login: (user) =>
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                }),

            logout: () =>
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                }),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                // Only persist user data, not loading/error states
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
