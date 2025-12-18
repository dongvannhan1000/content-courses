"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Play,
    CheckCircle,
    Lock,
    BookOpen,
    Clock,
    ChevronRight,
    ArrowLeft,
    Loader2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, Button, Badge } from "@/components/ui";
import { RequireAuth } from "@/components/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEnrollmentStore } from "@/lib/stores";
import { enrollmentsApi } from "@/lib/api/enrollments";
import type { CourseDetail, LessonSummary, EnrollmentCheck } from "@/types";

interface LearnClientProps {
    course: CourseDetail;
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

export default function LearnClient({ course }: LearnClientProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { isEnrolled: isEnrolledInStore } = useEnrollmentStore();
    const [enrollmentData, setEnrollmentData] = useState<EnrollmentCheck | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check enrollment on mount
    useEffect(() => {
        const checkAccess = async () => {
            if (!isAuthenticated) {
                setIsLoading(false);
                return;
            }

            try {
                const data = await enrollmentsApi.checkEnrollment(course.id);
                setEnrollmentData(data);

                // Redirect to course detail if not enrolled
                if (!data.enrolled) {
                    router.push(`/courses/${course.slug}`);
                }
            } catch (error) {
                console.error("Failed to check enrollment:", error);
                router.push(`/courses/${course.slug}`);
            } finally {
                setIsLoading(false);
            }
        };

        checkAccess();
    }, [isAuthenticated, course.id, course.slug, router]);

    const isEnrolled = isEnrolledInStore(course.id) || enrollmentData?.enrolled;
    const progressPercent = enrollmentData?.progressPercent || 0;
    const totalLessons = course.lessonCount || course.lessons?.length || 0;
    // Calculate completed lessons from progress percentage
    const completedLessons = Math.floor((progressPercent / 100) * totalLessons);

    // Find next lesson to continue
    const findNextLesson = (): LessonSummary | null => {
        if (!course.lessons || course.lessons.length === 0) return null;
        // For now, return first lesson (later: track actual progress)
        return course.lessons[0];
    };

    const nextLesson = findNextLesson();

    // Loading state
    if (isLoading) {
        return (
            <main className="min-h-screen">
                <Header />
                <div className="min-h-screen py-8 pt-24 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <Header />
            <RequireAuth>
                <div className="min-h-screen py-8 pt-24">
                    <div className="max-w-7xl mx-auto px-4">
                        {/* Back Button */}
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại Dashboard
                        </Link>

                        {/* Course Header */}
                        <div className="grid lg:grid-cols-3 gap-8 mb-8">
                            {/* Course Info */}
                            <div className="lg:col-span-2">
                                <Card variant="glass" padding="lg">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Thumbnail */}
                                        <div className="relative w-full md:w-64 h-40 shrink-0 rounded-xl overflow-hidden">
                                            {course.thumbnail ? (
                                                <Image
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />
                                            )}
                                            {/* Play Overlay */}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                                                    <Play className="w-8 h-8 text-primary-600 ml-1" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">
                                                    {course.title}
                                                </h1>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    {course.instructor.name}
                                                </p>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        Tiến độ: {completedLessons}/{totalLessons} bài học
                                                    </span>
                                                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                                                        {progressPercent}%
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full gradient-primary rounded-full transition-all duration-500"
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Continue Button */}
                                            {nextLesson && (
                                                <Link href={`/learn/${course.slug}/${nextLesson.slug}`}>
                                                    <Button
                                                        variant="primary"
                                                        size="lg"
                                                        leftIcon={<Play className="w-5 h-5" />}
                                                    >
                                                        {progressPercent > 0 ? "Tiếp tục học" : "Bắt đầu học"}
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Stats */}
                            <div className="space-y-4">
                                <Card variant="elevated" padding="lg" className="gradient-primary text-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                            <BookOpen className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-white/80 text-sm">Tổng bài học</p>
                                            <p className="text-3xl font-bold">{totalLessons}</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card variant="glass" padding="lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
                                            <Clock className="w-7 h-7 text-accent-600 dark:text-accent-400" />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">Thời lượng</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {formatDuration(course.duration)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Curriculum */}
                        <Card variant="default" padding="lg">
                            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-6">
                                Nội dung khóa học
                            </h2>

                            {course.lessons && course.lessons.length > 0 ? (
                                <div className="space-y-2">
                                    {course.lessons.map((lesson, index) => {
                                        // For demo: mark first few as completed based on progress
                                        const isCompleted = index < completedLessons;
                                        const isCurrent = index === completedLessons;

                                        return (
                                            <Link
                                                key={lesson.id}
                                                href={`/learn/${course.slug}/${lesson.slug}`}
                                                className={`flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer ${isCurrent
                                                    ? "bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500"
                                                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    }`}
                                            >
                                                {/* Status Icon */}
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted
                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                                        : isCurrent
                                                            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                                        }`}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle className="w-5 h-5" />
                                                    ) : (
                                                        <Play className="w-5 h-5" />
                                                    )}
                                                </div>

                                                {/* Lesson Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            Bài {index + 1}
                                                        </span>
                                                        {lesson.isFree && (
                                                            <Badge variant="success" size="sm">
                                                                Miễn phí
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                        {lesson.title}
                                                    </h3>
                                                </div>

                                                {/* Duration */}
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span>{formatDuration(lesson.duration)}</span>
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Chưa có bài học nào trong khóa học này
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </RequireAuth>
            <Footer />
        </main>
    );
}
