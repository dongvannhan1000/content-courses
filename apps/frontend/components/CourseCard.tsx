"use client";

import Image from "next/image";
import { Star, Clock, Users, BookOpen, TrendingUp, Sparkles } from "lucide-react";
import { Course } from "@/types/course";

interface CourseCardProps {
    course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
    const discountPercentage = course.originalPrice
        ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
        : 0;

    return (
        <div className="group glass rounded-2xl overflow-hidden card-hover cursor-pointer">
            {/* Thumbnail */}
            <div className="relative h-48 overflow-hidden bg-gray-100">
                <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {course.isBestseller && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-accent-500 text-white text-xs font-semibold rounded-full shadow-lg">
                            <TrendingUp className="w-3 h-3" />
                            Bestseller
                        </span>
                    )}
                    {course.isNew && (
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
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-lg">
                    {course.level}
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Category */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                        {course.category}
                    </span>
                </div>

                {/* Title */}
                <h3 className="font-display font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
                    {course.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                </p>

                {/* Instructor */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                        <Image
                            src={course.instructorAvatar}
                            alt={course.instructor}
                            fill
                            className="object-cover"
                            sizes="32px"
                        />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                        {course.instructor}
                    </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.lessons} bài</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.studentCount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm text-gray-900">
                            {course.rating}
                        </span>
                    </div>
                    <span className="text-xs text-gray-500">
                        ({course.reviewCount.toLocaleString()} đánh giá)
                    </span>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-primary-700">
                            {course.price.toLocaleString()}₫
                        </span>
                        {course.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">
                                {course.originalPrice.toLocaleString()}₫
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
