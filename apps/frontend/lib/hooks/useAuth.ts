"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/lib/stores";
import { apiClient } from "@/lib/api/client";
import type { User } from "@/types";

interface AuthError {
    code: string;
    message: string;
}

interface RegisterData {
    email: string;
    password: string;
    name: string;
}

// Map Firebase error codes to Vietnamese messages
function getErrorMessage(code: string): string {
    const errorMessages: Record<string, string> = {
        "auth/email-already-in-use": "Email này đã được sử dụng",
        "auth/invalid-email": "Email không hợp lệ",
        "auth/operation-not-allowed": "Phương thức đăng nhập chưa được kích hoạt",
        "auth/weak-password": "Mật khẩu quá yếu (tối thiểu 6 ký tự)",
        "auth/user-disabled": "Tài khoản đã bị vô hiệu hóa",
        "auth/user-not-found": "Không tìm thấy tài khoản",
        "auth/wrong-password": "Mật khẩu không đúng",
        "auth/invalid-credential": "Thông tin đăng nhập không hợp lệ",
        "auth/too-many-requests": "Quá nhiều lần thử, vui lòng thử lại sau",
        "auth/popup-closed-by-user": "Đăng nhập bị hủy",
    };
    return errorMessages[code] || "Đã có lỗi xảy ra, vui lòng thử lại";
}

/**
 * Get current Firebase ID token
 * Firebase automatically handles token refresh
 */
export async function getIdToken(): Promise<string | null> {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return null;
    }

    try {
        // forceRefresh: false - uses cached token if valid
        return await currentUser.getIdToken(false);
    } catch (error) {
        console.error("Error getting ID token:", error);
        return null;
    }
}

export function useAuth() {
    const { user, isAuthenticated, isLoading, setLoading, setError, login, logout } = useAuthStore();
    const [authError, setAuthError] = useState<string | null>(null);

    // Use ref to prevent dependency issues
    const loginRef = useRef(login);
    const logoutRef = useRef(logout);
    const setLoadingRef = useRef(setLoading);

    // Update refs
    loginRef.current = login;
    logoutRef.current = logout;
    setLoadingRef.current = setLoading;

    // Listen to Firebase auth state changes
    useEffect(() => {
        const auth = getFirebaseAuth();

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Get ID token from Firebase
                    const idToken = await firebaseUser.getIdToken();

                    // Sync with backend - POST /auth/login with idToken in body
                    try {
                        const { data } = await apiClient.post("/auth/login", {
                            idToken,
                        });

                        // Backend returns { user: { id, email, name, role, ... } }
                        if (data?.user) {
                            loginRef.current(data.user as User);
                        }
                    } catch (backendError) {
                        // Backend might not be running or user not synced
                        // Fallback to Firebase user data
                        console.warn("Backend sync failed, using Firebase data:", backendError);
                        const userData: User = {
                            id: 0, // Will be updated when backend syncs
                            email: firebaseUser.email || "",
                            name: firebaseUser.displayName || "Người dùng",
                            photoURL: firebaseUser.photoURL || undefined,
                            role: "USER",
                            isActive: true,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        loginRef.current(userData);
                    }
                } catch (error) {
                    console.error("Error getting user data:", error);
                    setLoadingRef.current(false);
                }
            } else {
                logoutRef.current();
            }
        });

        return () => unsubscribe();
    }, []); // Empty deps - uses refs

    // Clear error - stable reference
    const clearError = useCallback(() => {
        setAuthError(null);
    }, []);

    // Sign in with email/password
    const signIn = useCallback(async (email: string, password: string) => {
        setAuthError(null);
        setLoading(true);

        try {
            const auth = getFirebaseAuth();
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the rest
            return { success: true };
        } catch (error) {
            const authError = error as AuthError;
            const message = getErrorMessage(authError.code);
            setAuthError(message);
            setError(message);
            setLoading(false);
            return { success: false, error: message };
        }
    }, [setLoading, setError]);

    // Register new user - calls backend to create user in database
    const register = useCallback(async (data: RegisterData) => {
        setAuthError(null);
        setLoading(true);

        try {
            // First, register with backend (creates user in Firebase + DB)
            await apiClient.post("/auth/register", {
                email: data.email,
                password: data.password,
                name: data.name,
            });

            // Then sign in with Firebase client
            const auth = getFirebaseAuth();
            await signInWithEmailAndPassword(auth, data.email, data.password);

            return { success: true };
        } catch (error: any) {
            // Handle backend errors
            const message = error?.message || getErrorMessage((error as AuthError).code || "");
            setAuthError(message);
            setError(message);
            setLoading(false);
            return { success: false, error: message };
        }
    }, [setLoading, setError]);

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        setAuthError(null);
        setLoading(true);

        try {
            const auth = getFirebaseAuth();
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // onAuthStateChanged will handle backend sync
            return { success: true };
        } catch (error) {
            const authError = error as AuthError;
            const message = getErrorMessage(authError.code);
            setAuthError(message);
            setError(message);
            setLoading(false);
            return { success: false, error: message };
        }
    }, [setLoading, setError]);

    // Sign out
    const handleSignOut = useCallback(async () => {
        try {
            const auth = getFirebaseAuth();
            await signOut(auth);
            logout();
            return { success: true };
        } catch (error) {
            console.error("Sign out error:", error);
            return { success: false };
        }
    }, [logout]);

    return {
        user,
        isAuthenticated,
        isLoading,
        error: authError,
        signIn,
        register,
        signInWithGoogle,
        signOut: handleSignOut,
        clearError,
    };
}
