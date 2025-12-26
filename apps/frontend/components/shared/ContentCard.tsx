"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui";
import { Clock, Users, BookOpen } from "lucide-react";

type ContentType = "course" | "blog";

interface MetadataItem {
    icon?: React.ReactNode;
    label: string;
    value: string | number;
}

interface ContentCardProps {
    type: ContentType;
    title: string;
    description?: string;
    thumbnail?: string;
    status?: string;
    statusVariant?: "default" | "primary" | "secondary" | "accent" | "success" | "warning" | "danger";
    metadata?: MetadataItem[];
    actions?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

// Status badge variants
const statusVariants: Record<string, "default" | "primary" | "secondary" | "accent" | "success" | "warning" | "danger"> = {
    DRAFT: "default",
    PENDING: "warning",
    PUBLISHED: "success",
    ARCHIVED: "danger",
    // Blog statuses (future)
    draft: "default",
    published: "success",
};

/**
 * ContentCard - Reusable card for courses and blog posts
 * 
 * Features:
 * - Thumbnail with fallback gradient
 * - Status badge
 * - Flexible metadata display
 * - Action buttons slot
 * - Hover effects
 * 
 * Designed for reuse across courses and future blog features.
 */
export function ContentCard({
    type,
    title,
    description,
    thumbnail,
    status,
    statusVariant,
    metadata = [],
    actions,
    onClick,
    className = "",
}: ContentCardProps) {
    const variant = statusVariant || (status ? statusVariants[status] : undefined);

    return (
        <div
            className={`
                group bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700
                overflow-hidden transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                ${onClick ? "cursor-pointer" : ""}
                ${className}
            `}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden">
                {thumbnail ? (
                    <Image
                        src={thumbnail}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />
                )}

                {/* Status Badge - Overlay */}
                {status && (
                    <div className="absolute top-3 left-3">
                        <Badge variant={variant} size="sm">
                            {status}
                        </Badge>
                    </div>
                )}

                {/* Type indicator */}
                <div className="absolute bottom-3 right-3">
                    <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-md text-xs text-white">
                        {type === "course" ? "Khóa học" : "Bài viết"}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {title}
                </h3>

                {/* Description */}
                {description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {description}
                    </p>
                )}

                {/* Metadata */}
                {metadata.length > 0 && (
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                        {metadata.map((item, index) => (
                            <div key={index} className="flex items-center gap-1">
                                {item.icon}
                                <span>{item.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {actions && (
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper to create common metadata items
export const createMetadata = {
    duration: (minutes: number): MetadataItem => ({
        icon: <Clock className="w-4 h-4" />,
        label: "Thời lượng",
        value: `${minutes} phút`,
    }),
    students: (count: number): MetadataItem => ({
        icon: <Users className="w-4 h-4" />,
        label: "Học viên",
        value: count.toLocaleString(),
    }),
    lessons: (count: number): MetadataItem => ({
        icon: <BookOpen className="w-4 h-4" />,
        label: "Bài học",
        value: `${count} bài`,
    }),
};
