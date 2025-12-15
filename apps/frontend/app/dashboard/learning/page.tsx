"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyEnrollments } from "@/hooks";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import {
    BookOpen,
    Clock,
    Play,
    CheckCircle,
    Filter,
} from "lucide-react";

type FilterStatus = "all" | "active" | "completed";

export default function LearningPage() {
    const { data: enrollments, isLoading } = useMyEnrollments();
    const [filter, setFilter] = useState<FilterStatus>("all");

    const filteredEnrollments = enrollments?.filter((e) => {
        if (filter === "all") return true;
        if (filter === "active") return e.status === "ACTIVE";
        if (filter === "completed") return e.status === "COMPLETED";
        return true;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
                        Khóa học của tôi
                    </h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        {enrollments?.length ?? 0} khóa học đã đăng ký
                    </p>
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                    {[
                        { value: "all" as const, label: "Tất cả" },
                        { value: "active" as const, label: "Đang học" },
                        { value: "completed" as const, label: "Hoàn thành" },
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${filter === option.value
                                    ? "bg-primary-500 text-white"
                                    : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Course Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : filteredEnrollments?.length === 0 ? (
                <Card variant="glass" className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {filter === "all"
                            ? "Chưa có khóa học nào"
                            : filter === "active"
                                ? "Không có khóa học đang học"
                                : "Chưa hoàn thành khóa học nào"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {filter === "all" && "Hãy đăng ký khóa học đầu tiên của bạn!"}
                    </p>
                    {filter === "all" && (
                        <Link
                            href="/courses"
                            className="inline-block px-6 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                        >
                            Khám phá khóa học
                        </Link>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredEnrollments?.map((enrollment) => (
                        <Link
                            key={enrollment.id}
                            href={`/courses/${enrollment.course.slug}`}
                        >
                            <Card
                                variant="glass"
                                padding="none"
                                hoverable
                                className="overflow-hidden"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-gray-200 dark:bg-slate-700">
                                    {enrollment.course.thumbnail ? (
                                        <img
                                            src={enrollment.course.thumbnail}
                                            alt={enrollment.course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Play className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3">
                                        {enrollment.status === "COMPLETED" ? (
                                            <Badge variant="success" size="sm">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Hoàn thành
                                            </Badge>
                                        ) : (
                                            <Badge variant="primary" size="sm">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Đang học
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                                        {enrollment.course.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        {enrollment.course.instructor.name}
                                    </p>

                                    {/* Progress */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Tiến độ
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {enrollment.progressPercent}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${enrollment.status === "COMPLETED"
                                                        ? "bg-green-500"
                                                        : "bg-primary-500"
                                                    }`}
                                                style={{ width: `${enrollment.progressPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 mt-3">
                                        Đăng ký: {formatDate(enrollment.enrolledAt)}
                                    </p>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
