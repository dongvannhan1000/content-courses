"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon, AlertCircle } from "lucide-react";
import { uploadApi, type UploadFolder } from "@/lib/api/upload";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string | undefined) => void;
    folder?: UploadFolder;
    maxSize?: number; // in MB
    accept?: string;
    className?: string;
    disabled?: boolean;
    label?: string;
    helper?: string;
}

export default function ImageUpload({
    value,
    onChange,
    folder = "thumbnails",
    maxSize = 5,
    accept = "image/jpeg,image/png,image/webp,image/gif",
    className = "",
    disabled = false,
    label = "Hình ảnh",
    helper,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const maxSizeBytes = maxSize * 1024 * 1024;

    const handleFileSelect = useCallback(
        async (file: File) => {
            setError(null);

            // Validate file type
            const acceptedTypes = accept.split(",").map((t) => t.trim());
            if (!acceptedTypes.includes(file.type)) {
                setError(`Định dạng không hỗ trợ. Chấp nhận: ${accept}`);
                return;
            }

            // Validate file size
            if (file.size > maxSizeBytes) {
                setError(`File quá lớn. Tối đa ${maxSize}MB`);
                return;
            }

            try {
                setUploading(true);
                setProgress(0);

                // Delete old file if exists (cleanup orphaned files)
                if (value) {
                    await uploadApi.deleteFile(value);
                }

                const publicUrl = await uploadApi.uploadFile(file, folder, (p) => {
                    setProgress(p);
                });

                onChange(publicUrl);
            } catch (err: unknown) {
                const errorObj = err as { message?: string };
                setError(errorObj.message || "Không thể tải lên. Vui lòng thử lại.");
                console.error("Upload error:", err);
            } finally {
                setUploading(false);
                setProgress(0);
            }
        },
        [accept, folder, maxSize, maxSizeBytes, onChange, value]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // Reset input so same file can be selected again
        e.target.value = "";
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);

            if (disabled || uploading) return;

            const file = e.dataTransfer.files[0];
            if (file) {
                handleFileSelect(file);
            }
        },
        [disabled, uploading, handleFileSelect]
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled && !uploading) {
            setDragOver(true);
        }
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleRemove = async () => {
        // Delete file from storage
        if (value) {
            await uploadApi.deleteFile(value);
        }
        onChange(undefined);
        setError(null);
    };

    const handleClick = () => {
        if (!disabled && !uploading) {
            inputRef.current?.click();
        }
    };

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled || uploading}
            />

            {value ? (
                // Image preview
                <div className="relative group">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700">
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "";
                                (e.target as HTMLImageElement).style.display = "none";
                            }}
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={handleClick}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                title="Thay đổi"
                            >
                                <Upload className="w-5 h-5 text-white" />
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                                title="Xóa"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // Upload dropzone
                <div
                    onClick={handleClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                        relative w-full aspect-video rounded-lg border-2 border-dashed
                        transition-all cursor-pointer
                        flex flex-col items-center justify-center gap-3
                        ${dragOver
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-gray-300 dark:border-slate-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                        }
                        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Đang tải lên... {progress}%
                                </p>
                                <div className="w-48 h-2 bg-gray-200 dark:bg-slate-700 rounded-full mt-2">
                                    <div
                                        className="h-full bg-primary-500 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-3 rounded-full bg-gray-100 dark:bg-slate-700">
                                <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Kéo thả hoặc click để tải lên
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    PNG, JPG, WebP tối đa {maxSize}MB
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Helper text */}
            {helper && !error && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{helper}</p>
            )}
        </div>
    );
}
