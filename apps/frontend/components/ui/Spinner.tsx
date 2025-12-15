import React from "react";

type SpinnerSize = "sm" | "md" | "lg";
type SpinnerVariant = "primary" | "white" | "muted";

interface SpinnerProps {
    size?: SpinnerSize;
    variant?: SpinnerVariant;
    className?: string;
    label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-3",
};

const variantClasses: Record<SpinnerVariant, string> = {
    primary: "border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400",
    white: "border-white/30 border-t-white",
    muted: "border-gray-200 dark:border-gray-700 border-t-gray-600 dark:border-t-gray-300",
};

export function Spinner({
    size = "md",
    variant = "primary",
    className = "",
    label = "Loading...",
}: SpinnerProps) {
    return (
        <div className={`inline-flex items-center gap-2 ${className}`} role="status">
            <div
                className={`
                    rounded-full animate-spin
                    ${sizeClasses[size]}
                    ${variantClasses[variant]}
                `}
            />
            <span className="sr-only">{label}</span>
        </div>
    );
}

// Full page loading overlay
interface LoadingOverlayProps {
    message?: string;
}

export function LoadingOverlay({ message = "Đang tải..." }: LoadingOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
            </div>
        </div>
    );
}

// Inline loading state
interface LoadingStateProps {
    message?: string;
    size?: SpinnerSize;
}

export function LoadingState({ message = "Đang tải...", size = "md" }: LoadingStateProps) {
    return (
        <div className="flex items-center justify-center gap-3 py-8">
            <Spinner size={size} />
            <span className="text-gray-500 dark:text-gray-400">{message}</span>
        </div>
    );
}
