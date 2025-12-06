"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, Menu, User } from "lucide-react";
import { useState } from "react";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const navLinks = [
        { href: "/courses", label: "Khóa học" },
        { href: "/#student-experience", label: "Trải nghiệm" },
        { href: "/blog", label: "Blog" },
    ];

    return (
        <header className="sticky top-4 left-4 right-4 z-50 mx-4">
            <nav className="glass rounded-2xl px-6 py-4 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                            <span className="text-white font-bold text-xl">CC</span>
                        </div>
                        <span className="font-display font-bold text-xl text-primary-700 hidden sm:block">
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
                                    ? "text-primary-600 font-semibold"
                                    : "text-gray-700 hover:text-primary-600"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Search Button */}
                        <button
                            aria-label="Tìm kiếm"
                            className="p-2 hover:bg-primary-50 rounded-lg transition-colors duration-200 cursor-pointer"
                        >
                            <Search className="w-5 h-5 text-gray-600" />
                        </button>

                        {/* Cart Button */}
                        <button
                            aria-label="Giỏ hàng"
                            className="hidden sm:flex p-2 hover:bg-primary-50 rounded-lg transition-colors duration-200 relative cursor-pointer"
                        >
                            <ShoppingCart className="w-5 h-5 text-gray-600" />
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center">
                                2
                            </span>
                        </button>

                        {/* User Button */}
                        <button
                            aria-label="Tài khoản"
                            className="hidden sm:flex p-2 hover:bg-primary-50 rounded-lg transition-colors duration-200 cursor-pointer"
                        >
                            <User className="w-5 h-5 text-gray-600" />
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            aria-label="Menu"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 hover:bg-primary-50 rounded-lg transition-colors duration-200 cursor-pointer"
                        >
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-col gap-3">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`transition-colors duration-200 font-medium py-2 ${isActive(link.href)
                                        ? "text-primary-600 font-semibold"
                                        : "text-gray-700 hover:text-primary-600"
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <button className="flex-1 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-200 cursor-pointer">
                                    Đăng nhập
                                </button>
                                <button className="flex-1 px-4 py-2 gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity duration-200 cursor-pointer">
                                    Đăng ký
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
