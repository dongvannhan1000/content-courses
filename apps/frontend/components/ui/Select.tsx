"use client";

import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
    label?: string;
    options: SelectOption[];
    error?: string;
    helperText?: string;
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
    placeholder?: string;
}

const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-5 py-4 text-lg",
};

/**
 * Select - Styled dropdown component matching Input style
 * 
 * Usage:
 * ```tsx
 * <Select
 *   label="Danh mục"
 *   options={[
 *     { value: "1", label: "JavaScript" },
 *     { value: "2", label: "Python" },
 *   ]}
 *   value={categoryId}
 *   onChange={(e) => setCategoryId(e.target.value)}
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            label,
            options,
            error,
            helperText,
            size = "md",
            fullWidth = true,
            placeholder,
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

                {/* Select wrapper */}
                <div className="relative">
                    <select
                        ref={ref}
                        disabled={disabled}
                        className={`
                            w-full appearance-none cursor-pointer
                            bg-white dark:bg-slate-900
                            border rounded-xl
                            text-gray-900 dark:text-white
                            pr-10
                            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-colors duration-200
                            ${sizeClasses[size]}
                            ${error
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-200 dark:border-slate-700"
                            }
                            ${className}
                        `}
                        {...props}
                    >
                        {/* Placeholder option */}
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}

                        {/* Options */}
                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Chevron icon */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                </div>

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

Select.displayName = "Select";
