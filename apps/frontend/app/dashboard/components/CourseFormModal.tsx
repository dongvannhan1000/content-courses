"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, Loader2 } from "lucide-react";
import { Modal, ModalFooter, Button, Input, Select, TextArea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { coursesApi, categoriesApi } from "@/lib/api";
import type { CourseListItem, CreateCourseDto, UpdateCourseDto, Category, CourseLevel } from "@/types";

interface CourseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    course?: CourseListItem; // If provided, edit mode
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

export default function CourseFormModal({
    isOpen,
    onClose,
    course,
    onSuccess,
}: CourseFormModalProps) {
    const { success: showSuccess, error: showError } = useToast();
    const isEditMode = !!course;

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
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoriesApi.getAll();
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

    // Load course data in edit mode
    useEffect(() => {
        if (isOpen && course) {
            // Use data from CourseListItem prop first
            setTitle(course.title);
            setSlug(course.slug);
            setShortDesc(course.shortDesc || "");
            setPrice(course.price);
            setDiscountPrice(course.discountPrice);
            // Normalize level to lowercase to match Select options
            const normalizedLevel = course.level?.toLowerCase() as CourseLevel | undefined;
            setLevel(normalizedLevel || "");
            setCategoryId(course.category?.id || "");
            setThumbnail(course.thumbnail || "");
            setSlugManuallyEdited(true);

            // Fetch full details by ID for description (uses /manage/:id endpoint)
            setLoading(true);
            coursesApi.getForManagement(course.id)
                .then((data) => {
                    setDescription(data.description);
                })
                .catch((err) => {
                    console.error("Error loading course details:", err);
                    // Fallback: allow editing with empty description
                    setDescription("");
                })
                .finally(() => setLoading(false));
        } else if (isOpen && !course) {
            // Reset form for create
            setTitle("");
            setSlug("");
            setShortDesc("");
            setDescription("");
            setPrice(0);
            setDiscountPrice(undefined);
            setLevel("");
            setCategoryId("");
            setThumbnail("");
            setSlugManuallyEdited(false);
        }
    }, [isOpen, course]);

    // Auto-generate slug
    useEffect(() => {
        if (!slugManuallyEdited && title) {
            setSlug(generateSlug(title));
        }
    }, [title, slugManuallyEdited]);

    // Category options
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

    // Validation
    const isValid = title.trim() && slug.trim() && description.trim() && price >= 0;

    // Handle save
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
                level: level ? (level as CourseLevel) : undefined,
                categoryId: categoryId ? Number(categoryId) : undefined,
            };

            if (isEditMode && course) {
                await coursesApi.update(course.id, dto as UpdateCourseDto);
                showSuccess("Đã lưu", "Thay đổi đã được lưu");
            } else {
                await coursesApi.create(dto as CreateCourseDto);
                showSuccess("Đã tạo khóa học", `"${title}" đã được tạo thành công`);
            }

            onSuccess();
            onClose();
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            showError("Lỗi", errorObj.message || "Không thể lưu khóa học");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
            size="lg"
        >
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="space-y-5">
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
                        helper="Tự động tạo từ tiêu đề"
                    />

                    {/* Short Description */}
                    <Input
                        label="Mô tả ngắn"
                        placeholder="Mô tả ngắn (hiển thị ở danh sách)"
                        value={shortDesc}
                        onChange={(e) => setShortDesc(e.target.value)}
                    />

                    {/* Description */}
                    <TextArea
                        label="Mô tả chi tiết *"
                        placeholder="Mô tả chi tiết về khóa học..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                    />

                    {/* Price & Discount */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Giá (VNĐ) *"
                            type="number"
                            placeholder="0"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            min={0}
                        />
                        <Input
                            label="Giá khuyến mãi"
                            type="number"
                            placeholder="Để trống nếu không KM"
                            value={discountPrice || ""}
                            onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : undefined)}
                            min={0}
                        />
                    </div>

                    {/* Level & Category */}
                    <div className="grid grid-cols-2 gap-4">
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
                        />
                        {thumbnail && (
                            <div className="mt-2 relative w-40 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
                                <img
                                    src={thumbnail}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <ModalFooter>
                        <Button variant="ghost" onClick={onClose} disabled={saving}>
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            leftIcon={<Save className="w-4 h-4" />}
                            onClick={handleSave}
                            loading={saving}
                            disabled={!isValid}
                        >
                            {isEditMode ? "Lưu thay đổi" : "Tạo khóa học"}
                        </Button>
                    </ModalFooter>
                </div>
            )}
        </Modal>
    );
}
