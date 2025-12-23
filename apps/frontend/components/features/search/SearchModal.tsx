"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Loader2, Clock, TrendingUp } from "lucide-react";
import { coursesApi } from "@/lib/api";
import type { CourseListItem } from "@/types";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CourseListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const debouncedQuery = useDebounce(query, 300);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setQuery("");
            setResults([]);
            setHasSearched(false);
        }
    }, [isOpen]);

    // Search when debounced query changes
    useEffect(() => {
        const searchCourses = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                setHasSearched(false);
                return;
            }

            try {
                setIsLoading(true);
                const response = await coursesApi.getAll({
                    search: debouncedQuery,
                    limit: 5,
                });
                setResults(response.data);
                setHasSearched(true);
            } catch (error) {
                console.error("Search error:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        searchCourses();
    }, [debouncedQuery]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    const handleResultClick = (slug: string) => {
        onClose();
        router.push(`/courses/${slug}`);
    };

    const handleViewAll = () => {
        onClose();
        router.push(`/courses?search=${encodeURIComponent(query)}`);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 animate-scale-in">
                <div className="glass rounded-2xl shadow-2xl overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm kiếm khóa học..."
                            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none text-lg"
                        />
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : query ? (
                            <button
                                onClick={() => setQuery("")}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        ) : null}
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {/* Quick Actions - shown when no search query */}
                        {!query && (
                            <div className="p-4">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                    Gợi ý
                                </p>
                                <div className="space-y-2">
                                    <Link
                                        href="/courses?sort=popular"
                                        onClick={onClose}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <TrendingUp className="w-5 h-5 text-primary-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            Khóa học phổ biến
                                        </span>
                                    </Link>
                                    <Link
                                        href="/courses?sort=newest"
                                        onClick={onClose}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Clock className="w-5 h-5 text-accent-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            Khóa học mới nhất
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Search Results */}
                        {hasSearched && results.length > 0 && (
                            <div className="p-2">
                                {results.map((course) => (
                                    <button
                                        key={course.id}
                                        onClick={() => handleResultClick(course.slug)}
                                        className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer text-left"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative w-16 h-12 shrink-0 rounded-lg overflow-hidden">
                                            {course.thumbnail ? (
                                                <Image
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="64px"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                                {course.title}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {course.instructor.name}
                                            </p>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right shrink-0">
                                            <div className="font-semibold text-primary-600 dark:text-primary-400">
                                                {new Intl.NumberFormat("vi-VN").format(
                                                    course.discountPrice || course.price
                                                )}
                                                ₫
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {/* View All Button */}
                                <button
                                    onClick={handleViewAll}
                                    className="w-full mt-2 py-3 text-center text-primary-600 dark:text-primary-400 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors cursor-pointer"
                                >
                                    Xem tất cả kết quả cho "{query}"
                                </button>
                            </div>
                        )}

                        {/* No Results */}
                        {hasSearched && results.length === 0 && (
                            <div className="p-8 text-center">
                                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    Không tìm thấy kết quả cho "{query}"
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                    Thử tìm với từ khóa khác
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
