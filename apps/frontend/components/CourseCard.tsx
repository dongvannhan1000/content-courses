"use client";

import Image from "next/image";
import { Star, Clock, Users, BookOpen, TrendingUp, Sparkles } from "lucide-react";
import type { CourseListItem } from "@/types";

interface CourseCardProps {
    course: CourseListItem;
}

// Helper to format duration from seconds to readable string
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// Helper to format price in VND
function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
}

export default function CourseCard({ course }: CourseCardProps) {
    const discountPercentage = course.discountPrice
        ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
        : 0;

    const displayPrice = course.discountPrice || course.price;
    const originalPrice = course.discountPrice ? course.price : null;

    return (
        <div className="group glass rounded-2xl overflow-hidden card-hover cursor-pointer">
            {/* Thumbnail */}
            <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                {course.thumbnail ? (
                    <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full gradient-primary" />
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {course.enrollmentCount > 100 && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-accent-500 text-white text-xs font-semibold rounded-full shadow-lg">
                            <TrendingUp className="w-3 h-3" />
                            Bestseller
                        </span>
                    )}
                    {course.status === 'PUBLISHED' && new Date(course.publishedAt || '').getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full shadow-lg">
                            <Sparkles className="w-3 h-3" />
                            Mới
                        </span>
                    )}
                </div>

                {/* Discount Badge */}
                {discountPercentage > 0 && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-lg shadow-lg">
                        -{discountPercentage}%
                    </div>
                )}

                {/* Level Badge */}
                {course.level && (
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg">
                        {course.level}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Category */}
                {course.category && (
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                            {course.category.name}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                    {course.title}
                </h3>

                {/* Description */}
                {course.shortDesc && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {course.shortDesc}
                    </p>
                )}

                {/* Instructor */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        {course.instructor.photoURL ? (
                            <Image
                                src={course.instructor.photoURL}
                                alt={course.instructor.name}
                                fill
                                className="object-cover"
                                sizes="32px"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                                {course.instructor.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {course.instructor.name}
                    </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(course.duration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.lessonCount} bài</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.enrollmentCount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Rating */}
                {course.rating && (
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                {course.rating.toFixed(1)}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({course.reviewCount.toLocaleString()} đánh giá)
                        </span>
                    </div>
                )}

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 gap-3">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-primary-700 dark:text-primary-400">
                            {formatPrice(displayPrice)}₫
                        </span>
                        {originalPrice && (
                            <span className="text-xs text-gray-400 line-through">
                                {formatPrice(originalPrice)}₫
                            </span>
                        )}
                    </div>
                    <button className="px-4 py-2 gradient-accent text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 cursor-pointer whitespace-nowrap shadow-md shadow-accent-500/20">
                        Mua ngay
                    </button>
                </div>
            </div>
        </div>
    );
}
