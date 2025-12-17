"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    BookOpen,
    Clock,
    Award,
    TrendingUp,
    Play,
    ChevronRight,
    Settings,
    Heart,
    ShoppingCart,
    GraduationCap,
    Loader2,
} from "lucide-react";
import { Card, CardHeader, CardContent, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { enrollmentsApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import type { EnrollmentListItem } from "@/types";

export default function DashboardClient() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [enrollments, setEnrollments] = useState<EnrollmentListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("courses");

    // Auth check - redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth/login?redirect=/dashboard");
        }
    }, [user, authLoading, router]);

    // Fetch enrollments - only once when user is available
    useEffect(() => {
        // Skip if no user or if we already have enrollments
        if (!user?.id) return;

        let isCancelled = false;

        const fetchEnrollments = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await enrollmentsApi.getMyEnrollments();
                if (!isCancelled) {
                    setEnrollments(data);
                }
            } catch (err: unknown) {
                console.error("Error fetching enrollments:", err);
                if (!isCancelled) {
                    // Handle API error format { status, message } or standard Error
                    const errorObj = err as { status?: number; message?: string };

                    // Don't show error for auth issues - will redirect to login
                    if (errorObj.status === 401 || errorObj.message?.includes("token")) {
                        // Auth error - let the auth check useEffect handle redirect
                        return;
                    }

                    const errorMessage = errorObj.message || "Không thể tải danh sách khóa học";
                    setError(errorMessage);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        fetchEnrollments();

        return () => {
            isCancelled = true;
        };
    }, [user?.id]);

    // Filter enrollments by status
    const inProgressEnrollments = enrollments.filter(
        (e) => e.status === "ACTIVE" && e.progressPercent < 100
    );
    const completedEnrollments = enrollments.filter(
        (e) => e.status === "COMPLETED" || e.progressPercent === 100
    );

    // Calculate basic stats from enrollments
    const stats = {
        totalCourses: enrollments.length,
        completedCourses: completedEnrollments.length,
        inProgressCourses: inProgressEnrollments.length,
    };

    // Loading state
    if (authLoading || (user && loading)) {
        return (
            <div className="min-h-screen py-8 pt-24 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen py-8 pt-24">
            <div className="max-w-7xl mx-auto px-4">
                {/* Welcome Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">
                                Xin chào, {user.name || "Học viên"}! 👋
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Tiếp tục hành trình học tập của bạn
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/courses">
                                <Button variant="secondary" leftIcon={<BookOpen className="w-4 h-4" />}>
                                    Khám phá thêm
                                </Button>
                            </Link>
                            {inProgressEnrollments.length > 0 && (
                                <Link href={`/courses/${inProgressEnrollments[0].course.slug}`}>
                                    <Button variant="primary" leftIcon={<Play className="w-4 h-4" />}>
                                        Tiếp tục học
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <Card variant="glass" padding="md" className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.totalCourses}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Khóa học</p>
                    </Card>

                    <Card variant="glass" padding="md" className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.inProgressCourses}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Đang học</p>
                    </Card>

                    <Card variant="glass" padding="md" className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.completedCourses}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Hoàn thành</p>
                    </Card>
                </div>

                {/* Error State */}
                {error && (
                    <Card variant="glass" padding="lg" className="text-center mb-8">
                        <p className="text-red-500 dark:text-red-400">{error}</p>
                        <Button
                            variant="primary"
                            className="mt-4"
                            onClick={() => window.location.reload()}
                        >
                            Thử lại
                        </Button>
                    </Card>
                )}

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Courses */}
                    <div className="lg:col-span-2 space-y-6">
                        <Tabs defaultValue="courses" value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="courses">
                                    Đang học ({inProgressEnrollments.length})
                                </TabsTrigger>
                                <TabsTrigger value="completed">
                                    Hoàn thành ({completedEnrollments.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="courses" className="mt-6 space-y-4">
                                {inProgressEnrollments.map((enrollment) => (
                                    <Card key={enrollment.id} variant="default" padding="none" hoverable>
                                        <Link href={`/courses/${enrollment.course.slug}`}>
                                            <div className="flex flex-col sm:flex-row">
                                                {/* Thumbnail */}
                                                <div className="relative w-full sm:w-48 h-32 shrink-0">
                                                    {enrollment.course.thumbnail ? (
                                                        <Image
                                                            src={enrollment.course.thumbnail}
                                                            alt={enrollment.course.title}
                                                            fill
                                                            className="object-cover rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 p-4 sm:p-5 space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                                                {enrollment.course.title}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {enrollment.course.instructor.name}
                                                            </p>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                                                    </div>

                                                    {/* Progress */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                Tiến độ
                                                            </span>
                                                            <span className="font-medium text-primary-600 dark:text-primary-400">
                                                                {enrollment.progressPercent}%
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full gradient-primary rounded-full transition-all duration-300"
                                                                style={{ width: `${enrollment.progressPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </Card>
                                ))}

                                {inProgressEnrollments.length === 0 && (
                                    <Card variant="glass" padding="lg" className="text-center">
                                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            Chưa có khóa học nào đang học
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                                            Bắt đầu hành trình học tập của bạn ngay hôm nay
                                        </p>
                                        <Link href="/courses">
                                            <Button variant="primary">Khám phá khóa học</Button>
                                        </Link>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="completed" className="mt-6 space-y-4">
                                {completedEnrollments.map((enrollment) => (
                                    <Card key={enrollment.id} variant="default" padding="none" hoverable>
                                        <Link href={`/courses/${enrollment.course.slug}`}>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="relative w-full sm:w-48 h-32 shrink-0">
                                                    {enrollment.course.thumbnail ? (
                                                        <Image
                                                            src={enrollment.course.thumbnail}
                                                            alt={enrollment.course.title}
                                                            fill
                                                            className="object-cover rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none" />
                                                    )}
                                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
                                                        <Badge variant="success" size="sm">
                                                            <Award className="w-4 h-4 mr-1" />
                                                            Hoàn thành
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-4 sm:p-5 space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                                                {enrollment.course.title}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {enrollment.course.instructor.name}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            100% hoàn thành
                                                        </span>
                                                        <Button variant="ghost" size="sm">
                                                            <GraduationCap className="w-4 h-4 mr-1" />
                                                            Xem chứng chỉ
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </Card>
                                ))}

                                {completedEnrollments.length === 0 && (
                                    <Card variant="glass" padding="lg" className="text-center">
                                        <Award className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            Chưa có khóa học nào hoàn thành
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Tiếp tục học và hoàn thành khóa học đầu tiên của bạn
                                        </p>
                                    </Card>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Links */}
                        <Card variant="glass" padding="lg">
                            <CardHeader title="Liên kết nhanh" />
                            <CardContent className="mt-4 space-y-2">
                                <Link
                                    href="/dashboard/wishlist"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Heart className="w-5 h-5 text-red-500" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Khóa học yêu thích
                                    </span>
                                </Link>
                                <Link
                                    href="/cart"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <ShoppingCart className="w-5 h-5 text-accent-500" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Giỏ hàng
                                    </span>
                                </Link>
                                <Link
                                    href="/dashboard/certificates"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <GraduationCap className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Chứng chỉ
                                    </span>
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Settings className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Cài đặt tài khoản
                                    </span>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Learning Progress Card */}
                        <Card variant="elevated" padding="lg" className="gradient-primary text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-white/80 text-sm">Khóa học đang học</p>
                                    <p className="text-3xl font-bold">
                                        {stats.inProgressCourses} khóa
                                    </p>
                                    <p className="text-white/60 text-xs">
                                        Hoàn thành: {stats.completedCourses}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
