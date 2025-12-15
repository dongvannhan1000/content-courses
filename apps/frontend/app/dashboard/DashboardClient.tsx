"use client";

import { useState } from "react";
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
    Calendar,
    BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardContent, Badge, Avatar, Button, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";

// Mock enrolled courses data
const mockEnrolledCourses = [
    {
        id: 1,
        title: "Content Marketing từ Zero đến Hero",
        slug: "content-marketing-tu-zero-den-hero",
        thumbnail: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=225&fit=crop",
        instructor: { name: "Nguyễn Văn A" },
        progress: 65,
        totalLessons: 48,
        completedLessons: 31,
        lastAccessed: new Date("2024-12-10"),
        nextLesson: "Viết headline thu hút",
        status: "in_progress" as const,
    },
    {
        id: 2,
        title: "SEO Content cho Người Mới Bắt Đầu",
        slug: "seo-content-cho-nguoi-moi-bat-dau",
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop",
        instructor: { name: "Trần Thị B" },
        progress: 100,
        totalLessons: 32,
        completedLessons: 32,
        lastAccessed: new Date("2024-11-20"),
        status: "completed" as const,
        certificate: true,
    },
    {
        id: 3,
        title: "Social Media Marketing Mastery",
        slug: "social-media-marketing-mastery",
        thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop",
        instructor: { name: "Lê Văn C" },
        progress: 15,
        totalLessons: 36,
        completedLessons: 5,
        lastAccessed: new Date("2024-12-14"),
        nextLesson: "Chiến lược content trên TikTok",
        status: "in_progress" as const,
    },
];

// Mock user stats
const mockStats = {
    totalCourses: 3,
    completedCourses: 1,
    totalHoursLearned: 24,
    certificates: 1,
    currentStreak: 7,
    longestStreak: 14,
};

// Mock activity data
const mockRecentActivity = [
    { type: "lesson", title: "Hoàn thành: Viết content cho LinkedIn", time: "2 giờ trước", courseTitle: "Content Marketing" },
    { type: "achievement", title: "Đạt thành tích: 7 ngày liên tiếp", time: "Hôm nay" },
    { type: "lesson", title: "Bắt đầu: Chiến lược content trên TikTok", time: "Hôm qua", courseTitle: "Social Media" },
    { type: "certificate", title: "Nhận chứng chỉ: SEO Content", time: "3 ngày trước" },
];

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "numeric",
        month: "short",
    }).format(new Date(date));
}

export default function DashboardClient() {
    const [activeTab, setActiveTab] = useState("courses");

    const inProgressCourses = mockEnrolledCourses.filter((c) => c.status === "in_progress");
    const completedCourses = mockEnrolledCourses.filter((c) => c.status === "completed");

    return (
        <div className="min-h-screen py-8 pt-24">
            <div className="max-w-7xl mx-auto px-4">
                {/* Welcome Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">
                                Xin chào, Học viên! 👋
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
                            <Button variant="primary" leftIcon={<Play className="w-4 h-4" />}>
                                Tiếp tục học
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card variant="glass" padding="md" className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {mockStats.totalCourses}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Khóa học</p>
                    </Card>

                    <Card variant="glass" padding="md" className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {mockStats.certificates}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Chứng chỉ</p>
                    </Card>

                    <Card variant="glass" padding="md" className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {mockStats.totalHoursLearned}h
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Giờ học</p>
                    </Card>

                    <Card variant="glass" padding="md" className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {mockStats.currentStreak}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ngày streak</p>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Courses */}
                    <div className="lg:col-span-2 space-y-6">
                        <Tabs defaultValue="courses" value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="courses">
                                    Đang học ({inProgressCourses.length})
                                </TabsTrigger>
                                <TabsTrigger value="completed">
                                    Hoàn thành ({completedCourses.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="courses" className="mt-6 space-y-4">
                                {inProgressCourses.map((course) => (
                                    <Card key={course.id} variant="default" padding="none" hoverable>
                                        <Link href={`/courses/${course.slug}`}>
                                            <div className="flex flex-col sm:flex-row">
                                                {/* Thumbnail */}
                                                <div className="relative w-full sm:w-48 h-32 shrink-0">
                                                    <Image
                                                        src={course.thumbnail}
                                                        alt={course.title}
                                                        fill
                                                        className="object-cover rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none"
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 p-4 sm:p-5 space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                                                {course.title}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {course.instructor.name}
                                                            </p>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                                                    </div>

                                                    {/* Progress */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                {course.completedLessons}/{course.totalLessons} bài học
                                                            </span>
                                                            <span className="font-medium text-primary-600 dark:text-primary-400">
                                                                {course.progress}%
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full gradient-primary rounded-full transition-all duration-300"
                                                                style={{ width: `${course.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Next Lesson */}
                                                    {course.nextLesson && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Play className="w-4 h-4 text-primary-500" />
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                Tiếp theo: {course.nextLesson}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </Card>
                                ))}

                                {inProgressCourses.length === 0 && (
                                    <Card variant="glass" padding="lg" className="text-center">
                                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            Chưa có khóa học nào
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
                                {completedCourses.map((course) => (
                                    <Card key={course.id} variant="default" padding="none" hoverable>
                                        <Link href={`/courses/${course.slug}`}>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="relative w-full sm:w-48 h-32 shrink-0">
                                                    <Image
                                                        src={course.thumbnail}
                                                        alt={course.title}
                                                        fill
                                                        className="object-cover rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none"
                                                    />
                                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
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
                                                                {course.title}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {course.instructor.name}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {course.totalLessons} bài học
                                                        </span>
                                                        {course.certificate && (
                                                            <Button variant="ghost" size="sm">
                                                                <GraduationCap className="w-4 h-4 mr-1" />
                                                                Xem chứng chỉ
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </Card>
                                ))}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-6">
                        {/* Recent Activity */}
                        <Card variant="default" padding="lg">
                            <CardHeader
                                title="Hoạt động gần đây"
                                action={
                                    <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
                                        Xem tất cả
                                    </button>
                                }
                            />
                            <CardContent className="mt-4 space-y-4">
                                {mockRecentActivity.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0"
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activity.type === "lesson"
                                                ? "bg-primary-100 dark:bg-primary-900/30"
                                                : activity.type === "achievement"
                                                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                                                    : "bg-green-100 dark:bg-green-900/30"
                                                }`}
                                        >
                                            {activity.type === "lesson" ? (
                                                <Play className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                            ) : activity.type === "achievement" ? (
                                                <TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                            ) : (
                                                <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                                {activity.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

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

                        {/* Learning Streak */}
                        <Card variant="elevated" padding="lg" className="gradient-primary text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-white/80 text-sm">Streak hiện tại</p>
                                    <p className="text-3xl font-bold">
                                        {mockStats.currentStreak} ngày 🔥
                                    </p>
                                    <p className="text-white/60 text-xs">
                                        Cao nhất: {mockStats.longestStreak} ngày
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
