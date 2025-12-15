"use client";

import { useState } from "react";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button, Input, Modal, ModalFooter } from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form states
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [registerForm, setRegisterForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // TODO: Integrate with Firebase Auth
        console.log("Login:", loginForm);
        setTimeout(() => {
            setIsLoading(false);
            onClose();
        }, 1000);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // TODO: Integrate with Firebase Auth
        console.log("Register:", registerForm);
        setTimeout(() => {
            setIsLoading(false);
            onClose();
        }, 1000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">CC</span>
                </div>
                <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
                    Chào mừng đến với Content Course
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Học Content Marketing từ những chuyên gia hàng đầu
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
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
                        />

                        <div className="relative">
                            <Input
                                label="Mật khẩu"
                                type={showPassword ? "text" : "password"}
                                placeholder="Tối thiểu 8 ký tự"
                                leftIcon={<Lock className="w-5 h-5" />}
                                helper="Mật khẩu phải có ít nhất 8 ký tự"
                                value={registerForm.password}
                                onChange={(e) =>
                                    setRegisterForm({ ...registerForm, password: e.target.value })
                                }
                                required
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
        </Modal>
    );
}
