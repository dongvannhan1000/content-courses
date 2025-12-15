"use client";

import { useState, useMemo } from "react";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import Header from "@/components/Header";
import CourseCard from "@/components/CourseCard";
import FilterSidebar from "@/components/FilterSidebar";
import { mockCourses } from "@/lib/mockData";

export default function CoursesPage() {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Filter Logic
    const filteredCourses = useMemo(() => {
        return mockCourses.filter((course) => {
            // Category Filter
            if (
                selectedCategories.length > 0 &&
                course.category &&
                !selectedCategories.includes(course.category.name)
            ) {
                return false;
            }

            // Price Filter (using discountPrice or price)
            const effectivePrice = course.discountPrice || course.price;
            if (selectedPriceRange) {
                if (selectedPriceRange === "under-1m" && effectivePrice >= 1000000) return false;
                if (
                    selectedPriceRange === "1m-2m" &&
                    (effectivePrice < 1000000 || effectivePrice > 2000000)
                )
                    return false;
                if (selectedPriceRange === "over-2m" && effectivePrice <= 2000000) return false;
            }

            // Rating Filter
            if (selectedRating && course.rating && course.rating < selectedRating) {
                return false;
            }

            return true;
        });
    }, [selectedCategories, selectedPriceRange, selectedRating]);

    const handleCategoryChange = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const handlePriceChange = (range: string) => {
        setSelectedPriceRange((prev) => (prev === range ? null : range));
    };

    const handleRatingChange = (rating: number) => {
        setSelectedRating((prev) => (prev === rating ? null : rating));
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedPriceRange(null);
        setSelectedRating(null);
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
                                Hiển thị <span className="font-bold text-gray-900 dark:text-white">{filteredCourses.length}</span> khóa học
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Sắp xếp theo:</span>
                                <button className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer">
                                    Mới nhất <SlidersHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Course Grid */}
                        {filteredCourses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredCourses.map((course) => (
                                    <CourseCard key={course.id} course={course} />
                                ))}
                            </div>
                        ) : (
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
                                Xem {filteredCourses.length} kết quả
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
