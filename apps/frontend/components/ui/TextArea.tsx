"use client";

import React, { forwardRef } from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

/**
 * TextArea - Multi-line input matching Input component style
 * 
 * Usage:
 * ```tsx
 * <TextArea
 *   label="Mô tả"
 *   placeholder="Nhập mô tả khóa học..."
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   rows={4}
 * />
 * ```
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    (
        {
            label,
            error,
            helperText,
            fullWidth = true,
            className = "",
            disabled,
            ...props
        },
        ref
    ) => {
        return (
            <div className={fullWidth ? "w-full" : "inline-block"}>
                {/* Label */}
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {label}
                    </label>
                )}

                {/* TextArea */}
                <textarea
                    ref={ref}
                    disabled={disabled}
                    className={`
                        w-full px-4 py-3
                        bg-white dark:bg-slate-900
                        border rounded-xl
                        text-gray-900 dark:text-white
                        placeholder:text-gray-400 dark:placeholder:text-gray-500
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                        disabled:opacity-50 disabled:cursor-not-allowed
                        resize-y min-h-[100px]
                        transition-colors duration-200
                        ${error
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-200 dark:border-slate-700"
                        }
                        ${className}
                    `}
                    {...props}
                />

                {/* Error message */}
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}

                {/* Helper text */}
                {helperText && !error && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
                )}
            </div>
        );
    }
);

TextArea.displayName = "TextArea";
