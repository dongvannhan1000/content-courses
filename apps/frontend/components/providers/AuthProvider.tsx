"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore, useCartStore } from "@/lib/stores";
import { apiClient } from "@/lib/api/client";
import type { User } from "@/types";

interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * AuthProvider - Centralized Firebase auth state listener
 * 
 * This component sets up a SINGLE Firebase auth listener for the entire app.
 * It syncs Firebase auth state with the Zustand auth store and backend.
 * Also triggers cart sync when user logs in.
 * 
 * Place this provider near the root of your app (in layout.tsx).
 * Components should use useAuth() hook to access auth state and actions.
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const { login, logout, setLoading } = useAuthStore();
    const { setLoggedIn, mergeWithServer } = useCartStore();

    // Use refs to avoid recreating the listener when store actions change
    const loginRef = useRef(login);
    const logoutRef = useRef(logout);
    const setLoadingRef = useRef(setLoading);
    const setLoggedInRef = useRef(setLoggedIn);
    const mergeWithServerRef = useRef(mergeWithServer);

    // Keep refs up to date
    loginRef.current = login;
    logoutRef.current = logout;
    setLoadingRef.current = setLoading;
    setLoggedInRef.current = setLoggedIn;
    mergeWithServerRef.current = mergeWithServer;

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

                            // Sync cart with server after successful login
                            setLoggedInRef.current(true);
                            mergeWithServerRef.current();
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
                            emailVerified: true,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        loginRef.current(userData);
                        // Don't sync cart if backend is down
                    }
                } catch (error) {
                    console.error("Error getting user data:", error);
                    setLoadingRef.current(false);
                }
            } else {
                logoutRef.current();
                setLoggedInRef.current(false);
            }
        });

        return () => unsubscribe();
    }, []); // Empty deps - uses refs to avoid recreating listener

    return <>{children}</>;
}
