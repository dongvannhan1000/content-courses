import React from "react";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular";
    width?: string | number;
    height?: string | number;
    animate?: boolean;
}

export function Skeleton({
    className = "",
    variant = "rectangular",
    width,
    height,
    animate = true,
}: SkeletonProps) {
    const variantClasses = {
        text: "rounded",
        circular: "rounded-full",
        rectangular: "rounded-xl",
    };

    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`
                bg-gray-200 dark:bg-gray-700
                ${animate ? "animate-pulse" : ""}
                ${variantClasses[variant]}
                ${className}
            `}
            style={style}
        />
    );
}

// Pre-built skeletons for common use cases
export function SkeletonCard() {
    return (
        <div className="glass rounded-2xl overflow-hidden">
            {/* Thumbnail */}
            <Skeleton className="h-48 w-full rounded-none" />

            {/* Content */}
            <div className="p-5 space-y-4">
                <Skeleton className="h-4 w-20" /> {/* Category */}
                <Skeleton className="h-6 w-full" /> {/* Title */}
                <Skeleton className="h-4 w-3/4" /> {/* Description */}

                {/* Instructor */}
                <div className="flex items-center gap-3">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton className="h-4 w-24" />
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    className="h-4"
                    width={i === lines - 1 ? "60%" : "100%"}
                />
            ))}
        </div>
    );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const sizeMap = {
        sm: 32,
        md: 40,
        lg: 48,
    };

    return <Skeleton variant="circular" width={sizeMap[size]} height={sizeMap[size]} />;
}
