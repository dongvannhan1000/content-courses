import axios from "axios";
import { getIdToken } from "@/lib/hooks/useAuth";

// Create axios instance with default config
export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        // Bypass ngrok interstitial page for local development
        "ngrok-skip-browser-warning": "true",
    },
});

// Request interceptor - add auth token from Firebase
apiClient.interceptors.request.use(
    async (config) => {
        // Get token directly from Firebase (not localStorage)
        const token = await getIdToken();

        console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - Token: ${token ? 'present' : 'MISSING'}`);

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
                // Unauthorized - Firebase will handle token refresh
                // If still 401 after refresh, user needs to re-login
                console.warn("Unauthorized request - token may be invalid");
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
