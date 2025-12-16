"use client";

import { Star, Check } from "lucide-react";
import type { Category } from "@/types";

interface FilterSidebarProps {
    categories: Category[];
    selectedCategories: string[];
    selectedPriceRange: string | null;
    selectedRating: number | null;
    onCategoryChange: (category: string) => void;
    onPriceChange: (range: string) => void;
    onRatingChange: (rating: number) => void;
    onClearFilters: () => void;
}

const priceRanges = [
    { id: "under-1m", label: "Dưới 1.000.000đ" },
    { id: "1m-2m", label: "1.000.000đ - 2.000.000đ" },
    { id: "over-2m", label: "Trên 2.000.000đ" },
];

export default function FilterSidebar({
    categories,
    selectedCategories,
    selectedPriceRange,
    selectedRating,
    onCategoryChange,
    onPriceChange,
    onRatingChange,
    onClearFilters,
}: FilterSidebarProps) {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">Bộ lọc</h3>
                <button
                    onClick={onClearFilters}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors cursor-pointer"
                >
                    Xóa tất cả
                </button>
            </div>

            {/* Categories */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Danh mục</h4>
                <div className="space-y-2">
                    {categories.length > 0 ? (
                        categories.map((category) => (
                            <label
                                key={category.id}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${selectedCategories.includes(category.slug)
                                        ? "bg-primary-500 border-primary-500"
                                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 group-hover:border-primary-400"
                                        }`}
                                    onClick={() => onCategoryChange(category.slug)}
                                >
                                    {selectedCategories.includes(category.slug) && (
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    )}
                                </div>
                                <span className="text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {category.name}
                                </span>
                            </label>
                        ))
                    ) : (
                        // Skeleton loading
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="w-5 h-5 rounded-md bg-gray-200 dark:bg-gray-700" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Price */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Giá khóa học</h4>
                <div className="space-y-2">
                    {priceRanges.map((range) => (
                        <label
                            key={range.id}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${selectedPriceRange === range.id
                                    ? "border-primary-500"
                                    : "border-gray-300 dark:border-gray-600 group-hover:border-primary-400"
                                    }`}
                                onClick={() => onPriceChange(range.id)}
                            >
                                {selectedPriceRange === range.id && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                                )}
                            </div>
                            <span className="text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {range.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Rating */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Đánh giá</h4>
                <div className="space-y-2">
                    {[5, 4, 3].map((rating) => (
                        <label
                            key={rating}
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => onRatingChange(rating)}
                        >
                            <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${selectedRating === rating
                                    ? "border-primary-500"
                                    : "border-gray-300 dark:border-gray-600 group-hover:border-primary-400"
                                    }`}
                            >
                                {selectedRating === rating && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {rating === 5 ? "" : "trở lên"}
                                </span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
