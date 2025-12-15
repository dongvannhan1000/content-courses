import { HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "info";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300",
    primary: "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400",
    secondary: "bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300",
    success: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    danger: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
};

const sizeStyles: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1 text-sm",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ variant = "default", size = "md", className = "", children, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={`
                    inline-flex items-center font-medium rounded-full
                    ${variantStyles[variant]}
                    ${sizeStyles[size]}
                    ${className}
                `}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = "Badge";
