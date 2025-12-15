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
    CheckCircle,
    Lock,
    ChevronDown,
    ChevronUp,
    Heart,
    Share2,
    FileText,
    ShoppingCart,
} from "lucide-react";
import { Button, Badge, Avatar, Card, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";

interface CourseDetailClientProps {
    course: any; // TODO: Replace with proper type
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

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(date));
}

export default function CourseDetailClient({ course }: CourseDetailClientProps) {
    const [expandedModules, setExpandedModules] = useState<number[]>([1]);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const toggleModule = (moduleId: number) => {
        setExpandedModules((prev) =>
            prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
        );
    };

    const totalDuration = course.modules.reduce(
        (total: number, module: any) =>
            total + module.lessons.reduce((sum: number, lesson: any) => sum + lesson.duration, 0),
        0
    );

    const discountPercentage = course.discountPrice
        ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
        : 0;

    return (
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
                                <span>/</span>
                                <a
                                    href={`/courses?category=${course.category.slug}`}
                                    className="hover:text-white transition-colors"
                                >
                                    {course.category.name}
                                </a>
                            </div>

                            {/* Title & Badges */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {course.enrollmentCount > 100 && (
                                        <Badge variant="accent">Bestseller</Badge>
                                    )}
                                    <Badge variant="primary">{course.level}</Badge>
                                </div>
                                <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight">
                                    {course.title}
                                </h1>
                                <p className="text-lg text-gray-300">{course.shortDesc}</p>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold text-lg">{course.rating}</span>
                                    </div>
                                    <span className="text-gray-400">
                                        ({course.reviewCount.toLocaleString()} đánh giá)
                                    </span>
                                </div>
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
                                        <Image
                                            src={course.thumbnail}
                                            alt={course.title}
                                            fill
                                            className="object-cover"
                                        />
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
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                fullWidth
                                                leftIcon={<ShoppingCart className="w-5 h-5" />}
                                            >
                                                Thêm vào giỏ hàng
                                            </Button>
                                            <Button variant="secondary" size="lg" fullWidth>
                                                Mua ngay
                                            </Button>
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
                        {/* What you'll learn */}
                        <section>
                            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">
                                Bạn sẽ học được gì?
                            </h2>
                            <Card variant="glass" padding="lg">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {course.whatYouWillLearn.map((item: string, index: number) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </section>

                        {/* Tabs: Curriculum, Instructor, Reviews */}
                        <Tabs defaultValue="curriculum">
                            <TabsList className="mb-6">
                                <TabsTrigger value="curriculum">Nội dung khóa học</TabsTrigger>
                                <TabsTrigger value="instructor">Giảng viên</TabsTrigger>
                                <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
                            </TabsList>

                            {/* Curriculum Tab */}
                            <TabsContent value="curriculum" className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {course.modules.length} modules •{" "}
                                        {course.lessonCount} bài học •{" "}
                                        {formatDuration(totalDuration)}
                                    </p>
                                    <button
                                        onClick={() =>
                                            setExpandedModules(
                                                expandedModules.length === course.modules.length
                                                    ? []
                                                    : course.modules.map((m: any) => m.id)
                                            )
                                        }
                                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                                    >
                                        {expandedModules.length === course.modules.length
                                            ? "Thu gọn tất cả"
                                            : "Mở rộng tất cả"}
                                    </button>
                                </div>

                                {course.modules.map((module: any) => (
                                    <Card
                                        key={module.id}
                                        variant="default"
                                        padding="none"
                                        className="overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleModule(module.id)}
                                            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                {expandedModules.includes(module.id) ? (
                                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                                )}
                                                <h3 className="font-semibold text-gray-900 dark:text-white text-left">
                                                    {module.title}
                                                </h3>
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {module.lessons.length} bài học
                                            </span>
                                        </button>

                                        {expandedModules.includes(module.id) && (
                                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {module.lessons.map((lesson: any) => (
                                                    <div
                                                        key={lesson.id}
                                                        className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors"
                                                    >
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
                                                                <Badge
                                                                    variant="success"
                                                                    size="sm"
                                                                >
                                                                    Xem thử
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {formatDuration(lesson.duration)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card>
                                ))}
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
                                                <p className="text-primary-600 dark:text-primary-400">
                                                    {course.instructor.title} tại{" "}
                                                    {course.instructor.company}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                    <span>
                                                        {course.instructor.rating} đánh giá
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-5 h-5 text-primary-500" />
                                                    <span>
                                                        {course.instructor.studentCount.toLocaleString()}{" "}
                                                        học viên
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-5 h-5 text-primary-500" />
                                                    <span>
                                                        {course.instructor.courseCount} khóa học
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-gray-700 dark:text-gray-300">
                                                {course.instructor.bio}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* Reviews Tab */}
                            <TabsContent value="reviews" className="space-y-6">
                                {/* Rating Summary */}
                                <Card variant="glass" padding="lg">
                                    <div className="flex flex-col md:flex-row items-center gap-8">
                                        <div className="text-center">
                                            <div className="text-5xl font-bold text-gray-900 dark:text-white">
                                                {course.rating}
                                            </div>
                                            <div className="flex gap-1 my-2 justify-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-5 h-5 ${i < Math.floor(course.rating)
                                                                ? "fill-yellow-400 text-yellow-400"
                                                                : "fill-gray-200 text-gray-200"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {course.reviewCount.toLocaleString()} đánh giá
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Reviews List */}
                                <div className="space-y-4">
                                    {course.reviews.map((review: any) => (
                                        <Card key={review.id} variant="default" padding="lg">
                                            <div className="flex gap-4">
                                                <Avatar
                                                    src={review.user.photoURL}
                                                    name={review.user.name}
                                                    size="md"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                                {review.user.name}
                                                            </h4>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex gap-0.5">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star
                                                                            key={i}
                                                                            className={`w-4 h-4 ${i < review.rating
                                                                                    ? "fill-yellow-400 text-yellow-400"
                                                                                    : "fill-gray-200 text-gray-200"
                                                                                }`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {formatDate(review.createdAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300">
                                                        {review.comment}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Requirements */}
                        <section>
                            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">
                                Yêu cầu
                            </h2>
                            <ul className="space-y-3">
                                {course.requirements.map((req: string, index: number) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                                    >
                                        <CheckCircle className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </section>
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
                    <Button variant="primary" leftIcon={<ShoppingCart className="w-5 h-5" />}>
                        Thêm vào giỏ
                    </Button>
                </div>
            </div>
        </div>
    );
}
