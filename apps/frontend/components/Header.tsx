"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, ShoppingCart, Menu, X, ChevronDown, LogOut, Settings, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/providers";
import { Button, Avatar, Badge } from "@/components/ui";
import { AuthModal } from "@/components/features/auth";
import { SearchModal } from "@/components/features/search";
import { useAuth } from "@/lib/hooks";
import { useCartStore } from "@/lib/stores";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Real auth state
    const { user, isAuthenticated, isLoading, signOut } = useAuth();

    // Cart state
    const cartItems = useCartStore((state) => state.items);
    const cartItemCount = cartItems.length;

    const isActive = (path: string) => pathname === path;

    const navLinks = [
        { href: "/courses", label: "Khóa học" },
        { href: "/#student-experience", label: "Trải nghiệm" },
        { href: "/blog", label: "Blog" },
    ];

    // Auto-open login modal from URL param (e.g., /?login=true)
    useEffect(() => {
        const loginParam = searchParams.get("login");
        if (loginParam === "true" && !isAuthenticated && !isLoading) {
            setAuthModalTab("login");
            setIsAuthModalOpen(true);
            // Clean up URL
            const newUrl = pathname;
            router.replace(newUrl);
        }
    }, [searchParams, isAuthenticated, isLoading, pathname, router]);

    // Keyboard shortcut for search (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const openAuthModal = (tab: "login" | "register") => {
        setAuthModalTab(tab);
        setIsAuthModalOpen(true);
    };

    const handleSignOut = async () => {
        await signOut();
        setIsUserMenuOpen(false);
    };

    return (
        <>
            <header className="sticky top-4 left-4 right-4 z-50 mx-4">
                <nav className="glass rounded-2xl px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                                <span className="text-white font-bold text-xl">CC</span>
                            </div>
                            <span className="font-display font-bold text-xl text-primary-700 dark:text-primary-400 hidden sm:block">
                                Nghề Content
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`transition-colors duration-200 font-medium ${isActive(link.href)
                                        ? "text-primary-600 dark:text-primary-400 font-semibold"
                                        : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            {/* Search Button */}
                            <button
                                aria-label="Tìm kiếm"
                                onClick={() => setIsSearchOpen(true)}
                                className="hidden sm:flex items-center gap-2 px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors duration-200 cursor-pointer"
                            >
                                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                    ⌘K
                                </kbd>
                            </button>
                            {/* Mobile Search Button */}
                            <button
                                aria-label="Tìm kiếm"
                                onClick={() => setIsSearchOpen(true)}
                                className="sm:hidden p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors duration-200 cursor-pointer"
                            >
                                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>

                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Cart Button - Only show for authenticated users */}
                            {isAuthenticated && (
                                <Link
                                    href="/cart"
                                    className="hidden sm:flex p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors duration-200 relative cursor-pointer"
                                >
                                    <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    {cartItemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </Link>
                            )}

                            {/* User/Auth Section */}
                            {isLoading ? (
                                // Loading state
                                <div className="hidden sm:block w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                            ) : isAuthenticated && user ? (
                                // Logged in state
                                <div className="relative hidden sm:block">
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center gap-2 p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <Avatar
                                            src={user.photoURL || undefined}
                                            name={user.name}
                                            size="sm"
                                        />
                                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>

                                    {/* User Dropdown */}
                                    {isUserMenuOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            />
                                            <div className="absolute right-0 top-full mt-2 w-64 glass rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-20 animate-scale-in">
                                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <div className="py-1">
                                                    {/* Dashboard navigation */}
                                                    <Link
                                                        href="/dashboard"
                                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <BookOpen className="w-5 h-5" />
                                                        {user.role === 'INSTRUCTOR' || user.role === 'ADMIN' ? 'Dashboard' : 'Khóa học của tôi'}
                                                    </Link>
                                                    <Link
                                                        href="/dashboard/settings"
                                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <Settings className="w-5 h-5" />
                                                        Cài đặt tài khoản
                                                    </Link>
                                                </div>
                                                <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
                                                    <button
                                                        onClick={handleSignOut}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                                                    >
                                                        <LogOut className="w-5 h-5" />
                                                        Đăng xuất
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                // Not logged in state
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openAuthModal("login")}
                                    >
                                        Đăng nhập
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => openAuthModal("register")}
                                    >
                                        Đăng ký
                                    </Button>
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors duration-200 cursor-pointer"
                            >
                                {isMenuOpen ? (
                                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                ) : (
                                    <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
                            <div className="flex flex-col gap-3">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`transition-colors duration-200 font-medium py-2 ${isActive(link.href)
                                            ? "text-primary-600 dark:text-primary-400 font-semibold"
                                            : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}

                                {/* Mobile Cart - Only show for authenticated users */}
                                {isAuthenticated && (
                                    <Link
                                        href="/cart"
                                        className="flex items-center justify-between py-2 text-gray-700 dark:text-gray-300"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <span className="font-medium">Giỏ hàng</span>
                                        {cartItemCount > 0 && (
                                            <Badge variant="accent" size="sm">
                                                {cartItemCount}
                                            </Badge>
                                        )}
                                    </Link>
                                )}

                                {/* Mobile Auth/User */}
                                {isAuthenticated && user ? (
                                    <>
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-3 py-2 text-gray-700 dark:text-gray-300"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Avatar src={user.photoURL || undefined} name={user.name} size="sm" />
                                            <span className="font-medium">
                                                {user.role === 'INSTRUCTOR' || user.role === 'ADMIN' ? 'Dashboard' : user.name}
                                            </span>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            fullWidth
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleSignOut();
                                            }}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Đăng xuất
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="secondary"
                                            fullWidth
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                openAuthModal("login");
                                            }}
                                        >
                                            Đăng nhập
                                        </Button>
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                openAuthModal("register");
                                            }}
                                        >
                                            Đăng ký
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </nav>
            </header>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                defaultTab={authModalTab}
            />

            {/* Search Modal */}
            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    );
}
