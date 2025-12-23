"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { useAuth } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [showPassword, setShowPassword] = useState(false);
    const { success, error: showError } = useToast();

    // Use auth hook
    const { signIn, register, signInWithGoogle, forgotPassword, isLoading, error, clearError } = useAuth();

    // Form states
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [registerForm, setRegisterForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // Forgot password states
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState(false);

    // Clear error when switching tabs
    useEffect(() => {
        clearError();
    }, [activeTab, clearError]);

    // Clear forms when modal closes
    useEffect(() => {
        if (!isOpen) {
            setLoginForm({ email: "", password: "" });
            setRegisterForm({ name: "", email: "", password: "", confirmPassword: "" });
            setShowPassword(false);
            setShowForgotPassword(false);
            setForgotEmail("");
            setForgotSuccess(false);
            clearError();
        }
    }, [isOpen, clearError]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await signIn(loginForm.email, loginForm.password);

        if (result.success) {
            success("Đăng nhập thành công!");
            onClose();
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (registerForm.password !== registerForm.confirmPassword) {
            showError("Mật khẩu không khớp!");
            return;
        }

        if (registerForm.password.length < 6) {
            showError("Mật khẩu phải có ít nhất 6 ký tự!");
            return;
        }

        const result = await register({
            email: registerForm.email,
            password: registerForm.password,
            name: registerForm.name,
        });

        if (result.success) {
            success("Đăng ký thành công!");
            onClose();
        }
    };

    const handleGoogleLogin = async () => {
        const result = await signInWithGoogle();

        if (result.success) {
            success("Đăng nhập thành công!");
            onClose();
        }
    };

    // Handle forgot password
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await forgotPassword(forgotEmail);

        if (result.success) {
            setForgotSuccess(true);
        }
    };

    // Handle back to login from forgot password
    const handleBackToLogin = () => {
        setShowForgotPassword(false);
        setForgotSuccess(false);
        setForgotEmail("");
        clearError();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">CC</span>
                </div>
                <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
                    Chào mừng đến với Nghề Content
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Học Content Marketing từ những chuyên gia hàng đầu
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Login/Register Tabs - hidden when showing forgot password */}
            {!showForgotPassword && (
                <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                        <TabsTrigger value="register">Đăng ký</TabsTrigger>
                    </TabsList>

                    {/* Login Form */}
                    <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                placeholder="email@example.com"
                                leftIcon={<Mail className="w-5 h-5" />}
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                required
                                disabled={isLoading}
                            />

                            <div className="relative">
                                <Input
                                    label="Mật khẩu"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    leftIcon={<Lock className="w-5 h-5" />}
                                    value={loginForm.password}
                                    onChange={(e) =>
                                        setLoginForm({ ...loginForm, password: e.target.value })
                                    }
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded text-primary-500" />
                                    <span className="text-gray-600 dark:text-gray-400">Ghi nhớ đăng nhập</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgotPassword(true);
                                        setForgotEmail(loginForm.email);
                                        setForgotSuccess(false);
                                        clearError();
                                    }}
                                    className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                                >
                                    Quên mật khẩu?
                                </button>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={isLoading}
                                rightIcon={<ArrowRight className="w-5 h-5" />}
                            >
                                Đăng nhập
                            </Button>
                        </form>

                        {/* Social Login */}
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                                        Hoặc đăng nhập bằng
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    fullWidth
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                    leftIcon={
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                    }
                                >
                                    Đăng nhập với Google
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Register Form */}
                    <TabsContent value="register">
                        <form onSubmit={handleRegister} className="space-y-4">
                            <Input
                                label="Họ tên"
                                type="text"
                                placeholder="Nguyễn Văn A"
                                leftIcon={<User className="w-5 h-5" />}
                                value={registerForm.name}
                                onChange={(e) =>
                                    setRegisterForm({ ...registerForm, name: e.target.value })
                                }
                                required
                                disabled={isLoading}
                            />

                            <Input
                                label="Email"
                                type="email"
                                placeholder="email@example.com"
                                leftIcon={<Mail className="w-5 h-5" />}
                                value={registerForm.email}
                                onChange={(e) =>
                                    setRegisterForm({ ...registerForm, email: e.target.value })
                                }
                                required
                                disabled={isLoading}
                            />

                            <div className="relative">
                                <Input
                                    label="Mật khẩu"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Tối thiểu 6 ký tự"
                                    leftIcon={<Lock className="w-5 h-5" />}
                                    helper="Mật khẩu phải có ít nhất 6 ký tự"
                                    value={registerForm.password}
                                    onChange={(e) =>
                                        setRegisterForm({ ...registerForm, password: e.target.value })
                                    }
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            <Input
                                label="Xác nhận mật khẩu"
                                type="password"
                                placeholder="••••••••"
                                leftIcon={<Lock className="w-5 h-5" />}
                                value={registerForm.confirmPassword}
                                onChange={(e) =>
                                    setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                                }
                                error={
                                    registerForm.confirmPassword &&
                                        registerForm.password !== registerForm.confirmPassword
                                        ? "Mật khẩu không khớp"
                                        : undefined
                                }
                                required
                                disabled={isLoading}
                            />

                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="w-4 h-4 mt-1 rounded text-primary-500"
                                    required
                                />
                                <label
                                    htmlFor="terms"
                                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                                >
                                    Tôi đồng ý với{" "}
                                    <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                                        Điều khoản sử dụng
                                    </a>{" "}
                                    và{" "}
                                    <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                                        Chính sách bảo mật
                                    </a>
                                </label>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={isLoading}
                                rightIcon={<ArrowRight className="w-5 h-5" />}
                            >
                                Đăng ký tài khoản
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            )}

            {/* Forgot Password Form */}
            {showForgotPassword && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                    {!forgotSuccess ? (
                        <form onSubmit={handleForgotPassword} className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                                    <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white">
                                    Đặt lại mật khẩu
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Nhập email của bạn để nhận link đặt lại mật khẩu
                                </p>
                            </div>

                            <Input
                                label="Email"
                                type="email"
                                placeholder="email@example.com"
                                leftIcon={<Mail className="w-5 h-5" />}
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={isLoading}
                                rightIcon={<ArrowRight className="w-5 h-5" />}
                            >
                                Gửi link đặt lại mật khẩu
                            </Button>

                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại đăng nhập
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white">
                                    Email đã được gửi!
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Nếu email <strong className="text-gray-700 dark:text-gray-300">{forgotEmail}</strong> tồn tại trong hệ thống,
                                    bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                                    Kiểm tra cả thư mục spam nếu không thấy email.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                fullWidth
                                onClick={handleBackToLogin}
                                leftIcon={<ArrowLeft className="w-5 h-5" />}
                            >
                                Quay lại đăng nhập
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
