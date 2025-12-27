"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Clock, BookOpen, MoreVertical, Edit3, Trash2, Eye, Send } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import type { EnrollmentListItem, CourseListItem, CourseStatus } from "@/types";

// Progress ring component
function ProgressRing({ progress, size = 48, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="text-primary-500 dark:text-primary-400 transition-all duration-500"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                {Math.round(progress)}%
            </span>
        </div>
    );
}

// Format duration from seconds
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes} phút`;
}

// Student course card (for enrolled courses)
interface StudentCourseCardProps {
    enrollment: EnrollmentListItem;
}

export function StudentCourseCard({ enrollment }: StudentCourseCardProps) {
    const { course, progressPercent } = enrollment;
    const isCompleted = progressPercent === 100;

    return (
        <Link href={`/learn/${course.slug}`}>
            <Card
                variant="default"
                padding="none"
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
                <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-48 h-36 sm:h-auto shrink-0 overflow-hidden">
                        {course.thumbnail ? (
                            <Image
                                src={course.thumbnail}
                                alt={course.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, 192px"
                            />
                        ) : (
                            <div className="w-full h-full min-h-[120px] bg-gradient-to-br from-primary-400 to-primary-600" />
                        )}
                        {/* Play overlay on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="w-5 h-5 text-primary-600 ml-0.5" />
                            </div>
                        </div>
                        {/* Completed badge */}
                        {isCompleted && (
                            <div className="absolute top-2 left-2">
                                <Badge variant="success" size="sm">Hoàn thành</Badge>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {course.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                {course.instructor?.name}
                            </p>
                        </div>

                        {/* Progress & Meta */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                {course.lessonCount !== undefined && (
                                    <div className="flex items-center gap-1">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{course.lessonCount} bài</span>
                                    </div>
                                )}
                                {course.duration !== undefined && course.duration > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatDuration(course.duration)}</span>
                                    </div>
                                )}
                            </div>
                            <ProgressRing progress={progressPercent} />
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

// Instructor course card (for course management)
interface InstructorCourseCardProps {
    course: CourseListItem;
    onDelete: (course: CourseListItem) => void;
    onSubmit: (course: CourseListItem) => void;
    isSubmitting?: boolean;
    isAdmin?: boolean;
}

// Status badge
const statusConfig: Record<CourseStatus, { variant: "default" | "warning" | "success" | "danger"; label: string }> = {
    DRAFT: { variant: "default", label: "Nháp" },
    PENDING: { variant: "warning", label: "Chờ duyệt" },
    PUBLISHED: { variant: "success", label: "Đã xuất bản" },
    ARCHIVED: { variant: "danger", label: "Lưu trữ" },
};

export function InstructorCourseCard({ course, onDelete, onSubmit, isSubmitting, isAdmin }: InstructorCourseCardProps) {
    const status = statusConfig[course.status] || statusConfig.DRAFT;

    return (
        <Card
            variant="default"
            padding="none"
            className="group overflow-hidden hover:shadow-lg transition-all duration-300"
        >
            <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-44 h-32 sm:h-auto shrink-0">
                    {course.thumbnail ? (
                        <Image
                            src={course.thumbnail}
                            alt={course.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 176px"
                        />
                    ) : (
                        <div className="w-full h-full min-h-[100px] bg-gradient-to-br from-primary-400 to-primary-600" />
                    )}
                    <div className="absolute top-2 left-2">
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                            {course.shortDesc || "Chưa có mô tả"}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{course.lessonCount} bài học</span>
                        <span>{course.enrollmentCount} học viên</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                        <Link href={`/dashboard/courses/${course.id}/edit`}>
                            <Button variant="ghost" size="sm" leftIcon={<Edit3 className="w-4 h-4" />}>
                                Sửa
                            </Button>
                        </Link>
                        <Link href={`/dashboard/courses/${course.id}/lessons`}>
                            <Button variant="ghost" size="sm" leftIcon={<BookOpen className="w-4 h-4" />}>
                                Bài học
                            </Button>
                        </Link>
                        {course.status === "PUBLISHED" && (
                            <Link href={`/courses/${course.slug}`} target="_blank">
                                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                                    Xem
                                </Button>
                            </Link>
                        )}
                        {course.status === "DRAFT" && (
                            <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Send className="w-4 h-4" />}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onSubmit(course);
                                }}
                                loading={isSubmitting}
                            >
                                {isAdmin ? "Xuất bản" : "Gửi duyệt"}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(course);
                            }}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
}
