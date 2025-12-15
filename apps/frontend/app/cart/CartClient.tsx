"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore, useWishlistStore, useAuthStore } from "@/stores";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AuthModal } from "@/components/features/auth";
import {
    Trash2,
    Heart,
    ShoppingCart,
    Tag,
    ChevronRight,
    Star,
    Clock,
    BookOpen,
} from "lucide-react";

export default function CartClient() {
    const { items, removeItem, clearCart, getTotal, getDiscountedTotal } = useCartStore();
    const { toggleItem } = useWishlistStore();
    const { isAuthenticated, openAuthModal } = useAuthStore();
    const [couponCode, setCouponCode] = useState("");
    const [couponApplied, setCouponApplied] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes} phút`;
    };

    const handleApplyCoupon = () => {
        // Mock coupon logic
        if (couponCode.toUpperCase() === "SAVE20") {
            setCouponApplied(true);
        }
    };

    const handleMoveToWishlist = (courseId: number) => {
        const item = items.find((i) => i.course.id === courseId);
        if (item) {
            toggleItem(item.course);
            removeItem(courseId);
        }
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            openAuthModal("login");
            return;
        }
        // Navigate to checkout
        window.location.href = "/checkout";
    };

    const total = getTotal();
    const discountedTotal = getDiscountedTotal();
    const savings = total - discountedTotal;
    const couponDiscount = couponApplied ? discountedTotal * 0.2 : 0;
    const finalTotal = discountedTotal - couponDiscount;

    return (
        <>
            <Header />
            <AuthModal />

            <main className="pt-24 pb-16 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
                            Giỏ hàng
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            {items.length} khóa học trong giỏ hàng
                        </p>
                    </div>

                    {items.length === 0 ? (
                        /* Empty Cart */
                        <Card variant="glass" className="text-center py-16">
                            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Giỏ hàng trống
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Hãy khám phá các khóa học và thêm vào giỏ hàng!
                            </p>
                            <Link href="/courses">
                                <Button variant="primary">
                                    Khám phá khóa học
                                </Button>
                            </Link>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {items.map(({ course }) => {
                                    const hasDiscount = course.discountPrice && course.discountPrice < course.price;

                                    return (
                                        <Card key={course.id} variant="glass" padding="none">
                                            <div className="flex flex-col sm:flex-row gap-4 p-4">
                                                {/* Thumbnail */}
                                                <Link
                                                    href={`/courses/${course.slug}`}
                                                    className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0"
                                                >
                                                    {course.thumbnail ? (
                                                        <Image
                                                            src={course.thumbnail}
                                                            alt={course.title}
                                                            fill
                                                            className="object-cover hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                                                            <BookOpen className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </Link>

                                                {/* Course Info */}
                                                <div className="flex-1 min-w-0">
                                                    <Link
                                                        href={`/courses/${course.slug}`}
                                                        className="font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2"
                                                    >
                                                        {course.title}
                                                    </Link>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {course.instructor.name}
                                                    </p>

                                                    {/* Stats */}
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
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

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <button
                                                            onClick={() => removeItem(course.id)}
                                                            className="text-sm text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Xóa
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveToWishlist(course.id)}
                                                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Heart className="w-4 h-4" />
                                                            Lưu vào yêu thích
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                        {formatPrice(course.discountPrice ?? course.price)}
                                                    </p>
                                                    {hasDiscount && (
                                                        <p className="text-sm text-gray-400 line-through">
                                                            {formatPrice(course.price)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}

                                {/* Clear Cart */}
                                {items.length > 1 && (
                                    <div className="text-right">
                                        <button
                                            onClick={clearCart}
                                            className="text-sm text-red-500 hover:underline cursor-pointer"
                                        >
                                            Xóa tất cả
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Order Summary */}
                            <div>
                                <Card variant="elevated" className="sticky top-24">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                        Tóm tắt đơn hàng
                                    </h2>

                                    {/* Price Breakdown */}
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Giá gốc ({items.length} khóa)
                                            </span>
                                            <span className="text-gray-900 dark:text-gray-100">
                                                {formatPrice(total)}
                                            </span>
                                        </div>
                                        {savings > 0 && (
                                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                                <span>Tiết kiệm</span>
                                                <span>-{formatPrice(savings)}</span>
                                            </div>
                                        )}
                                        {couponApplied && (
                                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                                <span>Mã giảm giá (20%)</span>
                                                <span>-{formatPrice(couponDiscount)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-slate-700 my-4 pt-4">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span className="text-gray-900 dark:text-gray-100">Tổng cộng</span>
                                            <span className="text-gray-900 dark:text-gray-100">
                                                {formatPrice(finalTotal)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Coupon */}
                                    <div className="mb-6">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Nhập mã giảm giá"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                leftIcon={<Tag className="w-4 h-4" />}
                                                disabled={couponApplied}
                                            />
                                            <Button
                                                variant="secondary"
                                                onClick={handleApplyCoupon}
                                                disabled={!couponCode || couponApplied}
                                            >
                                                Áp dụng
                                            </Button>
                                        </div>
                                        {couponApplied && (
                                            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                                                ✓ Mã giảm giá đã được áp dụng
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">
                                            Thử mã: SAVE20
                                        </p>
                                    </div>

                                    {/* Checkout Button */}
                                    <Button
                                        variant="accent"
                                        fullWidth
                                        size="lg"
                                        onClick={handleCheckout}
                                        rightIcon={<ChevronRight className="w-5 h-5" />}
                                    >
                                        Thanh toán
                                    </Button>

                                    {/* Trust Badges */}
                                    <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                                        <p>🔒 Thanh toán an toàn và bảo mật</p>
                                        <p className="mt-1">💰 Hoàn tiền trong 30 ngày</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
