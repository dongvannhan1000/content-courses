import { useMutation, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "@/lib/api";
import { User } from "@/types";
import { useAuthStore } from "@/stores";

// ============ Types ============

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    password: string;
    name?: string;
}

interface AuthResponse {
    user: User;
    token: string;
}

// ============ API Functions ============

async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post("/auth/login", credentials);
    return data;
}

async function registerUser(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post("/auth/register", userData);
    return data;
}

async function fetchCurrentUser(): Promise<User> {
    const { data } = await api.get("/users/me");
    return data;
}

async function logoutUser(): Promise<void> {
    await api.post("/auth/logout");
}

// ============ Mutation Hooks ============

/**
 * Login mutation
 * Used in: AuthModal login form
 */
export function useLogin() {
    const { login, closeAuthModal } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            login(data.user, data.token);
            // Invalidate any user-specific queries
            queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        },
    });
}

/**
 * Register mutation
 * Used in: AuthModal register form
 */
export function useRegister() {
    const { login, closeAuthModal } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: registerUser,
        onSuccess: (data) => {
            login(data.user, data.token);
        },
    });
}

/**
 * Logout mutation
 * Used in: Header logout button
 */
export function useLogout() {
    const { logout } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            logout();
            // Clear all queries
            queryClient.clear();
        },
        onError: () => {
            // Logout locally even if API fails
            logout();
            queryClient.clear();
        },
    });
}

/**
 * Refresh current user data
 * Used in: App initialization, after profile update
 */
export function useRefreshUser() {
    const { setUser, setLoading } = useAuthStore();

    return useMutation({
        mutationFn: fetchCurrentUser,
        onSuccess: (user) => {
            setUser(user);
            setLoading(false);
        },
        onError: () => {
            setUser(null);
            setLoading(false);
        },
    });
}
