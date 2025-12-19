import axios from "axios";
import { getIdToken } from "@/lib/firebase";

// Determine API URL based on IS_NGROK flag
// Set NEXT_PUBLIC_IS_NGROK=true to use ngrok URL for PayOS webhook testing
const getApiUrl = () => {
    const isNgrok = process.env.NEXT_PUBLIC_IS_NGROK === "true";

    if (isNgrok && process.env.NEXT_PUBLIC_API_URL_NGROK) {
        console.log("[API] Using ngrok URL:", process.env.NEXT_PUBLIC_API_URL_NGROK);
        return process.env.NEXT_PUBLIC_API_URL_NGROK;
    }

    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
};

// Create axios instance with default config
export const apiClient = axios.create({
    baseURL: getApiUrl(),
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
