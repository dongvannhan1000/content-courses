import axios from "axios";

// Create axios instance with default config
export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        // Get token from localStorage or auth store
        const token = typeof window !== "undefined"
            ? localStorage.getItem("auth-token")
            : null;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error
            const { status, data } = error.response;

            if (status === 401) {
                // Unauthorized - clear auth and redirect
                if (typeof window !== "undefined") {
                    localStorage.removeItem("auth-token");
                    localStorage.removeItem("auth-storage");
                    // Could redirect to login or trigger auth modal
                }
            }

            // Return formatted error
            return Promise.reject({
                status,
                message: data?.message || "Something went wrong",
                errors: data?.errors,
            });
        }

        // Network error
        return Promise.reject({
            status: 0,
            message: "Network error. Please check your connection.",
        });
    }
);

export default apiClient;
