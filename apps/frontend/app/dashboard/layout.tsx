"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores";
import Header from "@/components/Header";
import { AuthModal } from "@/components/features/auth";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import {
    LayoutDashboard,
    BookOpen,
    Heart,
    Settings,
    LogOut,
    ChevronRight,
} from "lucide-react";

interface DashboardLayoutProps {
    children: ReactNode;
}

const sidebarLinks = [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/dashboard/learning", label: "Khóa học của tôi", icon: BookOpen },
    { href: "/dashboard/wishlist", label: "Yêu thích", icon: Heart },
    { href: "/dashboard/settings", label: "Cài đặt", icon: Settings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const { user, isAuthenticated, logout, openAuthModal } = useAuthStore();

    // If not authenticated, show login prompt
    if (!isAuthenticated) {
        return (
            <>
                <Header />
                <AuthModal />
                <main className="pt-24 pb-16 min-h-screen">
                    <div className="max-w-md mx-auto px-4 text-center py-20">
                        <Card variant="glass" className="p-8">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                                Đăng nhập để tiếp tục
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Bạn cần đăng nhập để xem trang này.
                            </p>
                            <button
                                onClick={() => openAuthModal("login")}
                                className="px-6 py-3 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                Đăng nhập
                            </button>
                        </Card>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Header />
            <AuthModal />

            <main className="pt-24 pb-16 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <aside className="lg:col-span-1">
                            <Card variant="glass" padding="none" className="sticky top-24">
                                {/* User Info */}
                                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <Avatar
                                            src={user?.photoURL}
                                            alt={user?.name || "User"}
                                            size="lg"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {user?.name || "Học viên"}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <nav className="p-4 space-y-1">
                                    {sidebarLinks.map((link) => {
                                        const isActive = pathname === link.href;
                                        const Icon = link.icon;

                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive
                                                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                {link.label}
                                                {isActive && (
                                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                                )}
                                            </Link>
                                        );
                                    })}

                                    {/* Logout */}
                                    <button
                                        onClick={() => logout()}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Đăng xuất
                                    </button>
                                </nav>
                            </Card>
                        </aside>

                        {/* Main Content */}
                        <div className="lg:col-span-3">{children}</div>
                    </div>
                </div>
            </main>
        </>
    );
}
