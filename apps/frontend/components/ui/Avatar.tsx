import React from "react";
import Image from "next/image";
import { User } from "lucide-react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: AvatarSize;
    className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
};

const iconSizes: Record<AvatarSize, string> = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
};

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function Avatar({
    src,
    alt = "",
    name,
    size = "md",
    className = "",
}: AvatarProps) {
    const initials = name ? getInitials(name) : null;

    return (
        <div
            className={`
                relative rounded-full overflow-hidden 
                bg-primary-100 dark:bg-primary-900/50
                flex items-center justify-center
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {src ? (
                <Image
                    src={src}
                    alt={alt || name || "Avatar"}
                    fill
                    className="object-cover"
                    sizes={`(max-width: 768px) ${size === "xl" ? "64px" : "48px"}, ${size === "xl" ? "64px" : "48px"}`}
                />
            ) : initials ? (
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {initials}
                </span>
            ) : (
                <User className={`text-primary-500 dark:text-primary-400 ${iconSizes[size]}`} />
            )}
        </div>
    );
}

// Avatar Group
interface AvatarGroupProps {
    avatars: { src?: string; name?: string }[];
    max?: number;
    size?: AvatarSize;
}

export function AvatarGroup({ avatars, max = 4, size = "sm" }: AvatarGroupProps) {
    const visible = avatars.slice(0, max);
    const remaining = avatars.length - max;

    return (
        <div className="flex -space-x-2">
            {visible.map((avatar, index) => (
                <Avatar
                    key={index}
                    src={avatar.src}
                    name={avatar.name}
                    size={size}
                    className="ring-2 ring-white dark:ring-slate-900"
                />
            ))}
            {remaining > 0 && (
                <div
                    className={`
                        relative rounded-full
                        bg-gray-200 dark:bg-gray-700
                        flex items-center justify-center
                        ring-2 ring-white dark:ring-slate-900
                        ${sizeClasses[size]}
                    `}
                >
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                        +{remaining}
                    </span>
                </div>
            )}
        </div>
    );
}
