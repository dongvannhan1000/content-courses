"use client";

import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { Card, Button, Tabs, TabsList, TabsTrigger, ConfirmModal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { coursesApi } from "@/lib/api";
import { InstructorCourseCard } from "./DashboardCourseCard";
import type { CourseListItem } from "@/types";

interface InstructorViewProps {
    isAdmin: boolean;
    courses: CourseListItem[];
    setCourses: React.Dispatch<React.SetStateAction<CourseListItem[]>>;
    onEditCourse: (course: CourseListItem) => void;
    onCreateCourse: () => void;
}

export default function InstructorView({
    isAdmin,
    courses,
    setCourses,
    onEditCourse,
    onCreateCourse,
}: InstructorViewProps) {
    const { success: showSuccess, error: showError } = useToast();

    const [activeTab, setActiveTab] = useState("all");

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<CourseListItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Submit state
    const [submittingId, setSubmittingId] = useState<number | null>(null);
    const [approvingId, setApprovingId] = useState<number | null>(null);

    // Filter courses by status
    const filterCourses = (status: string): CourseListItem[] => {
        if (status === "all") return courses;
        return courses.filter((c) => c.status === status);
    };

    // Stats
    const stats = {
        total: courses.length,
        draft: courses.filter((c) => c.status === "DRAFT").length,
        pending: courses.filter((c) => c.status === "PENDING").length,
        published: courses.filter((c) => c.status === "PUBLISHED").length,
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
            showSuccess("Đã xóa khóa học", `"${courseToDelete.title}" đã được xóa`);
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
    const handleSubmit = async (course: CourseListItem) => {
        try {
            setSubmittingId(course.id);
            const updated = await coursesApi.submitForReview(course.id);
            setCourses((prev) =>
                prev.map((c) => (c.id === course.id ? { ...c, status: updated.status } : c))
            );
            showSuccess(
                isAdmin ? "Đã xuất bản" : "Đã gửi duyệt",
                isAdmin
                    ? `"${course.title}" đã được xuất bản`
                    : `"${course.title}" đã được gửi duyệt`
            );
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            showError("Lỗi", errorObj.message || "Không thể gửi duyệt");
        } finally {
            setSubmittingId(null);
        }
    };

    // Handle approve (Admin only)
    const handleApprove = async (course: CourseListItem) => {
        try {
            setApprovingId(course.id);
            const updated = await coursesApi.approve(course.id);
            setCourses((prev) =>
                prev.map((c) => (c.id === course.id ? { ...c, status: updated.status } : c))
            );
            showSuccess("Đã duyệt", `"${course.title}" đã được xuất bản`);
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            showError("Lỗi", errorObj.message || "Không thể duyệt khóa học");
        } finally {
            setApprovingId(null);
        }
    };

    // Empty state
    const EmptyState = () => (
        <Card variant="glass" padding="lg" className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {activeTab === "all" ? "Chưa có khóa học nào" : "Không có khóa học"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
                {activeTab === "all"
                    ? "Bắt đầu tạo khóa học đầu tiên của bạn"
                    : "Không có khóa học nào ở trạng thái này"}
            </p>
            {activeTab === "all" && (
                <Button
                    variant="primary"
                    leftIcon={<Plus className="w-5 h-5" />}
                    onClick={onCreateCourse}
                >
                    Tạo khóa học
                </Button>
            )}
        </Card>
    );

    return (
        <div>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="all">Tất cả ({stats.total})</TabsTrigger>
                    <TabsTrigger value="DRAFT">Nháp ({stats.draft})</TabsTrigger>
                    <TabsTrigger value="PENDING">Chờ duyệt ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="PUBLISHED">Đã xuất bản ({stats.published})</TabsTrigger>
                </TabsList>

                <div className="space-y-4">
                    {filterCourses(activeTab).length > 0 ? (
                        filterCourses(activeTab).map((course) => (
                            <InstructorCourseCard
                                key={course.id}
                                course={course}
                                onDelete={handleDeleteClick}
                                onSubmit={handleSubmit}
                                onEdit={onEditCourse}
                                onApprove={isAdmin ? handleApprove : undefined}
                                isSubmitting={submittingId === course.id}
                                isApproving={approvingId === course.id}
                                isAdmin={isAdmin}
                            />
                        ))
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </Tabs>

            {/* Delete Modal */}
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
