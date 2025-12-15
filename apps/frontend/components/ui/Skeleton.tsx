import { HTMLAttributes, forwardRef } from "react";

type SkeletonVariant = "text" | "circular" | "rectangular" | "rounded";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    animation?: "pulse" | "wave" | "none";
}

const variantStyles: Record<SkeletonVariant, string> = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-xl",
};

const animationStyles: Record<string, string> = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: "",
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
    (
        {
            variant = "text",
            width,
            height,
            animation = "pulse",
            className = "",
            style,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={`
                    bg-gray-200 dark:bg-slate-700
                    ${variantStyles[variant]}
                    ${animationStyles[animation]}
                    ${className}
                `}
                style={{
                    width: typeof width === "number" ? `${width}px` : width,
                    height: typeof height === "number" ? `${height}px` : height,
                    ...style,
                }}
                {...props}
            />
        );
    }
);

Skeleton.displayName = "Skeleton";

// Preset skeleton patterns
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    height={16}
                    width={i === lines - 1 ? "75%" : "100%"}
                />
            ))}
        </div>
    );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
    return (
        <div className={`space-y-4 ${className}`}>
            <Skeleton variant="rounded" height={192} />
            <SkeletonText lines={2} />
            <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" height={16} width={120} />
            </div>
        </div>
    );
}
