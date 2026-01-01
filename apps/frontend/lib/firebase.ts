import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;
let storage: FirebaseStorage;

function getFirebaseApp(): FirebaseApp {
    if (!app) {
        // Check if already initialized
        const existingApps = getApps();
        if (existingApps.length > 0) {
            app = existingApps[0];
        } else {
            app = initializeApp(firebaseConfig);
        }
    }
    return app;
}

export function getFirebaseAuth(): Auth {
    if (!auth) {
        auth = getAuth(getFirebaseApp());
    }
    return auth;
}

export function getFirebaseStorage(): FirebaseStorage {
    if (!storage) {
        storage = getStorage(getFirebaseApp());
    }
    return storage;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
    if (typeof window !== "undefined" && !analytics) {
        const supported = await isSupported();
        if (supported) {
            analytics = getAnalytics(getFirebaseApp());
        }
    }
    return analytics;
}

// Export initialized instances for direct usage
export { app, auth, analytics, storage };
export default getFirebaseApp;

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
