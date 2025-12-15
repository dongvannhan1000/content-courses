import { HTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
    size?: SpinnerSize;
    color?: "primary" | "white" | "current";
}

const sizeStyles: Record<SpinnerSize, string> = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
};

const colorStyles: Record<string, string> = {
    primary: "text-primary-500",
    white: "text-white",
    current: "text-current",
};

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
    ({ size = "md", color = "primary", className = "", ...props }, ref) => {
        return (
            <div
                ref={ref}
                role="status"
                aria-label="Loading"
                className={`inline-flex ${className}`}
                {...props}
            >
                <Loader2
                    className={`animate-spin ${sizeStyles[size]} ${colorStyles[color]}`}
                />
                <span className="sr-only">Loading...</span>
            </div>
        );
    }
);

Spinner.displayName = "Spinner";

// Full page loading spinner
export function LoadingScreen({ message = "Đang tải..." }: { message?: string }) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}
