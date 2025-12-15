import { HTMLAttributes, forwardRef } from "react";

type CardVariant = "default" | "glass" | "elevated";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    padding?: "none" | "sm" | "md" | "lg";
    hoverable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
    default:
        "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md",
    glass:
        "bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg",
    elevated:
        "bg-white dark:bg-slate-800 shadow-xl",
};

const paddingStyles: Record<string, string> = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            variant = "default",
            padding = "md",
            hoverable = false,
            className = "",
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={`
                    rounded-2xl
                    ${variantStyles[variant]}
                    ${paddingStyles[padding]}
                    ${hoverable ? "transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer" : ""}
                    ${className}
                `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

// Card sub-components for structured content
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { }

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className = "", children, ...props }, ref) => (
        <div
            ref={ref}
            className={`pb-4 border-b border-gray-100 dark:border-slate-700 ${className}`}
            {...props}
        >
            {children}
        </div>
    )
);

CardHeader.displayName = "CardHeader";

interface CardContentProps extends HTMLAttributes<HTMLDivElement> { }

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className = "", children, ...props }, ref) => (
        <div ref={ref} className={`py-4 ${className}`} {...props}>
            {children}
        </div>
    )
);

CardContent.displayName = "CardContent";

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> { }

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className = "", children, ...props }, ref) => (
        <div
            ref={ref}
            className={`pt-4 border-t border-gray-100 dark:border-slate-700 ${className}`}
            {...props}
        >
            {children}
        </div>
    )
);

CardFooter.displayName = "CardFooter";
