"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    Send,
    Loader2,
    ImageIcon,
} from "lucide-react";
import { Card, Button, Input, Select, TextArea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { coursesApi, categoriesApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import type { CourseDto, CreateCourseDto, UpdateCourseDto, CourseDetail, Category, CourseLevel } from "@/types";

interface CourseFormProps {
    mode: "create" | "edit";
    courseId?: number;
}

// Generate slug from title
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/-+/g, "-") // Replace multiple - with single -
        .replace(/^-|-$/g, ""); // Remove leading/trailing -
}

export default function CourseForm({ mode, courseId }: CourseFormProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useToast();

    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [shortDesc, setShortDesc] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [discountPrice, setDiscountPrice] = useState<number | undefined>(undefined);
    const [level, setLevel] = useState<CourseLevel | "">("");
    const [categoryId, setCategoryId] = useState<number | "">("");
    const [thumbnail, setThumbnail] = useState("");

    // UI state
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(mode === "edit");
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    // Original course data for edit mode
    const [originalCourse, setOriginalCourse] = useState<CourseDetail | null>(null);

    // Auto-generate slug from title (only if not manually edited)
    useEffect(() => {
        if (!slugManuallyEdited && title) {
            setSlug(generateSlug(title));
        }
    }, [title, slugManuallyEdited]);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoriesApi.getAll();
                // Flatten categories (include children)
                const flatCategories: Category[] = [];
                data.forEach((cat) => {
                    flatCategories.push(cat);
                    if (cat.children) {
                        cat.children.forEach((child) => flatCategories.push(child));
                    }
                });
                setCategories(flatCategories);
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };

        fetchCategories();
    }, []);

    // Fetch course data for edit mode
    useEffect(() => {
        if (mode === "edit" && courseId) {
            const fetchCourse = async () => {
                try {
                    setLoading(true);
                    const data = await coursesApi.getForManagement(courseId);
                    setOriginalCourse(data);

                    // Populate form
                    setTitle(data.title);
                    setSlug(data.slug);
                    setShortDesc(data.shortDesc || "");
                    setDescription(data.description);
                    setPrice(data.price);
                    setDiscountPrice(data.discountPrice);
                    setLevel((data.level as CourseLevel) || "");
                    setCategoryId(data.category?.id || "");
                    setThumbnail(data.thumbnail || "");
                    setSlugManuallyEdited(true);
                } catch (err: unknown) {
                    const errorObj = err as { message?: string };
                    showError("Lỗi", errorObj.message || "Không thể tải thông tin khóa học");
                    router.push("/dashboard/courses");
                } finally {
                    setLoading(false);
                }
            };

            fetchCourse();
        }
    }, [mode, courseId, router, showError]);

    // Category options for select
    const categoryOptions = useMemo(() => {
        return categories.map((cat) => ({
            value: cat.id,
            label: cat.name,
        }));
    }, [categories]);

    // Level options
    const levelOptions = [
        { value: "beginner", label: "Cơ bản" },
        { value: "intermediate", label: "Trung cấp" },
        { value: "advanced", label: "Nâng cao" },
    ];

    // Form validation
    const isValid = title.trim() && slug.trim() && description.trim() && price >= 0;

    // Save as draft
    const handleSave = async () => {
        if (!isValid) {
            showError("Thiếu thông tin", "Vui lòng điền đầy đủ các trường bắt buộc");
            return;
        }

        try {
            setSaving(true);

            const dto: CreateCourseDto | UpdateCourseDto = {
                title: title.trim(),
                slug: slug.trim(),
                description: description.trim(),
                shortDesc: shortDesc.trim() || undefined,
                thumbnail: thumbnail.trim() || undefined,
                price,
                discountPrice: discountPrice || undefined,
                level: level as CourseLevel || undefined,
                categoryId: categoryId ? Number(categoryId) : undefined,
            };

            if (mode === "create") {
                const created = await coursesApi.create(dto as CreateCourseDto);
                showSuccess("Đã tạo khóa học", `"${created.title}" đã được tạo thành công`);
                router.push(`/dashboard/courses/${created.id}/edit`);
            } else if (courseId) {
                await coursesApi.update(courseId, dto as UpdateCourseDto);
                showSuccess("Đã lưu", "Thay đổi đã được lưu thành công");
            }
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            showError("Lỗi", errorObj.message || "Không thể lưu khóa học");
        } finally {
            setSaving(false);
        }
    };

    // Submit for review
    const handleSubmitForReview = async () => {
        if (!courseId) return;

        try {
            setSubmitting(true);
            const updated = await coursesApi.submitForReview(courseId);
            showSuccess(
                user?.role === "ADMIN" ? "Đã xuất bản" : "Đã gửi duyệt",
                user?.role === "ADMIN"
                    ? `"${updated.title}" đã được xuất bản`
                    : `"${updated.title}" đã được gửi để duyệt`
            );
            router.push("/dashboard/courses");
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            showError("Lỗi", errorObj.message || "Không thể gửi duyệt");
        } finally {
            setSubmitting(false);
        }
    };

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
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard/courses">
                        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                            Quay lại
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
                            {mode === "create" ? "Tạo khóa học mới" : "Chỉnh sửa khóa học"}
                        </h1>
                    </div>
                </div>

                {/* Form */}
                <Card variant="default" padding="lg">
                    <div className="space-y-6">
                        {/* Title */}
                        <Input
                            label="Tiêu đề *"
                            placeholder="Nhập tiêu đề khóa học"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        {/* Slug */}
                        <Input
                            label="Slug (URL) *"
                            placeholder="khoa-hoc-example"
                            value={slug}
                            onChange={(e) => {
                                setSlug(e.target.value);
                                setSlugManuallyEdited(true);
                            }}
                            helper="Đường dẫn URL của khóa học. Tự động tạo từ tiêu đề."
                        />

                        {/* Short Description */}
                        <Input
                            label="Mô tả ngắn"
                            placeholder="Mô tả ngắn gọn về khóa học (hiển thị ở danh sách)"
                            value={shortDesc}
                            onChange={(e) => setShortDesc(e.target.value)}
                        />

                        {/* Description */}
                        <TextArea
                            label="Mô tả chi tiết *"
                            placeholder="Mô tả chi tiết về khóa học này..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                        />

                        {/* Price & Discount Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Giá (VNĐ) *"
                                type="number"
                                placeholder="0"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                min={0}
                            />
                            <Input
                                label="Giá khuyến mãi (VNĐ)"
                                type="number"
                                placeholder="Để trống nếu không khuyến mãi"
                                value={discountPrice || ""}
                                onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : undefined)}
                                min={0}
                            />
                        </div>

                        {/* Level & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                label="Cấp độ"
                                placeholder="Chọn cấp độ"
                                options={levelOptions}
                                value={level}
                                onChange={(e) => setLevel(e.target.value as CourseLevel | "")}
                            />
                            <Select
                                label="Danh mục"
                                placeholder="Chọn danh mục"
                                options={categoryOptions}
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                            />
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <Input
                                label="Thumbnail URL"
                                placeholder="https://example.com/image.jpg"
                                value={thumbnail}
                                onChange={(e) => setThumbnail(e.target.value)}
                                helper="URL hình ảnh đại diện cho khóa học"
                            />
                            {thumbnail && (
                                <div className="mt-2 relative w-48 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
                                    <img
                                        src={thumbnail}
                                        alt="Thumbnail preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-slate-700">
                        <Link href="/dashboard/courses">
                            <Button variant="ghost">Hủy</Button>
                        </Link>
                        <Button
                            variant="secondary"
                            leftIcon={<Save className="w-4 h-4" />}
                            onClick={handleSave}
                            loading={saving}
                            disabled={!isValid}
                        >
                            {mode === "create" ? "Tạo nháp" : "Lưu thay đổi"}
                        </Button>
                        {mode === "edit" && originalCourse?.status === "DRAFT" && (
                            <Button
                                variant="primary"
                                leftIcon={<Send className="w-4 h-4" />}
                                onClick={handleSubmitForReview}
                                loading={submitting}
                            >
                                {user?.role === "ADMIN" ? "Xuất bản" : "Gửi duyệt"}
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
