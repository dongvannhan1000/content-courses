"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlistStore, useCartStore, useAuthStore } from "@/stores";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Heart,
    ShoppingCart,
    Trash2,
    Star,
    Clock,
    BookOpen,
    Play,
} from "lucide-react";

export default function WishlistPage() {
    const { items, removeItem, clearWishlist } = useWishlistStore();
    const { addItem: addToCart, isInCart } = useCartStore();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes} phút`;
    };

    const handleAddToCart = (courseId: number) => {
        const course = items.find((c) => c.id === courseId);
        if (course) {
            addToCart(course);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
                        Danh sách yêu thích
                    </h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        {items.length} khóa học
                    </p>
                </div>
                {items.length > 0 && (
                    <button
                        onClick={clearWishlist}
                        className="text-sm text-red-500 hover:underline cursor-pointer"
                    >
                        Xóa tất cả
                    </button>
                )}
            </div>

            {/* Empty State */}
            {items.length === 0 ? (
                <Card variant="glass" className="text-center py-12">
                    <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Danh sách yêu thích trống
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Lưu các khóa học bạn quan tâm để xem sau
                    </p>
                    <Link href="/courses">
                        <Button variant="primary">Khám phá khóa học</Button>
                    </Link>
                </Card>
            ) : (
                /* Wishlist Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items.map((course) => {
                        const hasDiscount = course.discountPrice && course.discountPrice < course.price;
                        const inCart = isInCart(course.id);

                        return (
                            <Card
                                key={course.id}
                                variant="glass"
                                padding="none"
                                className="overflow-hidden"
                            >
                                {/* Thumbnail */}
                                <Link
                                    href={`/courses/${course.slug}`}
                                    className="block relative aspect-video bg-gray-200 dark:bg-slate-700"
                                >
                                    {course.thumbnail ? (
                                        <Image
                                            src={course.thumbnail}
                                            alt={course.title}
                                            fill
                                            className="object-cover hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Play className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}

                                    {/* Discount Badge */}
                                    {hasDiscount && (
                                        <div className="absolute top-3 left-3">
                                            <Badge variant="danger" size="sm">
                                                -{Math.round(
                                                    ((course.price - course.discountPrice!) / course.price) * 100
                                                )}%
                                            </Badge>
                                        </div>
                                    )}
                                </Link>

                                {/* Content */}
                                <div className="p-5">
                                    <Link href={`/courses/${course.slug}`}>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 hover:text-primary-600 dark:hover:text-primary-400">
                                            {course.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                        {course.instructor.name}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        {course.rating && (
                                            <span className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                {course.rating.toFixed(1)}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {formatDuration(course.duration)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-4 h-4" />
                                            {course.lessonCount} bài
                                        </span>
                                    </div>

                                    {/* Price & Actions */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                {formatPrice(course.discountPrice ?? course.price)}
                                            </span>
                                            {hasDiscount && (
                                                <span className="ml-2 text-sm text-gray-400 line-through">
                                                    {formatPrice(course.price)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => removeItem(course.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                                                title="Xóa khỏi yêu thích"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            {inCart ? (
                                                <Link href="/cart">
                                                    <Button variant="secondary" size="sm">
                                                        Trong giỏ
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Button
                                                    variant="accent"
                                                    size="sm"
                                                    onClick={() => handleAddToCart(course.id)}
                                                    leftIcon={<ShoppingCart className="w-4 h-4" />}
                                                >
                                                    Thêm
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
