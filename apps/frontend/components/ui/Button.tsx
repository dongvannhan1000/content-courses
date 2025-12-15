import React from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: `bg-gradient-to-br from-primary-400 to-primary-600 
              text-white shadow-lg shadow-primary-500/30
              hover:opacity-90 focus:ring-primary-500`,
    secondary: `glass text-gray-700 dark:text-gray-200
                hover:shadow-xl focus:ring-primary-500`,
    accent: `bg-gradient-to-br from-accent-400 to-accent-600 
             text-white shadow-lg shadow-accent-500/20
             hover:opacity-90 focus:ring-accent-500`,
    ghost: `bg-transparent text-primary-600 dark:text-primary-400
            hover:bg-primary-50 dark:hover:bg-primary-900/20 
            focus:ring-primary-500`,
    danger: `bg-red-500 text-white shadow-lg shadow-red-500/20
             hover:bg-red-600 focus:ring-red-500`,
    outline: `border-2 border-primary-500 text-primary-600 dark:text-primary-400
              hover:bg-primary-50 dark:hover:bg-primary-900/20 
              focus:ring-primary-500`,
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
    md: "px-5 py-2.5 text-base rounded-xl gap-2",
    lg: "px-8 py-4 text-lg rounded-xl gap-2.5",
};

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    children,
    className = "",
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={`
                inline-flex items-center justify-center font-semibold
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                cursor-pointer
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${fullWidth ? "w-full" : ""}
                ${className}
            `}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : leftIcon ? (
                <span className="shrink-0">{leftIcon}</span>
            ) : null}
            {children}
            {rightIcon && !loading && <span className="shrink-0">{rightIcon}</span>}
        </button>
    );
}
