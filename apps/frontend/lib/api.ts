import axios, { AxiosError, AxiosInstance } from "axios";

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    async (config) => {
        // Get token from localStorage or auth store
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("auth-token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            // Clear auth state
            if (typeof window !== "undefined") {
                localStorage.removeItem("auth-token");
                // Could dispatch logout action here
            }
        }

        // Handle network errors
        if (!error.response) {
            console.error("Network error:", error.message);
        }

        return Promise.reject(error);
    }
);

export default api;

// Helper function to extract error message
export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "An unexpected error occurred";
}
