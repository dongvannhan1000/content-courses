"use client";

import Link from "next/link";
import { Play, BookOpen, Plus, BarChart3 } from "lucide-react";
import { Button, Avatar } from "@/components/ui";
import type { User } from "@/types";

interface DashboardHeaderProps {
    user: User;
    hasInProgressCourses: boolean;
    continueLink?: string;
}

export default function DashboardHeader({ user, hasInProgressCourses, continueLink }: DashboardHeaderProps) {
    const isInstructor = user.role === "INSTRUCTOR" || user.role === "ADMIN";

    // Role-specific greeting
    const roleGreeting = isInstructor
        ? "Quản lý khóa học của bạn"
        : "Tiếp tục hành trình học tập";

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 dark:from-primary-900 dark:via-primary-800 dark:to-slate-900 p-6 md:p-8 mb-8">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-accent-500/30 blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: User info */}
                <div className="flex items-center gap-4">
                    <Avatar
                        src={user.photoURL || undefined}
                        name={user.name}
                        size="lg"
                        className="ring-4 ring-white/20"
                    />
                    <div>
                        <h1 className="font-display font-bold text-2xl md:text-3xl text-white">
                            Xin chào, {user.name || "Bạn"}!
                        </h1>
                        <p className="text-primary-100 dark:text-primary-200 mt-1">
                            {roleGreeting}
                        </p>
                    </div>
                </div>

                {/* Right: Quick actions */}
                <div className="flex flex-wrap gap-3">
                    {isInstructor ? (
                        <>
                            <Link href="/dashboard/courses/new">
                                <Button
                                    variant="secondary"
                                    leftIcon={<Plus className="w-4 h-4" />}
                                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                                >
                                    Tạo khóa học
                                </Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/courses">
                                <Button
                                    variant="secondary"
                                    leftIcon={<BookOpen className="w-4 h-4" />}
                                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                                >
                                    Khám phá
                                </Button>
                            </Link>
                            {hasInProgressCourses && continueLink && (
                                <Link href={continueLink}>
                                    <Button
                                        variant="primary"
                                        leftIcon={<Play className="w-4 h-4" />}
                                        className="bg-accent-500 hover:bg-accent-600 text-white"
                                    >
                                        Tiếp tục học
                                    </Button>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
