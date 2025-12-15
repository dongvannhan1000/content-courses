"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

interface ThemeToggleProps {
    variant?: "icon" | "menu";
    className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
    const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

    if (variant === "menu") {
        return (
            <div className={`flex items-center gap-1 p-1 glass rounded-xl ${className}`}>
                <button
                    onClick={() => setTheme("light")}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${theme === "light"
                            ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                    aria-label="Light mode"
                    title="Light mode"
                >
                    <Sun className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setTheme("dark")}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${theme === "dark"
                            ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                    aria-label="Dark mode"
                    title="Dark mode"
                >
                    <Moon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setTheme("system")}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${theme === "system"
                            ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                    aria-label="System theme"
                    title="System theme"
                >
                    <Monitor className="w-4 h-4" />
                </button>
            </div>
        );
    }

    // Simple icon toggle
    return (
        <button
            onClick={toggleTheme}
            className={`p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors duration-200 cursor-pointer ${className}`}
            aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
        >
            {resolvedTheme === "light" ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
        </button>
    );
}
