"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

interface RequireAuthProps {
    children: React.ReactNode;
}

/**
 * RequireAuth - HOC wrapper for protected routes
 * 
 * Usage:
 * ```tsx
 * export default function DashboardPage() {
 *     return (
 *         <RequireAuth>
 *             <DashboardContent />
 *         </RequireAuth>
 *     );
 * }
 * ```
 * 
 * Behavior:
 * - If loading: Shows loading spinner
 * - If not authenticated: Redirects to /?login=true (opens AuthModal)
 * - If authenticated: Renders children
 */
export function RequireAuth({ children }: RequireAuthProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, isAuthenticated } = useAuth();

    useEffect(() => {
        // Wait for auth to finish loading
        if (isLoading) return;

        // Not authenticated - redirect to homepage with login modal
        if (!isAuthenticated) {
            // Store intended destination for redirect after login
            const redirectUrl = encodeURIComponent(pathname);
            router.replace(`/?login=true&redirect=${redirectUrl}`);
        }
    }, [isLoading, isAuthenticated, router, pathname]);

    // Loading state - prevents flash
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show nothing (will redirect)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Đang chuyển hướng...</p>
                </div>
            </div>
        );
    }

    // Authenticated - render children
    return <>{children}</>;
}
