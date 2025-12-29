"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Plus,
    Edit3,
    Trash2,
    GripVertical,
    Video,
    FileText,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";
import { Card, Badge, Button, ConfirmModal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { coursesApi, lessonsApi } from "@/lib/api";
import type { CourseDetail, LessonListItem, LessonType } from "@/types";
import LessonFormModal from "@/app/dashboard/courses/components/LessonFormModal";

interface LessonsListClientProps {
    courseId: number;
}

// Lesson type icons
const lessonTypeIcons: Record<LessonType, React.ReactNode> = {
    VIDEO: <Video className="w-5 h-5 text-primary-500" />,
    DOCUMENT: <FileText className="w-5 h-5 text-blue-500" />,
    QUIZ: <FileText className="w-5 h-5 text-orange-500" />,
};

// Format duration from seconds to minutes
function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function LessonsListClient({ courseId }: LessonsListClientProps) {
    const router = useRouter();
    const { success: showSuccess, error: showError } = useToast();

    // State
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [lessons, setLessons] = useState<LessonListItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<LessonListItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState<LessonListItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch course and lessons
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [courseData, lessonsData] = await Promise.all([
                    coursesApi.getForManagement(courseId),
                    lessonsApi.getByCourse(courseId),
                ]);
                setCourse(courseData);
                setLessons(lessonsData.sort((a, b) => a.order - b.order));
            } catch (err: unknown) {
                const errorObj = err as { message?: string };
                showError("Lỗi", errorObj.message || "Không thể tải dữ liệu");
                router.push("/dashboard/courses");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId, router, showError]);

    // Handle add lesson
    const handleAddLesson = () => {
        setEditingLesson(null);
        setFormModalOpen(true);
    };

    // Handle edit lesson
    const handleEditLesson = (lesson: LessonListItem) => {
        setEditingLesson(lesson);
        setFormModalOpen(true);
    };

    // Handle delete click
    const handleDeleteClick = (lesson: LessonListItem) => {
        setLessonToDelete(lesson);
        setDeleteModalOpen(true);
    };

    // Handle delete confirm
    const handleDeleteConfirm = async () => {
        if (!lessonToDelete) return;

        try {
            setDeleting(true);
            await lessonsApi.delete(courseId, lessonToDelete.id);
            setLessons((prev) => prev.filter((l) => l.id !== lessonToDelete.id));
            showSuccess("Đã xóa bài học", `"${lessonToDelete.title}" đã được xóa`);
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            showError("Lỗi", errorObj.message || "Không thể xóa bài học");
        } finally {
            setDeleting(false);
            setDeleteModalOpen(false);
            setLessonToDelete(null);
        }
    };

    // Handle form success (create/edit)
    const handleFormSuccess = async () => {
        try {
            const lessonsData = await lessonsApi.getByCourse(courseId);
            setLessons(lessonsData.sort((a, b) => a.order - b.order));
        } catch (err) {
            console.error("Error refreshing lessons:", err);
        }
    };

    // Calculate total duration
    const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
    const totalMinutes = Math.floor(totalDuration / 60);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen py-8 pt-24">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 pt-24">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/courses">
                            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                                Quay lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
                                Quản lý bài học
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {course?.title}
                            </p>
                        </div>
                    </div>
                    <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />} onClick={handleAddLesson}>
                        Thêm bài học
                    </Button>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
                    <span>{lessons.length} bài học</span>
                    <span>•</span>
                    <span>Tổng {totalMinutes} phút</span>
                </div>

                {/* Lessons List */}
                {lessons.length > 0 ? (
                    <div className="space-y-3">
                        {lessons.map((lesson, index) => (
                            <Card key={lesson.id} variant="default" padding="none" className="overflow-hidden">
                                <div className="flex items-center p-4 gap-4">
                                    {/* Drag handle (placeholder - dnd-kit integration later) */}
                                    <div className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <GripVertical className="w-5 h-5" />
                                    </div>

                                    {/* Order number */}
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                        {index + 1}
                                    </div>

                                    {/* Type icon */}
                                    <div className="shrink-0">
                                        {lessonTypeIcons[lesson.type]}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                            {lesson.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span>{lesson.type}</span>
                                            {lesson.duration > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span>{formatDuration(lesson.duration)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center gap-2">
                                        {lesson.isFree && (
                                            <Badge variant="success" size="sm">FREE</Badge>
                                        )}
                                        {lesson.isPublished ? (
                                            <Badge variant="primary" size="sm">
                                                <Eye className="w-3 h-3 mr-1" />
                                                Public
                                            </Badge>
                                        ) : (
                                            <Badge variant="default" size="sm">
                                                <EyeOff className="w-3 h-3 mr-1" />
                                                Draft
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            leftIcon={<Edit3 className="w-4 h-4" />}
                                            onClick={() => handleEditLesson(lesson)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            leftIcon={<Trash2 className="w-4 h-4" />}
                                            onClick={() => handleDeleteClick(lesson)}
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card variant="glass" padding="lg" className="text-center">
                        <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Chưa có bài học nào
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Bắt đầu thêm bài học đầu tiên cho khóa học này
                        </p>
                        <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />} onClick={handleAddLesson}>
                            Thêm bài học
                        </Button>
                    </Card>
                )}
            </div>

            {/* Lesson Form Modal */}
            <LessonFormModal
                isOpen={formModalOpen}
                onClose={() => setFormModalOpen(false)}
                courseId={courseId}
                lesson={editingLesson || undefined}
                onSuccess={handleFormSuccess}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xóa bài học"
                message={`Bạn có chắc chắn muốn xóa "${lessonToDelete?.title}"?`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
                isLoading={deleting}
            />
        </div>
    );
}
