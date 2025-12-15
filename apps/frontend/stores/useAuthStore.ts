import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
    // State
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Modal state
    showAuthModal: boolean;
    authMode: "login" | "register";

    // Actions
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setLoading: (isLoading: boolean) => void;

    // Auth modal actions
    openAuthModal: (mode?: "login" | "register") => void;
    closeAuthModal: () => void;
    switchAuthMode: () => void;

    // Auth actions
    login: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            token: null,
            isLoading: true,
            isAuthenticated: false,
            showAuthModal: false,
            authMode: "login",

            // Setters
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setToken: (token) => {
                set({ token });
                // Also store in localStorage for API interceptor
                if (typeof window !== "undefined") {
                    if (token) {
                        localStorage.setItem("auth-token", token);
                    } else {
                        localStorage.removeItem("auth-token");
                    }
                }
            },
            setLoading: (isLoading) => set({ isLoading }),

            // Modal actions
            openAuthModal: (mode = "login") =>
                set({ showAuthModal: true, authMode: mode }),
            closeAuthModal: () => set({ showAuthModal: false }),
            switchAuthMode: () =>
                set((state) => ({
                    authMode: state.authMode === "login" ? "register" : "login",
                })),

            // Auth actions
            login: (user, token) => {
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                    showAuthModal: false,
                });
                if (typeof window !== "undefined") {
                    localStorage.setItem("auth-token", token);
                }
            },
            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
                if (typeof window !== "undefined") {
                    localStorage.removeItem("auth-token");
                }
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
