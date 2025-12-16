"use client";

import { useState, useEffect, useCallback } from "react";
import { Filter, SlidersHorizontal, X, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import CourseCard from "@/components/CourseCard";
import FilterSidebar from "@/components/FilterSidebar";
import { coursesApi, categoriesApi, type CourseFilters } from "@/lib/api";
import type { CourseListItem, Category, PaginatedResponse } from "@/types";

export default function CoursesPage() {
    // Data state
    const [courses, setCourses] = useState<CourseListItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<"newest" | "price" | "popular" | "rating">("newest");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoriesApi.getAll();
                // Filter to main categories only (no parent)
                const mainCategories = data.filter((cat: Category & { parentId?: number | null }) =>
                    !cat.parentId
                );
                setCategories(mainCategories);
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchCategories();
    }, []);

    // Map price range to API params
    const getPriceParams = useCallback((): { minPrice?: number; maxPrice?: number } => {
        switch (selectedPriceRange) {
            case "under-1m":
                return { maxPrice: 1000000 };
            case "1m-2m":
                return { minPrice: 1000000, maxPrice: 2000000 };
            case "over-2m":
                return { minPrice: 2000000 };
            default:
                return {};
        }
    }, [selectedPriceRange]);

    // Fetch courses when filters change
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            setError(null);

            try {
                const filters: CourseFilters = {
                    page: pagination.page,
                    limit: pagination.limit,
                    sortBy,
                    sortOrder,
                    ...getPriceParams(),
                };

                // Add category filter (use first selected category for now)
                if (selectedCategories.length > 0) {
                    filters.category = selectedCategories[0];
                }

                const response: PaginatedResponse<CourseListItem> = await coursesApi.getAll(filters);

                // Client-side rating filter (API doesn't support rating filter yet)
                let filteredData = response.data;
                if (selectedRating) {
                    filteredData = filteredData.filter(
                        (course) => course.rating && course.rating >= selectedRating
                    );
                }

                setCourses(filteredData);
                setPagination({
                    total: response.total,
                    page: response.page,
                    limit: response.limit,
                    totalPages: response.totalPages,
                });
            } catch (err) {
                console.error("Error fetching courses:", err);
                setError("Không thể tải khóa học. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [selectedCategories, selectedPriceRange, selectedRating, sortBy, sortOrder, pagination.page, pagination.limit, getPriceParams]);

    const handleCategoryChange = (categorySlug: string) => {
        setSelectedCategories((prev) =>
            prev.includes(categorySlug)
                ? prev.filter((c) => c !== categorySlug)
                : [...prev, categorySlug]
        );
        // Reset to page 1 when filter changes
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handlePriceChange = (range: string) => {
        setSelectedPriceRange((prev) => (prev === range ? null : range));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleRatingChange = (rating: number) => {
        setSelectedRating((prev) => (prev === rating ? null : rating));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedPriceRange(null);
        setSelectedRating(null);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <main className="min-h-screen">
            <Header />

            {/* Page Header */}
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-4">
                        Tất cả khóa học
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                        Khám phá kho tàng kiến thức Content Marketing từ cơ bản đến chuyên sâu.
                        Tìm khóa học phù hợp nhất với mục tiêu của bạn.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-28 glass rounded-2xl p-6">
                            <FilterSidebar
                                categories={categories}
                                selectedCategories={selectedCategories}
                                selectedPriceRange={selectedPriceRange}
                                selectedRating={selectedRating}
                                onCategoryChange={handleCategoryChange}
                                onPriceChange={handlePriceChange}
                                onRatingChange={handleRatingChange}
                                onClearFilters={clearFilters}
                            />
                        </div>
                    </aside>

                    {/* Mobile Filter Button */}
                    <div className="lg:hidden mb-6">
                        <button
                            onClick={() => setIsMobileFilterOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 glass rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                        >
                            <Filter className="w-5 h-5" />
                            Bộ lọc & Sắp xếp
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Results Info */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-600 dark:text-gray-400">
                                {loading ? (
                                    "Đang tải..."
                                ) : (
                                    <>
                                        Hiển thị <span className="font-bold text-gray-900 dark:text-white">{courses.length}</span> / {pagination.total} khóa học
                                    </>
                                )}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Sắp xếp theo:</span>
                                <select
                                    value={`${sortBy}-${sortOrder}`}
                                    onChange={(e) => {
                                        const [newSortBy, newSortOrder] = e.target.value.split("-") as ["newest" | "price" | "popular" | "rating", "asc" | "desc"];
                                        setSortBy(newSortBy);
                                        setSortOrder(newSortOrder);
                                    }}
                                    className="px-3 py-1.5 glass rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 border-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                                >
                                    <option value="newest-desc">Mới nhất</option>
                                    <option value="price-asc">Giá thấp đến cao</option>
                                    <option value="price-desc">Giá cao đến thấp</option>
                                    <option value="popular-desc">Phổ biến nhất</option>
                                    <option value="rating-desc">Đánh giá cao</option>
                                </select>
                            </div>
                        </div>

                        {/* Error State */}
                        {error && (
                            <div className="text-center py-12 glass rounded-2xl mb-6">
                                <p className="text-red-500 dark:text-red-400">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 px-6 py-2 gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                    Thử lại
                                </button>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                                        <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                                        <div className="p-6 space-y-4">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Course Grid */}
                        {!loading && !error && courses.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {courses.map((course) => (
                                        <CourseCard key={course.id} course={course} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 mt-12">
                                        <button
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                            className="px-4 py-2 glass rounded-lg font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                                        >
                                            Trước
                                        </button>

                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                                                let pageNum: number;
                                                if (pagination.totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (pagination.page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (pagination.page >= pagination.totalPages - 2) {
                                                    pageNum = pagination.totalPages - 4 + i;
                                                } else {
                                                    pageNum = pagination.page - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`w-10 h-10 rounded-lg font-medium transition-colors cursor-pointer ${pagination.page === pageNum
                                                                ? "gradient-primary text-white"
                                                                : "glass text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-700/60"
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.totalPages}
                                            className="px-4 py-2 glass rounded-lg font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Empty State */}
                        {!loading && !error && courses.length === 0 && (
                            <div className="text-center py-20 glass rounded-2xl">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Filter className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Không tìm thấy khóa học nào
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    Thử thay đổi hoặc xóa bộ lọc để xem thêm kết quả
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="px-6 py-2 gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setIsMobileFilterOpen(false)}
                    />
                    <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-y-auto animate-slide-in-right">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white">Bộ lọc</h3>
                            <button
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <FilterSidebar
                            categories={categories}
                            selectedCategories={selectedCategories}
                            selectedPriceRange={selectedPriceRange}
                            selectedRating={selectedRating}
                            onCategoryChange={handleCategoryChange}
                            onPriceChange={handlePriceChange}
                            onRatingChange={handleRatingChange}
                            onClearFilters={clearFilters}
                        />
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="w-full py-3 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang tải...
                                    </span>
                                ) : (
                                    `Xem ${courses.length} kết quả`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
