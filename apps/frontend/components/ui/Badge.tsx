import React from "react";

type BadgeVariant = "default" | "primary" | "secondary" | "accent" | "success" | "warning" | "danger";
type BadgeSize = "sm" | "md";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    icon?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    primary: "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300",
    secondary: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    accent: "bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300",
    success: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

const dotColors: Record<BadgeVariant, string> = {
    default: "bg-gray-500",
    primary: "bg-primary-500",
    secondary: "bg-gray-400",
    accent: "bg-accent-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
};

const sizeClasses: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
};

export function Badge({
    variant = "default",
    size = "md",
    dot = false,
    icon,
    children,
    className = "",
    ...props
}: BadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1.5 font-medium rounded-full
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${className}
            `}
            {...props}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
            )}
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
        </span>
    );
}
