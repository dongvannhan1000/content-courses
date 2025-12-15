import React from "react";

type CardVariant = "default" | "glass" | "elevated";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    hoverable?: boolean;
    padding?: "none" | "sm" | "md" | "lg";
}

const variantClasses: Record<CardVariant, string> = {
    default: "bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700",
    glass: "glass",
    elevated: "bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-gray-700",
};

const paddingClasses: Record<string, string> = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
};

export function Card({
    variant = "default",
    hoverable = false,
    padding = "md",
    children,
    className = "",
    ...props
}: CardProps) {
    return (
        <div
            className={`
                rounded-2xl
                ${variantClasses[variant]}
                ${paddingClasses[padding]}
                ${hoverable ? "card-hover cursor-pointer" : ""}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}

// Card sub-components
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    action?: React.ReactNode;
}

export function CardHeader({
    title,
    description,
    action,
    children,
    className = "",
    ...props
}: CardHeaderProps) {
    return (
        <div className={`flex items-start justify-between gap-4 ${className}`} {...props}>
            <div className="space-y-1">
                {title && (
                    <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white">
                        {title}
                    </h3>
                )}
                {description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                )}
                {children}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

export function CardContent({
    children,
    className = "",
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={className} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({
    children,
    className = "",
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`flex items-center gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
