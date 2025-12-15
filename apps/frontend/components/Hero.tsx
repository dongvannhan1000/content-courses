"use client";

import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative py-20 px-4 overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 dark:bg-primary-800 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-accent-200 dark:bg-accent-800 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-primary-300 dark:bg-primary-700 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                            Nền tảng học Content Marketing #1 Việt Nam
                        </div>

                        <h1 className="font-display font-bold text-5xl md:text-6xl text-gray-900 dark:text-white leading-tight">
                            Làm chủ
                            <span className="text-gradient block">Content Marketing</span>
                            cùng chuyên gia
                        </h1>

                        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                            Hơn 20.000 học viên đã thành công với chúng tôi. Học từ những
                            chuyên gia hàng đầu, áp dụng ngay vào thực tế, và xây dựng sự
                            nghiệp trong lĩnh vực Content Marketing.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="group px-8 py-4 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-primary-500/30">
                                Khám phá khóa học
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                            </button>

                            <button className="px-8 py-4 glass text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:shadow-xl transition-all duration-200 flex items-center gap-2 cursor-pointer">
                                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                                </div>
                                Xem giới thiệu
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 pt-8">
                            <div>
                                <div className="text-3xl font-bold text-primary-700 dark:text-primary-400">20K+</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Học viên</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-primary-700 dark:text-primary-400">50+</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Khóa học</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-primary-700 dark:text-primary-400">4.8★</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Đánh giá</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Floating Cards */}
                    <div className="relative hidden md:block">
                        <div className="relative w-full h-[500px]">
                            {/* Main Card */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-96 glass rounded-2xl p-6 shadow-2xl">
                                <div className="w-full h-40 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                    <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                </div>
                            </div>

                            {/* Floating Small Card 1 */}
                            <div className="absolute top-10 right-0 w-48 glass rounded-xl p-4 shadow-lg animate-pulse" style={{ animationDelay: "0.5s" }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Small Card 2 */}
                            <div className="absolute bottom-10 left-0 w-48 glass rounded-xl p-4 shadow-lg animate-pulse" style={{ animationDelay: "1s" }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
