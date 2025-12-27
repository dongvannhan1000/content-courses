"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Video, Link as LinkIcon } from "lucide-react";
import { Modal, ModalFooter, Button, Input, Select, TextArea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { MediaEmbed } from "@/components/shared";
import { lessonsApi } from "@/lib/api";
import type { LessonListItem, LessonDetail, CreateLessonDto, UpdateLessonDto, LessonType } from "@/types";

interface LessonFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    lesson?: LessonListItem;  // If provided, edit mode
    onSuccess: () => void;
}

// Generate slug from title
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

// Extract YouTube URL from content or return content as is
function extractYouTubeUrl(content?: string): string {
    if (!content) return "";
    // Simple check if content looks like a YouTube URL
    if (content.includes("youtube.com") || content.includes("youtu.be")) {
        return content.trim();
    }
    return "";
}

export default function LessonFormModal({
    isOpen,
    onClose,
    courseId,
    lesson,
    onSuccess,
}: LessonFormModalProps) {
    const { success: showSuccess, error: showError } = useToast();
    const isEditMode = !!lesson;

    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<LessonType>("VIDEO");
    const [duration, setDuration] = useState<number>(0);
    const [isFree, setIsFree] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");

    // UI state
    const [saving, setSaving] = useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (lesson) {
                // Edit mode - fetch full lesson detail
                setLoadingDetail(true);
                lessonsApi.getBySlug(courseId, lesson.slug)
                    .then((detail) => {
                        setTitle(detail.title);
                        setSlug(detail.slug);
                        setDescription(detail.description || "");
                        setType(detail.type);
                        setDuration(detail.duration || 0);
                        setIsFree(detail.isFree);
                        setIsPublished(detail.isPublished);
                        setYoutubeUrl(extractYouTubeUrl(detail.content));
                        setSlugManuallyEdited(true);
                    })
                    .catch((err) => {
                        console.error("Error loading lesson:", err);
                        showError("Lỗi", "Không thể tải thông tin bài học");
                        onClose();
                    })
                    .finally(() => setLoadingDetail(false));
            } else {
                // Create mode - reset form
                setTitle("");
                setSlug("");
                setDescription("");
                setType("VIDEO");
                setDuration(0);
                setIsFree(false);
                setIsPublished(false);
                setYoutubeUrl("");
                setSlugManuallyEdited(false);
            }
        }
    }, [isOpen, lesson, courseId, onClose, showError]);

    // Auto-generate slug from title
    useEffect(() => {
        if (!slugManuallyEdited && title) {
            setSlug(generateSlug(title));
        }
    }, [title, slugManuallyEdited]);

    // Type options
    const typeOptions = [
        { value: "VIDEO", label: "Video" },
        { value: "DOCUMENT", label: "Tài liệu" },
    ];

    // Validation
    const isValid = title.trim() && slug.trim();

    // Handle save
    const handleSave = async () => {
        if (!isValid) {
            showError("Thiếu thông tin", "Vui lòng điền tiêu đề bài học");
            return;
        }

        try {
            setSaving(true);

            const dto: CreateLessonDto | UpdateLessonDto = {
                title: title.trim(),
                slug: slug.trim(),
                description: description.trim() || undefined,
                type,
                duration: duration > 0 ? duration : undefined,
                isFree,
                isPublished,
                content: youtubeUrl.trim() || undefined,
            };

            if (isEditMode && lesson) {
                await lessonsApi.update(courseId, lesson.id, dto as UpdateLessonDto);
                showSuccess("Đã lưu", "Bài học đã được cập nhật");
            } else {
                await lessonsApi.create(courseId, dto as CreateLessonDto);
                showSuccess("Đã tạo bài học", `"${title}" đã được thêm vào khóa học`);
            }

            onSuccess();
            onClose();
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            showError("Lỗi", errorObj.message || "Không thể lưu bài học");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
            size="lg"
        >
            {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Title */}
                    <Input
                        label="Tiêu đề *"
                        placeholder="Nhập tiêu đề bài học"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    {/* Slug */}
                    <Input
                        label="Slug (URL)"
                        placeholder="bai-hoc-example"
                        value={slug}
                        onChange={(e) => {
                            setSlug(e.target.value);
                            setSlugManuallyEdited(true);
                        }}
                        helper="Tự động tạo từ tiêu đề"
                    />

                    {/* Description */}
                    <TextArea
                        label="Mô tả"
                        placeholder="Mô tả ngắn về bài học này..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />

                    {/* Type & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Loại bài học"
                            options={typeOptions}
                            value={type}
                            onChange={(e) => setType(e.target.value as LessonType)}
                        />
                        <Input
                            label="Thời lượng (giây)"
                            type="number"
                            placeholder="0"
                            value={duration || ""}
                            onChange={(e) => setDuration(Number(e.target.value) || 0)}
                            min={0}
                        />
                    </div>

                    {/* YouTube URL (for VIDEO type) */}
                    {type === "VIDEO" && (
                        <div>
                            <Input
                                label="YouTube URL"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                helper="Dán link YouTube để nhúng video"
                            />
                            {/* Preview */}
                            {youtubeUrl && (
                                <div className="mt-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Xem trước:</p>
                                    <MediaEmbed
                                        type="youtube"
                                        url={youtubeUrl}
                                        title={title || "Video preview"}
                                        className="max-w-md"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Checkboxes */}
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isFree}
                                onChange={(e) => setIsFree(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Cho xem miễn phí (preview)
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Đã xuất bản
                            </span>
                        </label>
                    </div>
                </div>
            )}

            {/* Footer */}
            <ModalFooter>
                <Button variant="ghost" onClick={onClose} disabled={saving}>
                    Hủy
                </Button>
                <Button
                    variant="primary"
                    leftIcon={<Save className="w-4 h-4" />}
                    onClick={handleSave}
                    loading={saving}
                    disabled={!isValid || loadingDetail}
                >
                    {isEditMode ? "Lưu thay đổi" : "Thêm bài học"}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
