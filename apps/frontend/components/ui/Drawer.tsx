"use client";

import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    position?: "right" | "left";
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
};

export function Drawer({
    isOpen,
    onClose,
    title,
    children,
    position = "right",
    size = "lg",
}: DrawerProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on ESC key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleKeyDown]);

    // Focus trap
    useEffect(() => {
        if (isOpen && panelRef.current) {
            panelRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    if (typeof window === "undefined") return null;

    const positionClasses = position === "right"
        ? "right-0 translate-x-full group-data-[state=open]:translate-x-0"
        : "left-0 -translate-x-full group-data-[state=open]:translate-x-0";

    return createPortal(
        <div
            className="fixed inset-0 z-50 group"
            data-state={isOpen ? "open" : "closed"}
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 opacity-0 group-data-[state=open]:opacity-100"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                tabIndex={-1}
                className={`
                    absolute top-0 bottom-0 ${position}-0 w-full ${sizeClasses[size]}
                    bg-white dark:bg-slate-900 shadow-2xl
                    transform transition-transform duration-300 ease-out
                    ${position === "right" ? "translate-x-full" : "-translate-x-full"}
                    group-data-[state=open]:translate-x-0
                    flex flex-col
                    outline-none
                `}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Drawer;
