"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCourse, useEnrollmentCheck, useEnroll } from "@/hooks";
import { useAuthStore, useCartStore, useWishlistStore } from "@/stores";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { AuthModal } from "@/components/features/auth";
import {
    Play,
    Clock,
    BookOpen,
    Users,
    Star,
    Heart,
    ShoppingCart,
    CheckCircle,
    Lock,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

interface CourseDetailClientProps {
    slug: string;
}

export default function CourseDetailClient({ slug }: CourseDetailClientProps) {
    const { data: course, isLoading, error } = useCourse(slug);
    const { isAuthenticated, openAuthModal } = useAuthStore();
    const { addItem, isInCart } = useCartStore();
    const { isInWishlist, toggleItem } = useWishlistStore();
    const { data: enrollmentCheck } = useEnrollmentCheck(course?.id ?? 0);
    const enrollMutation = useEnroll();

    const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "reviews">("overview");
    const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());

    const isEnrolled = enrollmentCheck?.enrolled ?? false;
    const courseInCart = course ? isInCart(course.id) : false;
    const courseInWishlist = course ? isInWishlist(course.id) : false;

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes} phút`;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            openAuthModal("login");
            return;
        }
        if (course) {
            addItem(course);
        }
    };

    const handleBuyNow = () => {
        if (!isAuthenticated) {
            openAuthModal("login");
            return;
        }
        // Add to cart and redirect to checkout
        if (course && !courseInCart) {
            addItem(course);
        }
        // Navigate to cart
        window.location.href = "/cart";
    };

    const handleEnroll = () => {
        if (!isAuthenticated) {
            openAuthModal("login");
            return;
        }
        if (course) {
            enrollMutation.mutate(course.id);
        }
    };

    const handleWishlist = () => {
        if (!isAuthenticated) {
            openAuthModal("login");
            return;
        }
        if (course) {
            toggleItem(course);
        }
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <main className="pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <Skeleton variant="rounded" height={400} />
                                <Skeleton variant="text" height={40} width="70%" />
                                <Skeleton variant="text" height={24} />
                            </div>
                            <div>
                                <Skeleton variant="rounded" height={400} />
                            </div>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    if (error || !course) {
        return (
            <>
                <Header />
                <main className="pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 text-center py-20">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Không tìm thấy khóa học
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Khóa học này có thể đã bị xóa hoặc không tồn tại.
                        </p>
                        <Link href="/courses">
                            <Button variant="primary" className="mt-6">
                                Xem các khóa học khác
                            </Button>
                        </Link>
                    </div>
                </main>
            </>
        );
    }

    const hasDiscount = course.discountPrice && course.discountPrice < course.price;
    const discountPercent = hasDiscount
        ? Math.round(((course.price - course.discountPrice!) / course.price) * 100)
        : 0;

    return (
        <>
            <Header />
            <AuthModal />

            <main className="pt-24 pb-16">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Course Info */}
                            <div className="lg:col-span-2 space-y-4">
                                {/* Breadcrumb */}
                                <nav className="flex items-center gap-2 text-sm text-gray-400">
                                    <Link href="/" className="hover:text-white">Trang chủ</Link>
                                    <span>/</span>
                                    <Link href="/courses" className="hover:text-white">Khóa học</Link>
                                    {course.category && (
                                        <>
                                            <span>/</span>
                                            <Link
                                                href={`/courses?category=${course.category.slug}`}
                                                className="hover:text-white"
                                            >
                                                {course.category.name}
                                            </Link>
                                        </>
                                    )}
                                </nav>

                                <h1 className="text-3xl md:text-4xl font-display font-bold">
                                    {course.title}
                                </h1>

                                <p className="text-lg text-gray-300">
                                    {course.shortDesc}
                                </p>

                                {/* Stats */}
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    {course.rating && (
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span className="font-semibold">{course.rating.toFixed(1)}</span>
                                            <span className="text-gray-400">
                                                ({course.reviewCount} đánh giá)
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <Users className="w-4 h-4" />
                                        <span>{course.enrollmentCount.toLocaleString()} học viên</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatDuration(course.duration)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{course.lessonCount} bài học</span>
                                    </div>
                                </div>

                                {/* Instructor */}
                                <div className="flex items-center gap-3 pt-2">
                                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                                        {course.instructor.photoURL ? (
                                            <Image
                                                src={course.instructor.photoURL}
                                                alt={course.instructor.name}
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <span className="text-white font-semibold">
                                                {course.instructor.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Giảng viên</p>
                                        <p className="font-medium">{course.instructor.name}</p>
                                    </div>
                                </div>

                                {/* Level Badge */}
                                {course.level && (
                                    <Badge variant="primary" size="md">
                                        {course.level === "beginner" && "Cơ bản"}
                                        {course.level === "intermediate" && "Trung cấp"}
                                        {course.level === "advanced" && "Nâng cao"}
                                    </Badge>
                                )}
                            </div>

                            {/* Video Preview (Mobile) */}
                            <div className="lg:hidden relative aspect-video rounded-xl overflow-hidden bg-slate-700">
                                {course.thumbnail ? (
                                    <Image
                                        src={course.thumbnail}
                                        alt={course.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Play className="w-16 h-16 text-white/50" />
                                    </div>
                                )}
                                <button className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer">
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Play className="w-8 h-8 text-white" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Course Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Tabs */}
                            <Card variant="glass" padding="none">
                                <div className="border-b border-gray-200 dark:border-slate-700">
                                    <nav className="flex">
                                        {[
                                            { id: "overview", label: "Tổng quan" },
                                            { id: "curriculum", label: "Nội dung" },
                                            { id: "reviews", label: "Đánh giá" },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                                className={`px-6 py-4 font-medium transition-colors cursor-pointer ${activeTab === tab.id
                                                        ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600"
                                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </nav>
                                </div>

                                <div className="p-6">
                                    {/* Overview Tab */}
                                    {activeTab === "overview" && (
                                        <div className="prose dark:prose-invert max-w-none">
                                            <h3 className="text-xl font-semibold mb-4">Mô tả khóa học</h3>
                                            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                                {course.description}
                                            </div>
                                        </div>
                                    )}

                                    {/* Curriculum Tab */}
                                    {activeTab === "curriculum" && (
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-semibold mb-4">
                                                Nội dung khóa học ({course.lessonCount} bài học)
                                            </h3>
                                            {course.lessons?.map((lesson, index) => (
                                                <div
                                                    key={lesson.id}
                                                    className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden"
                                                >
                                                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                        <div className="flex items-center gap-3">
                                                            {lesson.isFree || isEnrolled ? (
                                                                <Play className="w-4 h-4 text-primary-500" />
                                                            ) : (
                                                                <Lock className="w-4 h-4 text-gray-400" />
                                                            )}
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                {index + 1}.
                                                            </span>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                {lesson.title}
                                                            </span>
                                                            {lesson.isFree && !isEnrolled && (
                                                                <Badge variant="success" size="sm">
                                                                    Miễn phí
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-500">
                                                            {formatDuration(lesson.duration)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reviews Tab */}
                                    {activeTab === "reviews" && (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>Chưa có đánh giá nào</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Right Column - Purchase Card */}
                        <div className="lg:-mt-48">
                            <Card variant="elevated" padding="none" className="sticky top-24">
                                {/* Video Preview (Desktop) */}
                                <div className="hidden lg:block relative aspect-video rounded-t-2xl overflow-hidden bg-slate-700">
                                    {course.thumbnail ? (
                                        <Image
                                            src={course.thumbnail}
                                            alt={course.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Play className="w-16 h-16 text-white/50" />
                                        </div>
                                    )}
                                    <button className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer">
                                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <Play className="w-8 h-8 text-white" />
                                        </div>
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Price */}
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                            {formatPrice(course.discountPrice ?? course.price)}
                                        </span>
                                        {hasDiscount && (
                                            <>
                                                <span className="text-lg text-gray-400 line-through">
                                                    {formatPrice(course.price)}
                                                </span>
                                                <Badge variant="danger" size="sm">
                                                    -{discountPercent}%
                                                </Badge>
                                            </>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {isEnrolled ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="font-medium">Bạn đã đăng ký khóa học này</span>
                                            </div>
                                            <Button variant="primary" fullWidth size="lg">
                                                Tiếp tục học
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {courseInCart ? (
                                                <Link href="/cart">
                                                    <Button variant="accent" fullWidth size="lg">
                                                        <ShoppingCart className="w-5 h-5 mr-2" />
                                                        Đi đến giỏ hàng
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="accent"
                                                        fullWidth
                                                        size="lg"
                                                        onClick={handleBuyNow}
                                                    >
                                                        Mua ngay
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        fullWidth
                                                        size="lg"
                                                        onClick={handleAddToCart}
                                                        leftIcon={<ShoppingCart className="w-5 h-5" />}
                                                    >
                                                        Thêm vào giỏ hàng
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Wishlist */}
                                    <button
                                        onClick={handleWishlist}
                                        className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors cursor-pointer ${courseInWishlist
                                                ? "text-red-500"
                                                : "text-gray-600 dark:text-gray-400 hover:text-red-500"
                                            }`}
                                    >
                                        <Heart
                                            className={`w-4 h-4 ${courseInWishlist ? "fill-current" : ""}`}
                                        />
                                        {courseInWishlist ? "Đã thêm vào yêu thích" : "Thêm vào yêu thích"}
                                    </button>

                                    {/* Course Includes */}
                                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                            Khóa học bao gồm:
                                        </h4>
                                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                            <li className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-primary-500" />
                                                {formatDuration(course.duration)} video
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-primary-500" />
                                                {course.lessonCount} bài học
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-primary-500" />
                                                Truy cập trọn đời
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-primary-500" />
                                                Chứng chỉ hoàn thành
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
