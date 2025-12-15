"use client";

import { useTheme } from "@/components/providers";
import { Sun, Moon, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const themes = [
        { value: "light" as const, label: "Sáng", icon: Sun },
        { value: "dark" as const, label: "Tối", icon: Moon },
        { value: "system" as const, label: "Hệ thống", icon: Monitor },
    ];

    const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 cursor-pointer"
                aria-label="Chuyển đổi theme"
            >
                <CurrentIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 glass dark:bg-slate-800/90 rounded-xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden animate-scale-in z-50">
                    {themes.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => {
                                setTheme(value);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer
                                ${theme === value
                                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                }
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
