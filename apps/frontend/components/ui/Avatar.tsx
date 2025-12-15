import { HTMLAttributes, forwardRef } from "react";
import Image from "next/image";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    size?: AvatarSize;
    fallback?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; pixels: number }> = {
    xs: { container: "w-6 h-6", text: "text-xs", pixels: 24 },
    sm: { container: "w-8 h-8", text: "text-sm", pixels: 32 },
    md: { container: "w-10 h-10", text: "text-base", pixels: 40 },
    lg: { container: "w-12 h-12", text: "text-lg", pixels: 48 },
    xl: { container: "w-16 h-16", text: "text-xl", pixels: 64 },
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
    ({ src, alt = "Avatar", size = "md", fallback, className = "", ...props }, ref) => {
        const { container, text, pixels } = sizeStyles[size];

        // Generate fallback from alt text or provided fallback
        const getFallback = () => {
            if (fallback) return fallback;
            const words = alt.split(" ");
            if (words.length >= 2) {
                return (words[0][0] + words[1][0]).toUpperCase();
            }
            return alt.substring(0, 2).toUpperCase();
        };

        return (
            <div
                ref={ref}
                className={`
                    ${container}
                    rounded-full overflow-hidden
                    bg-primary-100 dark:bg-primary-900/30
                    flex items-center justify-center
                    ${className}
                `}
                {...props}
            >
                {src ? (
                    <Image
                        src={src}
                        alt={alt}
                        width={pixels}
                        height={pixels}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className={`${text} font-semibold text-primary-700 dark:text-primary-400`}>
                        {getFallback()}
                    </span>
                )}
            </div>
        );
    }
);

Avatar.displayName = "Avatar";
