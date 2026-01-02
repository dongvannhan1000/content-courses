"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Plus,
    Video,
    Loader2,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { Card, Button, ConfirmModal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { coursesApi, lessonsApi } from "@/lib/api";
import type { CourseDetail, LessonListItem } from "@/types";
import LessonFormModal from "@/app/dashboard/courses/components/LessonFormModal";
import SortableLesson from "@/app/dashboard/courses/components/SortableLesson";

interface LessonsListClientProps {
    courseId: number;
}

export default function LessonsListClient({ courseId }: LessonsListClientProps) {
    const router = useRouter();
    const { success: showSuccess, error: showError } = useToast();

    // State
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [lessons, setLessons] = useState<LessonListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal states
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<LessonListItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState<LessonListItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    // Handle drag end - reorder lessons
    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = lessons.findIndex((l) => l.id === active.id);
        const newIndex = lessons.findIndex((l) => l.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // Optimistic update
        const newLessons = arrayMove(lessons, oldIndex, newIndex);
        setLessons(newLessons);

        // Save to backend
        setIsSaving(true);
        try {
            const lessonIds = newLessons.map((l) => l.id);
            await lessonsApi.reorder(courseId, lessonIds);
            showSuccess("Đã lưu", "Thứ tự bài học đã được cập nhật");
        } catch (err: unknown) {
            // Revert on error
            setLessons(lessons);
            const errorObj = err as { message?: string };
            showError("Lỗi", errorObj.message || "Không thể cập nhật thứ tự");
        } finally {
            setIsSaving(false);
        }
    }, [lessons, courseId, showSuccess, showError]);

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
                        <Link href="/dashboard">
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={lessons.map((l) => l.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {isSaving && (
                                    <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary-600 dark:text-primary-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang lưu...</span>
                                    </div>
                                )}
                                {lessons.map((lesson, index) => (
                                    <SortableLesson
                                        key={lesson.id}
                                        lesson={lesson}
                                        index={index}
                                        onEdit={handleEditLesson}
                                        onDelete={handleDeleteClick}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
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
