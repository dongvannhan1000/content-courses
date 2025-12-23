"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Trash2,
    ShoppingCart,
    ArrowLeft,
    CreditCard,
    Lock,
    Loader2,
    CheckCircle,
    AlertCircle,
    Square,
    CheckSquare,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, Button, Badge } from "@/components/ui";
import { RequireAuth } from "@/components/auth";
import { useCartStore } from "@/lib/stores";
import { useAuth } from "@/lib/hooks/useAuth";
import { paymentsApi } from "@/lib/api";

function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price);
}

export default function CartPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { items, removeItem, clearCart } = useCartStore();
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // Selection state - track selected course IDs
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Initialize selection with all items when items change
    useEffect(() => {
        setSelectedIds(new Set(items.map(item => item.course.id)));
    }, [items]);

    // Selection handlers
    const toggleItem = (courseId: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(courseId)) {
                newSet.delete(courseId);
            } else {
                newSet.add(courseId);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        setSelectedIds(new Set(items.map(item => item.course.id)));
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    const isAllSelected = selectedIds.size === items.length && items.length > 0;
    const isNoneSelected = selectedIds.size === 0;

    // Calculate selected items and total
    const selectedItems = useMemo(() =>
        items.filter(item => selectedIds.has(item.course.id)),
        [items, selectedIds]
    );

    const selectedTotal = useMemo(() =>
        selectedItems.reduce(
            (total, item) => total + (item.course.discountPrice || item.course.price),
            0
        ),
        [selectedItems]
    );

    const handleCheckout = async () => {
        // Check auth
        if (!user) {
            router.push("/auth/login?redirect=/cart");
            return;
        }

        if (selectedIds.size === 0) return;

        setCheckoutLoading(true);
        setCheckoutError(null);

        try {
            const courseIds = Array.from(selectedIds);
            const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

            // Create batch payment for selected courses
            const response = await paymentsApi.createBatchPayment(
                courseIds,
                `${baseUrl}/payment/result`,
                `${baseUrl}/cart`
            );

            if (response.success && response.paymentUrl) {
                // Redirect to PayOS payment page
                window.location.href = response.paymentUrl;
            } else {
                setCheckoutError("Không thể khởi tạo thanh toán. Vui lòng thử lại.");
            }
        } catch (err: unknown) {
            console.error("Checkout error:", err);
            const errorObj = err as { message?: string };
            setCheckoutError(errorObj.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setCheckoutLoading(false);
        }
    };

    return (
        <main className="min-h-screen">
            <Header />
            <RequireAuth>
                <div className="min-h-screen py-8 pt-24">
                    <div className="max-w-6xl mx-auto px-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">
                                    Giỏ hàng
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {items.length} khóa học trong giỏ hàng
                                    {selectedIds.size > 0 && selectedIds.size < items.length && (
                                        <span className="ml-2 text-primary-600 dark:text-primary-400">
                                            ({selectedIds.size} đã chọn)
                                        </span>
                                    )}
                                </p>
                            </div>
                            <Link href="/courses">
                                <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                                    Tiếp tục mua
                                </Button>
                            </Link>
                        </div>

                        {items.length === 0 ? (
                            /* Empty Cart State */
                            <Card variant="glass" padding="lg" className="text-center py-16">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                    <ShoppingCart className="w-12 h-12 text-gray-400" />
                                </div>
                                <h2 className="font-display font-semibold text-2xl text-gray-900 dark:text-white mb-2">
                                    Giỏ hàng trống
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                    Bạn chưa có khóa học nào trong giỏ hàng. Khám phá các khóa học của chúng tôi ngay!
                                </p>
                                <Link href="/courses">
                                    <Button variant="primary" size="lg">
                                        Khám phá khóa học
                                    </Button>
                                </Link>
                            </Card>
                        ) : (
                            /* Cart with Items */
                            <div className="grid lg:grid-cols-3 gap-8">
                                {/* Cart Items */}
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Select All Header */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <button
                                            onClick={isAllSelected ? deselectAll : selectAll}
                                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                                        >
                                            {isAllSelected ? (
                                                <CheckSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                            <span className="font-medium">
                                                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                            </span>
                                        </button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearCart}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            Xóa tất cả
                                        </Button>
                                    </div>

                                    {items.map((item) => {
                                        const course = item.course;
                                        const displayPrice = course.discountPrice || course.price;
                                        const hasDiscount = !!course.discountPrice;
                                        const isSelected = selectedIds.has(course.id);

                                        return (
                                            <Card
                                                key={course.id}
                                                variant="default"
                                                padding="none"
                                                className={`overflow-hidden transition-all ${isSelected
                                                    ? "ring-2 ring-primary-500 dark:ring-primary-400"
                                                    : "opacity-60"
                                                    }`}
                                            >
                                                <div className="flex flex-col sm:flex-row">
                                                    {/* Checkbox + Thumbnail */}
                                                    <div className="flex">
                                                        <button
                                                            onClick={() => toggleItem(course.id)}
                                                            className="flex items-center justify-center w-12 sm:w-14 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                            aria-label={isSelected ? "Bỏ chọn" : "Chọn"}
                                                        >
                                                            {isSelected ? (
                                                                <CheckSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                                            ) : (
                                                                <Square className="w-6 h-6 text-gray-400" />
                                                            )}
                                                        </button>
                                                        <div className="relative w-32 sm:w-40 h-24 sm:h-28 shrink-0">
                                                            {course.thumbnail ? (
                                                                <Image
                                                                    src={course.thumbnail}
                                                                    alt={course.title}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="(max-width: 640px) 128px, 160px"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 p-4 sm:p-5">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <Link
                                                                    href={`/courses/${course.slug}`}
                                                                    className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2"
                                                                >
                                                                    {course.title}
                                                                </Link>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                                    {course.instructor.name}
                                                                </p>
                                                                {course.level && (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className="mt-2"
                                                                    >
                                                                        {course.level}
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {/* Price & Remove */}
                                                            <div className="text-right">
                                                                <div className="font-bold text-lg text-primary-600 dark:text-primary-400">
                                                                    {formatPrice(displayPrice)}₫
                                                                </div>
                                                                {hasDiscount && (
                                                                    <div className="text-sm text-gray-400 line-through">
                                                                        {formatPrice(course.price)}₫
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={() => removeItem(course.id)}
                                                                    className="mt-2 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                                                                    aria-label="Xóa khỏi giỏ hàng"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>

                                {/* Order Summary */}
                                <div className="lg:col-span-1">
                                    <Card variant="elevated" padding="lg" className="sticky top-28">
                                        <h3 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-6">
                                            Tóm tắt đơn hàng
                                        </h3>

                                        {/* Selected Items Summary */}
                                        {selectedItems.length > 0 ? (
                                            <div className="space-y-3 mb-6">
                                                {selectedItems.map((item) => (
                                                    <div
                                                        key={item.course.id}
                                                        className="flex justify-between text-sm"
                                                    >
                                                        <span className="text-gray-600 dark:text-gray-400 line-clamp-1 flex-1 mr-2">
                                                            {item.course.title}
                                                        </span>
                                                        <span className="text-gray-900 dark:text-white font-medium whitespace-nowrap">
                                                            {formatPrice(
                                                                item.course.discountPrice || item.course.price
                                                            )}
                                                            ₫
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                                <p>Chưa chọn khóa học nào</p>
                                                <p className="text-sm mt-1">Hãy chọn ít nhất 1 khóa học để thanh toán</p>
                                            </div>
                                        )}

                                        {/* Divider */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

                                        {/* Total */}
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                Tổng cộng ({selectedItems.length} khóa học)
                                            </span>
                                            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                                {formatPrice(selectedTotal)}₫
                                            </span>
                                        </div>

                                        {/* Error Message */}
                                        {checkoutError && (
                                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    {checkoutError}
                                                </p>
                                            </div>
                                        )}

                                        {/* Checkout Button */}
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            fullWidth
                                            onClick={handleCheckout}
                                            disabled={checkoutLoading || authLoading || isNoneSelected}
                                            leftIcon={
                                                checkoutLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <CreditCard className="w-5 h-5" />
                                                )
                                            }
                                        >
                                            {checkoutLoading
                                                ? "Đang xử lý..."
                                                : isNoneSelected
                                                    ? "Chọn khóa học để thanh toán"
                                                    : user
                                                        ? `Thanh toán ${selectedItems.length} khóa học`
                                                        : "Đăng nhập để thanh toán"}
                                        </Button>

                                        {/* Security Note */}
                                        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
                                            <Lock className="w-4 h-4" />
                                            <span>Thanh toán an toàn & bảo mật</span>
                                        </div>

                                        {/* Guarantee */}
                                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                            <p className="text-sm text-green-700 dark:text-green-400">
                                                Đảm bảo hoàn tiền trong 30 ngày nếu không hài lòng
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </RequireAuth>

            <Footer />
        </main>
    );
}
