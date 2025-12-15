"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores";
import { useLogin, useRegister } from "@/hooks";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";

export function AuthModal() {
    const { showAuthModal, authMode, closeAuthModal, switchAuthMode } = useAuthStore();
    const loginMutation = useLogin();
    const registerMutation = useRegister();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isLogin = authMode === "login";
    const isLoading = loginMutation.isPending || registerMutation.isPending;
    const error = loginMutation.error || registerMutation.error;

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!email) {
            newErrors.email = "Vui lòng nhập email";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Email không hợp lệ";
        }

        if (!password) {
            newErrors.password = "Vui lòng nhập mật khẩu";
        } else if (password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        if (!isLogin && !name) {
            newErrors.name = "Vui lòng nhập họ tên";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (isLogin) {
            loginMutation.mutate({ email, password });
        } else {
            registerMutation.mutate({ email, password, name });
        }
    };

    const handleClose = () => {
        closeAuthModal();
        setEmail("");
        setPassword("");
        setName("");
        setErrors({});
        loginMutation.reset();
        registerMutation.reset();
    };

    return (
        <Modal
            isOpen={showAuthModal}
            onClose={handleClose}
            size="sm"
        >
            <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
                    {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {isLogin
                        ? "Chào mừng trở lại! Đăng nhập để tiếp tục học."
                        : "Tham gia cùng hàng ngàn học viên khác."}
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-2 items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {(error as Error)?.message || "Đã xảy ra lỗi"}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name (Register only) */}
                {!isLogin && (
                    <Input
                        label="Họ tên"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        leftIcon={<User className="w-4 h-4" />}
                        error={errors.name}
                        disabled={isLoading}
                    />
                )}

                {/* Email */}
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={errors.email}
                    disabled={isLoading}
                />

                {/* Password */}
                <div className="relative">
                    <Input
                        label="Mật khẩu"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        leftIcon={<Lock className="w-4 h-4" />}
                        error={errors.password}
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {/* Forgot Password (Login only) */}
                {isLogin && (
                    <div className="text-right">
                        <button
                            type="button"
                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                        >
                            Quên mật khẩu?
                        </button>
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    isLoading={isLoading}
                >
                    {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-slate-800 text-gray-500">
                        hoặc
                    </span>
                </div>
            </div>

            {/* Google Sign In */}
            <Button
                type="button"
                variant="secondary"
                fullWidth
                leftIcon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                }
            >
                Tiếp tục với Google
            </Button>

            {/* Switch Mode */}
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                <button
                    type="button"
                    onClick={switchAuthMode}
                    className="text-primary-600 dark:text-primary-400 font-semibold hover:underline cursor-pointer"
                >
                    {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                </button>
            </p>
        </Modal>
    );
}
