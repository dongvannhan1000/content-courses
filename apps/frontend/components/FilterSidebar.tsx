"use client";

import { Star, Check } from "lucide-react";
import { useState } from "react";

interface FilterSidebarProps {
    selectedCategories: string[];
    selectedPriceRange: string | null;
    selectedRating: number | null;
    onCategoryChange: (category: string) => void;
    onPriceChange: (range: string) => void;
    onRatingChange: (rating: number) => void;
    onClearFilters: () => void;
}

const categories = [
    "Content Marketing",
    "SEO",
    "Social Media",
    "Video Marketing",
    "Email Marketing",
    "Strategy",
];

const priceRanges = [
    { id: "under-1m", label: "Dưới 1.000.000đ" },
    { id: "1m-2m", label: "1.000.000đ - 2.000.000đ" },
    { id: "over-2m", label: "Trên 2.000.000đ" },
];

export default function FilterSidebar({
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
                <h3 className="font-display font-bold text-lg text-gray-900">Bộ lọc</h3>
                <button
                    onClick={onClearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer"
                >
                    Xóa tất cả
                </button>
            </div>

            {/* Categories */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Danh mục</h4>
                <div className="space-y-2">
                    {categories.map((category) => (
                        <label
                            key={category}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${selectedCategories.includes(category)
                                        ? "bg-primary-500 border-primary-500"
                                        : "border-gray-300 bg-white group-hover:border-primary-400"
                                    }`}
                                onClick={() => onCategoryChange(category)}
                            >
                                {selectedCategories.includes(category) && (
                                    <Check className="w-3.5 h-3.5 text-white" />
                                )}
                            </div>
                            <span className="text-gray-600 group-hover:text-primary-600 transition-colors">
                                {category}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Giá khóa học</h4>
                <div className="space-y-2">
                    {priceRanges.map((range) => (
                        <label
                            key={range.id}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${selectedPriceRange === range.id
                                        ? "border-primary-500"
                                        : "border-gray-300 group-hover:border-primary-400"
                                    }`}
                                onClick={() => onPriceChange(range.id)}
                            >
                                {selectedPriceRange === range.id && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                                )}
                            </div>
                            <span className="text-gray-600 group-hover:text-primary-600 transition-colors">
                                {range.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Rating */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Đánh giá</h4>
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
                                        : "border-gray-300 group-hover:border-primary-400"
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
                                                    : "fill-gray-200 text-gray-200"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500 group-hover:text-primary-600 transition-colors">
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
