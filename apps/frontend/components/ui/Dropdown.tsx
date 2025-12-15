"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

interface DropdownOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

interface DropdownProps {
    options: DropdownOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export function Dropdown({
    options,
    value,
    onChange,
    placeholder = "Chọn...",
    label,
    error,
    disabled = false,
    className = "",
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Calculate dropdown position
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e: MouseEvent) => {
            if (!triggerRef.current?.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [isOpen]);

    // Close on escape
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const handleSelect = (option: DropdownOption) => {
        if (option.disabled) return;
        onChange?.(option.value);
        setIsOpen(false);
    };

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {label}
                </label>
            )}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full px-4 py-3
                    bg-white dark:bg-slate-800
                    border rounded-xl
                    text-left
                    flex items-center justify-between gap-2
                    transition-colors duration-200
                    cursor-pointer
                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    ${error
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"
                    }
                    focus:outline-none focus:ring-2 focus:border-transparent
                `}
            >
                <span
                    className={
                        selectedOption
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-400 dark:text-gray-500"
                    }
                >
                    {selectedOption ? (
                        <span className="flex items-center gap-2">
                            {selectedOption.icon}
                            {selectedOption.label}
                        </span>
                    ) : (
                        placeholder
                    )}
                </span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {error && <p className="text-xs text-red-500">{error}</p>}

            {isOpen &&
                typeof window !== "undefined" &&
                createPortal(
                    <div
                        className="fixed z-50 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl animate-fade-in overflow-hidden"
                        style={{
                            top: position.top,
                            left: position.left,
                            width: position.width,
                        }}
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option)}
                                disabled={option.disabled}
                                className={`
                                    w-full px-4 py-2.5
                                    text-left flex items-center gap-2
                                    transition-colors duration-150
                                    cursor-pointer
                                    ${option.value === value
                                        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }
                                    ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                            >
                                {option.icon}
                                {option.label}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
        </div>
    );
}
