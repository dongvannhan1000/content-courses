"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Play,
    Clock,
    BookOpen,
    Users,
    Star,
    Award,
    Lock,
    Heart,
    Share2,
    FileText,
    ShoppingCart,
    Zap,
} from "lucide-react";
import { Button, Badge, Avatar, Card, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { AuthModal } from "@/components/features/auth";
import { useAuth } from "@/lib/hooks";
import type { CourseDetail, LessonSummary } from "@/types";

interface CourseDetailClientProps {
    course: CourseDetail;
}

// Helper functions
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price);
}

export default function CourseDetailClient({ course }: CourseDetailClientProps) {
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const { isAuthenticated } = useAuth();

    // Calculate total duration from lessons
    const totalDuration = course.lessons?.reduce((sum, lesson) => sum + lesson.duration, 0) || course.duration;

    const discountPercentage = course.discountPrice
        ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
        : 0;

    const handleBuyAction = () => {
        if (!isAuthenticated) {
            setIsAuthModalOpen(true);
            return;
        }
        // TODO: Add to cart or navigate to checkout
    };

    return (
        <>
            <div className="pb-20">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 py-12">
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Course Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <a href="/courses" className="hover:text-white transition-colors">
                                        Khóa học
                                    </a>
                                    {course.category && (
                                        <>
                                            <span>/</span>
                                            <a
                                                href={`/courses?category=${course.category.slug}`}
                                                className="hover:text-white transition-colors"
                                            >
                                                {course.category.name}
                                            </a>
                                        </>
                                    )}
                                </div>

                                {/* Title & Badges */}
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {course.enrollmentCount > 100 && (
                                            <Badge variant="accent">Bestseller</Badge>
                                        )}
                                        {course.level && <Badge variant="primary">{course.level}</Badge>}
                                    </div>
                                    <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight">
                                        {course.title}
                                    </h1>
                                    {course.shortDesc && (
                                        <p className="text-lg text-gray-300">{course.shortDesc}</p>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex flex-wrap items-center gap-6 text-sm">
                                    {course.rating && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                <span className="font-bold text-lg">{course.rating}</span>
                                            </div>
                                            <span className="text-gray-400">
                                                ({course.reviewCount.toLocaleString()} đánh giá)
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Users className="w-5 h-5" />
                                        {course.enrollmentCount.toLocaleString()} học viên
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Clock className="w-5 h-5" />
                                        {formatDuration(totalDuration)}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <BookOpen className="w-5 h-5" />
                                        {course.lessonCount} bài học
                                    </div>
                                </div>

                                {/* Instructor */}
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={course.instructor.photoURL}
                                        name={course.instructor.name}
                                        size="md"
                                    />
                                    <div>
                                        <p className="text-sm text-gray-400">Giảng viên</p>
                                        <p className="font-medium">{course.instructor.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Purchase Card - Desktop */}
                            <div className="hidden lg:block">
                                <div className="sticky top-28">
                                    <Card variant="elevated" padding="none" className="overflow-hidden">
                                        {/* Thumbnail */}
                                        <div className="relative h-48">
                                            {course.thumbnail ? (
                                                <Image
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <button className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                                                    <Play className="w-8 h-8 text-primary-600 ml-1" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-4">
                                            {/* Price */}
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    {formatPrice(course.discountPrice || course.price)}₫
                                                </span>
                                                {course.discountPrice && (
                                                    <>
                                                        <span className="text-lg text-gray-400 line-through">
                                                            {formatPrice(course.price)}₫
                                                        </span>
                                                        <Badge variant="danger" size="sm">
                                                            -{discountPercentage}%
                                                        </Badge>
                                                    </>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="space-y-3">
                                                {isAuthenticated ? (
                                                    <>
                                                        <Button
                                                            variant="primary"
                                                            size="lg"
                                                            fullWidth
                                                            leftIcon={<ShoppingCart className="w-5 h-5" />}
                                                            onClick={handleBuyAction}
                                                        >
                                                            Thêm vào giỏ hàng
                                                        </Button>
                                                        <Button variant="secondary" size="lg" fullWidth>
                                                            Mua ngay
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="primary"
                                                        size="lg"
                                                        fullWidth
                                                        leftIcon={<Zap className="w-5 h-5" />}
                                                        onClick={handleBuyAction}
                                                    >
                                                        Mua ngay
                                                    </Button>
                                                )}
                                            </div>

                                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                                Đảm bảo hoàn tiền trong 30 ngày
                                            </p>

                                            {/* Course includes */}
                                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    Khóa học bao gồm:
                                                </h4>
                                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <li className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        {formatDuration(totalDuration)} video theo yêu cầu
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4" />
                                                        {course.lessonCount} bài học
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        Tài liệu đính kèm
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <Award className="w-4 h-4" />
                                                        Chứng chỉ hoàn thành
                                                    </li>
                                                </ul>
                                            </div>

                                            {/* Share & Wishlist */}
                                            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <button
                                                    onClick={() => setIsWishlisted(!isWishlisted)}
                                                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                                                >
                                                    <Heart
                                                        className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""
                                                            }`}
                                                    />
                                                    {isWishlisted ? "Đã lưu" : "Lưu"}
                                                </button>
                                                <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                                                    <Share2 className="w-5 h-5" />
                                                    Chia sẻ
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-12">
                            {/* Tabs: Curriculum, Instructor, Reviews */}
                            <Tabs defaultValue="curriculum">
                                <TabsList className="mb-6">
                                    <TabsTrigger value="curriculum">Nội dung khóa học</TabsTrigger>
                                    <TabsTrigger value="description">Mô tả</TabsTrigger>
                                    <TabsTrigger value="instructor">Giảng viên</TabsTrigger>
                                    <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
                                </TabsList>

                                {/* Curriculum Tab - Flat lessons list */}
                                <TabsContent value="curriculum" className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {course.lessonCount} bài học • {formatDuration(totalDuration)}
                                        </p>
                                    </div>

                                    <Card variant="default" padding="none" className="overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                                        {course.lessons && course.lessons.length > 0 ? (
                                            course.lessons.map((lesson: LessonSummary, index: number) => (
                                                <div
                                                    key={lesson.id}
                                                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                                                            {index + 1}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            {lesson.isFree ? (
                                                                <Play className="w-4 h-4 text-primary-500" />
                                                            ) : (
                                                                <Lock className="w-4 h-4 text-gray-400" />
                                                            )}
                                                            <span className="text-gray-700 dark:text-gray-300">
                                                                {lesson.title}
                                                            </span>
                                                            {lesson.isFree && (
                                                                <Badge variant="success" size="sm">
                                                                    Xem thử
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDuration(lesson.duration)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                Nội dung khóa học đang được cập nhật
                                            </div>
                                        )}
                                    </Card>
                                </TabsContent>

                                {/* Description Tab */}
                                <TabsContent value="description">
                                    <Card variant="glass" padding="lg">
                                        <div className="prose prose-gray dark:prose-invert max-w-none">
                                            {course.description ? (
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: course.description.replace(/\n/g, "<br />"),
                                                    }}
                                                />
                                            ) : (
                                                <p className="text-gray-500">Chưa có mô tả chi tiết</p>
                                            )}
                                        </div>
                                    </Card>
                                </TabsContent>

                                {/* Instructor Tab */}
                                <TabsContent value="instructor">
                                    <Card variant="glass" padding="lg">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            <Avatar
                                                src={course.instructor.photoURL}
                                                name={course.instructor.name}
                                                size="xl"
                                            />
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white">
                                                        {course.instructor.name}
                                                    </h3>
                                                </div>

                                                {course.instructor.bio && (
                                                    <p className="text-gray-700 dark:text-gray-300">
                                                        {course.instructor.bio}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>

                                {/* Reviews Tab - Summary only */}
                                <TabsContent value="reviews" className="space-y-6">
                                    <Card variant="glass" padding="lg">
                                        <div className="flex flex-col md:flex-row items-center gap-8">
                                            <div className="text-center">
                                                <div className="text-5xl font-bold text-gray-900 dark:text-white">
                                                    {course.rating || "N/A"}
                                                </div>
                                                {course.rating && (
                                                    <div className="flex gap-1 my-2 justify-center">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-5 h-5 ${i < Math.floor(course.rating!)
                                                                    ? "fill-yellow-400 text-yellow-400"
                                                                    : "fill-gray-200 text-gray-200"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {course.reviewCount.toLocaleString()} đánh giá
                                                </p>
                                            </div>
                                            <div className="flex-1 text-center md:text-left">
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    Đánh giá chi tiết sẽ được cập nhật sớm
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Mobile Purchase Bar */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 p-4 z-40">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                    {formatPrice(course.discountPrice || course.price)}₫
                                </span>
                                {course.discountPrice && (
                                    <span className="text-sm text-gray-400 line-through">
                                        {formatPrice(course.price)}₫
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            leftIcon={isAuthenticated ? <ShoppingCart className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                            onClick={handleBuyAction}
                        >
                            {isAuthenticated ? "Thêm vào giỏ" : "Mua ngay"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Auth Modal for guests */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                defaultTab="login"
            />
        </>
    );
}
