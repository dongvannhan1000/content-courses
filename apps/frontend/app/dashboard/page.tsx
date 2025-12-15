"use client";

import Link from "next/link";
import { useMyEnrollments } from "@/hooks";
import { useAuthStore, useWishlistStore } from "@/stores";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    BookOpen,
    Clock,
    Trophy,
    Heart,
    ChevronRight,
    Play,
} from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { data: enrollments, isLoading } = useMyEnrollments();
    const { items: wishlistItems } = useWishlistStore();

    const inProgressCount = enrollments?.filter((e) => e.status === "ACTIVE").length ?? 0;
    const completedCount = enrollments?.filter((e) => e.status === "COMPLETED").length ?? 0;
    const totalCourses = enrollments?.length ?? 0;

    const recentEnrollments = enrollments?.slice(0, 3) ?? [];

    const stats = [
        {
            label: "Khóa học đã đăng ký",
            value: totalCourses,
            icon: BookOpen,
            color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
        },
        {
            label: "Đang học",
            value: inProgressCount,
            icon: Clock,
            color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
        },
        {
            label: "Đã hoàn thành",
            value: completedCount,
            icon: Trophy,
            color: "text-green-500 bg-green-50 dark:bg-green-900/20",
        },
        {
            label: "Yêu thích",
            value: wishlistItems.length,
            icon: Heart,
            color: "text-red-500 bg-red-50 dark:bg-red-900/20",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
                    Chào mừng trở lại, {user?.name?.split(" ")[0] || "bạn"}! 👋
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                    Tiếp tục hành trình học tập của bạn
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} variant="glass">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Continue Learning */}
            <Card variant="glass">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Tiếp tục học
                    </h2>
                    <Link href="/dashboard/learning">
                        <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                            Xem tất cả
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton variant="rounded" width={120} height={68} />
                                <div className="flex-1 space-y-2">
                                    <Skeleton variant="text" height={20} width="60%" />
                                    <Skeleton variant="text" height={16} width="40%" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recentEnrollments.length === 0 ? (
                    <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Bạn chưa đăng ký khóa học nào
                        </p>
                        <Link href="/courses">
                            <Button variant="primary">Khám phá khóa học</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentEnrollments.map((enrollment) => (
                            <Link
                                key={enrollment.id}
                                href={`/courses/${enrollment.course.slug}`}
                                className="flex items-center gap-4 p-4 -mx-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0">
                                    {enrollment.course.thumbnail ? (
                                        <img
                                            src={enrollment.course.thumbnail}
                                            alt={enrollment.course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Play className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {enrollment.course.title}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {enrollment.course.instructor.name}
                                    </p>
                                    {/* Progress Bar */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500 rounded-full transition-all"
                                                style={{ width: `${enrollment.progressPercent}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {enrollment.progressPercent}%
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
