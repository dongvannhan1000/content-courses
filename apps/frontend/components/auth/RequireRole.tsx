"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Role } from "@/types";

interface RequireRoleProps {
    children: React.ReactNode;
    allowedRoles: Role[];
}

/**
 * RequireRole - HOC wrapper for role-protected routes
 * 
 * Extends RequireAuth with role-based access control.
 * Role hierarchy: ADMIN can access all INSTRUCTOR routes.
 * 
 * Usage:
 * ```tsx
 * export default function InstructorDashboard() {
 *     return (
 *         <RequireRole allowedRoles={['INSTRUCTOR', 'ADMIN']}>
 *             <DashboardContent />
 *         </RequireRole>
 *     );
 * }
 * ```
 * 
 * Behavior:
 * - If loading: Shows loading spinner
 * - If not authenticated: Redirects to /?login=true
 * - If authenticated but wrong role: Shows access denied + redirect to /dashboard
 * - If authorized: Renders children
 */
export function RequireRole({ children, allowedRoles }: RequireRoleProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, isAuthenticated } = useAuth();

    useEffect(() => {
        // Wait for auth to finish loading
        if (isLoading) return;

        // Not authenticated - redirect to homepage with login modal
        if (!isAuthenticated) {
            const redirectUrl = encodeURIComponent(pathname);
            router.replace(`/?login=true&redirect=${redirectUrl}`);
            return;
        }

        // Check role access
        const userRole = user?.role;
        if (userRole && !allowedRoles.includes(userRole)) {
            // Wrong role - redirect to user dashboard after delay
            const timer = setTimeout(() => {
                router.replace("/dashboard");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, isAuthenticated, user?.role, allowedRoles, router, pathname]);

    // Loading state
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

    // Not authenticated - show loading while redirecting
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

    // Check role access
    const userRole = user?.role;
    if (userRole && !allowedRoles.includes(userRole)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">
                        Không có quyền truy cập
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Bạn cần quyền {allowedRoles.join(" hoặc ")} để truy cập trang này.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Đang chuyển hướng về trang dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // Authorized - render children
    return <>{children}</>;
}
