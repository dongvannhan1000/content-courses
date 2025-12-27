"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Plus,
    Edit3,
    Trash2,
    BookOpen,
    Users,
    Send,
    Loader2,
    MoreVertical,
    Eye,
} from "lucide-react";
import { Card, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, ConfirmModal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { coursesApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import type { CourseListItem, CourseStatus } from "@/types";

// Format duration from seconds to hours/minutes
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes} phút`;
}

// Format price to VND
function formatPrice(price: number): string {
    if (price === 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

// Status badge component
function StatusBadge({ status }: { status: CourseStatus }) {
    const variants: Record<CourseStatus, { variant: "default" | "primary" | "warning" | "success" | "danger"; label: string }> = {
        DRAFT: { variant: "default", label: "Nháp" },
        PENDING: { variant: "warning", label: "Chờ duyệt" },
        PUBLISHED: { variant: "success", label: "Đã xuất bản" },
        ARCHIVED: { variant: "danger", label: "Lưu trữ" },
    };

    const { variant, label } = variants[status] || variants.DRAFT;

    return (
        <Badge variant={variant} size="sm">
            {label}
        </Badge>
    );
}

export default function CoursesListClient() {
    const router = useRouter();
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useToast();

    const [courses, setCourses] = useState<CourseListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("all");

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<CourseListItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Submit for review state
    const [submitting, setSubmitting] = useState<number | null>(null);

    // Fetch courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await coursesApi.getMyCourses();
                setCourses(data);
            } catch (err: unknown) {
                console.error("Error fetching courses:", err);
                const errorObj = err as { message?: string };
                showError("Lỗi", errorObj.message || "Không thể tải danh sách khóa học");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    // Filter courses by status
    const filterCourses = (status: string): CourseListItem[] => {
        if (status === "all") return courses;
        return courses.filter((c) => c.status === status);
    };

    // Handle delete
    const handleDeleteClick = (course: CourseListItem) => {
        setCourseToDelete(course);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!courseToDelete) return;

        try {
            setDeleting(true);
            await coursesApi.delete(courseToDelete.id);
            setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
            showSuccess("Đã xóa khóa học", `"${courseToDelete.title}" đã được xóa thành công`);
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            showError("Lỗi", errorObj.message || "Không thể xóa khóa học");
        } finally {
            setDeleting(false);
            setDeleteModalOpen(false);
            setCourseToDelete(null);
        }
    };

    // Handle submit for review
    const handleSubmitForReview = async (course: CourseListItem) => {
        try {
            setSubmitting(course.id);
            const updated = await coursesApi.submitForReview(course.id);
            setCourses((prev) =>
                prev.map((c) => (c.id === course.id ? { ...c, status: updated.status } : c))
            );
            showSuccess(
                user?.role === "ADMIN" ? "Đã xuất bản" : "Đã gửi duyệt",
                user?.role === "ADMIN"
                    ? `"${course.title}" đã được xuất bản`
                    : `"${course.title}" đã được gửi để duyệt`
            );
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            showError("Lỗi", errorObj.message || "Không thể gửi duyệt");
        } finally {
            setSubmitting(null);
        }
    };

    // Course card component
    const CourseCard = ({ course }: { course: CourseListItem }) => (
        <Card variant="default" padding="none" className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-48 h-32 sm:h-auto shrink-0">
                    {course.thumbnail ? (
                        <Image
                            src={course.thumbnail}
                            alt={course.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 192px"
                        />
                    ) : (
                        <div className="w-full h-full min-h-[120px] bg-gradient-to-br from-primary-400 to-primary-600" />
                    )}
                    {/* Status badge overlay */}
                    <div className="absolute top-2 left-2">
                        <StatusBadge status={course.status} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                            {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {course.shortDesc || "Chưa có mô tả ngắn"}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{course.lessonCount} bài học</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{course.enrollmentCount} học viên</span>
                        </div>
                        <div>
                            <span className="font-medium text-primary-600 dark:text-primary-400">
                                {formatPrice(course.discountPrice || course.price)}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        <Link href={`/dashboard/courses/${course.id}/edit`}>
                            <Button variant="secondary" size="sm" leftIcon={<Edit3 className="w-4 h-4" />}>
                                Sửa
                            </Button>
                        </Link>
                        <Link href={`/dashboard/courses/${course.id}/lessons`}>
                            <Button variant="secondary" size="sm" leftIcon={<BookOpen className="w-4 h-4" />}>
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
                                onClick={() => handleSubmitForReview(course)}
                                loading={submitting === course.id}
                            >
                                {user?.role === "ADMIN" ? "Xuất bản" : "Gửi duyệt"}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleDeleteClick(course)}
                        >
                            Xóa
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen py-8 pt-24">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Đang tải khóa học...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 pt-24">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">
                            Quản lý Khóa học
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {courses.length} khóa học
                        </p>
                    </div>
                    <Link href="/dashboard/courses/new">
                        <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
                            Tạo khóa học
                        </Button>
                    </Link>
                </div>

                {/* Error State */}
                {error && (
                    <Card variant="glass" padding="lg" className="text-center mb-8">
                        <p className="text-red-500 dark:text-red-400">{error}</p>
                        <Button variant="primary" className="mt-4" onClick={() => window.location.reload()}>
                            Thử lại
                        </Button>
                    </Card>
                )}

                {/* Tabs and Content */}
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">Tất cả ({courses.length})</TabsTrigger>
                        <TabsTrigger value="DRAFT">Nháp ({courses.filter(c => c.status === 'DRAFT').length})</TabsTrigger>
                        <TabsTrigger value="PENDING">Chờ duyệt ({courses.filter(c => c.status === 'PENDING').length})</TabsTrigger>
                        <TabsTrigger value="PUBLISHED">Đã xuất bản ({courses.filter(c => c.status === 'PUBLISHED').length})</TabsTrigger>
                    </TabsList>

                    <div className="mt-6 space-y-4">
                        {filterCourses(activeTab).length > 0 ? (
                            filterCourses(activeTab).map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))
                        ) : (
                            <Card variant="glass" padding="lg" className="text-center">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {activeTab === "all" ? "Chưa có khóa học nào" : "Không có khóa học"}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    {activeTab === "all"
                                        ? "Bắt đầu tạo khóa học đầu tiên của bạn"
                                        : "Không có khóa học nào ở trạng thái này"}
                                </p>
                                {activeTab === "all" && (
                                    <Link href="/dashboard/courses/new">
                                        <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
                                            Tạo khóa học
                                        </Button>
                                    </Link>
                                )}
                            </Card>
                        )}
                    </div>
                </Tabs>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xóa khóa học"
                message={`Bạn có chắc chắn muốn xóa "${courseToDelete?.title}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
                isLoading={deleting}
            />
        </div>
    );
}
