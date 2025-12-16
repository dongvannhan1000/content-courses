"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    ArrowRight,
    Home,
    BookOpen,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, Button } from "@/components/ui";
import { paymentsApi, type PaymentVerifyResponse } from "@/lib/api/payments";
import { useCartStore } from "@/lib/stores";

function PaymentResultContent() {
    const searchParams = useSearchParams();
    const orderCode = searchParams.get("orderCode");
    const statusParam = searchParams.get("status");
    const clearCart = useCartStore((state) => state.clearCart);

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<PaymentVerifyResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyPayment = async () => {
            if (!orderCode) {
                setError("Không tìm thấy mã đơn hàng");
                setLoading(false);
                return;
            }

            try {
                const response = await paymentsApi.verifyPayment(orderCode);
                setResult(response);

                // Clear cart on successful payment
                if (response.success && response.status === "COMPLETED") {
                    clearCart();
                }
            } catch (err: unknown) {
                console.error("Verify payment error:", err);
                // If already set as success from URL param, treat as success
                if (statusParam === "success") {
                    setResult({
                        success: true,
                        status: "COMPLETED",
                        message: "Thanh toán thành công!",
                        paymentId: 0,
                    });
                    clearCart();
                } else {
                    const errorObj = err as { message?: string };
                    setError(errorObj.message || "Không thể xác minh thanh toán");
                }
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [orderCode, statusParam, clearCart]);

    // Loading State
    if (loading) {
        return (
            <Card variant="glass" padding="lg" className="text-center py-16 max-w-lg mx-auto">
                <Loader2 className="w-16 h-16 animate-spin text-primary-500 mx-auto mb-6" />
                <h2 className="font-display font-semibold text-2xl text-gray-900 dark:text-white mb-2">
                    Đang xác minh thanh toán...
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Vui lòng đợi trong giây lát
                </p>
            </Card>
        );
    }

    // Error State
    if (error) {
        return (
            <Card variant="glass" padding="lg" className="text-center py-16 max-w-lg mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="font-display font-semibold text-2xl text-gray-900 dark:text-white mb-2">
                    Có lỗi xảy ra
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/cart">
                        <Button variant="secondary">Quay lại giỏ hàng</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" leftIcon={<Home className="w-4 h-4" />}>
                            Về trang chủ
                        </Button>
                    </Link>
                </div>
            </Card>
        );
    }

    // Success State
    if (result?.success && result.status === "COMPLETED") {
        return (
            <Card variant="glass" padding="lg" className="text-center py-16 max-w-lg mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">
                    Thanh toán thành công! 🎉
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Cảm ơn bạn đã mua khóa học.
                </p>
                {result.course && (
                    <p className="text-primary-600 dark:text-primary-400 font-medium mb-6">
                        {result.course.title}
                    </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    Bạn có thể truy cập khóa học từ Dashboard ngay bây giờ.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/dashboard">
                        <Button
                            variant="primary"
                            size="lg"
                            rightIcon={<ArrowRight className="w-5 h-5" />}
                        >
                            Đi tới Dashboard
                        </Button>
                    </Link>
                    <Link href="/courses">
                        <Button
                            variant="secondary"
                            size="lg"
                            leftIcon={<BookOpen className="w-5 h-5" />}
                        >
                            Tiếp tục mua sắm
                        </Button>
                    </Link>
                </div>

                {/* Order Info */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Mã đơn hàng: <span className="font-mono font-medium">{orderCode}</span>
                    </p>
                </div>
            </Card>
        );
    }

    // Pending State
    if (result?.status === "PENDING") {
        return (
            <Card variant="glass" padding="lg" className="text-center py-16 max-w-lg mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <Clock className="w-10 h-10 text-yellow-500" />
                </div>
                <h2 className="font-display font-semibold text-2xl text-gray-900 dark:text-white mb-2">
                    Đang chờ xác nhận
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Thanh toán của bạn đang được xử lý. Vui lòng đợi trong giây lát.
                </p>
                <Button
                    variant="secondary"
                    onClick={() => window.location.reload()}
                    leftIcon={<Loader2 className="w-4 h-4" />}
                >
                    Kiểm tra lại
                </Button>
            </Card>
        );
    }

    // Failed State
    return (
        <Card variant="glass" padding="lg" className="text-center py-16 max-w-lg mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="font-display font-semibold text-2xl text-gray-900 dark:text-white mb-2">
                Thanh toán không thành công
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                {result?.message || "Có lỗi xảy ra trong quá trình thanh toán."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/cart">
                    <Button variant="primary">Thử lại</Button>
                </Link>
                <Link href="/">
                    <Button variant="ghost" leftIcon={<Home className="w-4 h-4" />}>
                        Về trang chủ
                    </Button>
                </Link>
            </div>
        </Card>
    );
}

export default function PaymentResultPage() {
    return (
        <main className="min-h-screen">
            <Header />

            <div className="min-h-screen py-8 pt-24">
                <div className="max-w-6xl mx-auto px-4">
                    <Suspense
                        fallback={
                            <Card variant="glass" padding="lg" className="text-center py-16 max-w-lg mx-auto">
                                <Loader2 className="w-16 h-16 animate-spin text-primary-500 mx-auto mb-6" />
                                <h2 className="font-display font-semibold text-2xl text-gray-900 dark:text-white mb-2">
                                    Đang tải...
                                </h2>
                            </Card>
                        }
                    >
                        <PaymentResultContent />
                    </Suspense>
                </div>
            </div>

            <Footer />
        </main>
    );
}
