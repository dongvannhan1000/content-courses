"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, Menu, User, X, LogOut, Heart, BookOpen } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/ui";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore, useCartStore } from "@/stores";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const { user, isAuthenticated, openAuthModal, logout } = useAuthStore();
    const { getItemCount } = useCartStore();
    const cartCount = getItemCount();

    const isActive = (path: string) => pathname === path;

    const navLinks = [
        { href: "/courses", label: "Khóa học" },
        { href: "/#student-experience", label: "Trải nghiệm" },
        { href: "/blog", label: "Blog" },
    ];

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="sticky top-4 left-4 right-4 z-50 mx-4">
            <nav className="glass rounded-2xl px-6 py-4 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                            <span className="text-white font-bold text-xl">CC</span>
                        </div>
                        <span className="font-display font-bold text-xl text-primary-700 dark:text-primary-400 hidden sm:block">
                            Content Course
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
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Search Button */}
                        <button
                            aria-label="Tìm kiếm"
                            className="p-2 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 cursor-pointer"
                        >
                            <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>

                        {/* Cart Button */}
                        <Link
                            href="/cart"
                            aria-label="Giỏ hàng"
                            className="hidden sm:flex p-2 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 relative"
                        >
                            <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {cartCount > 9 ? "9+" : cartCount}
                                </span>
                            )}
                        </Link>

                        {/* User Button / Auth */}
                        {isAuthenticated && user ? (
                            <div className="relative hidden sm:block" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="p-1 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 cursor-pointer"
                                >
                                    <Avatar
                                        src={user.photoURL}
                                        alt={user.name || "User"}
                                        size="sm"
                                    />
                                </button>

                                {/* User Dropdown */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 py-2 animate-scale-in origin-top-right">
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {user.name || "Học viên"}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <User className="w-4 h-4" />
                                                Tài khoản
                                            </Link>
                                            <Link
                                                href="/dashboard/learning"
                                                className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <BookOpen className="w-4 h-4" />
                                                Khóa học của tôi
                                            </Link>
                                            <Link
                                                href="/dashboard/wishlist"
                                                className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <Heart className="w-4 h-4" />
                                                Yêu thích
                                            </Link>
                                        </div>
                                        <div className="border-t border-gray-100 dark:border-slate-700 py-1">
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2">
                                <button
                                    onClick={() => openAuthModal("login")}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                                >
                                    Đăng nhập
                                </button>
                                <button
                                    onClick={() => openAuthModal("register")}
                                    className="px-4 py-2 gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                    Đăng ký
                                </button>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            aria-label="Menu"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 cursor-pointer"
                        >
                            {isMenuOpen ? (
                                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            ) : (
                                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 animate-slide-up">
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

                            {/* Mobile Cart */}
                            <Link
                                href="/cart"
                                className="flex items-center gap-2 py-2 text-gray-700 dark:text-gray-300"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Giỏ hàng
                                {cartCount > 0 && (
                                    <span className="ml-auto px-2 py-0.5 bg-accent-500 text-white text-xs rounded-full">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {isAuthenticated && user ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center gap-2 py-2 text-gray-700 dark:text-gray-300"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <User className="w-5 h-5" />
                                        Tài khoản
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex items-center gap-2 py-2 text-red-600 dark:text-red-400 cursor-pointer"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            openAuthModal("login");
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-xl font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors duration-200 cursor-pointer"
                                    >
                                        Đăng nhập
                                    </button>
                                    <button
                                        onClick={() => {
                                            openAuthModal("register");
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex-1 px-4 py-2.5 gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity duration-200 cursor-pointer"
                                    >
                                        Đăng ký
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
