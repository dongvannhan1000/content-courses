"use client";

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    closeOnOverlay?: boolean;
    showCloseButton?: boolean;
}

const sizeClasses: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
};

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = "md",
    closeOnOverlay = true,
    showCloseButton = true,
}: ModalProps) {
    // Handle escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={closeOnOverlay ? onClose : undefined}
            />

            {/* Modal */}
            <div
                className={`
                    relative w-full ${sizeClasses[size]}
                    bg-white dark:bg-slate-800
                    rounded-2xl shadow-2xl
                    animate-scale-in
                    max-h-[90vh] overflow-hidden
                    flex flex-col
                `}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-start justify-between p-6 pb-0">
                        <div className="space-y-1">
                            {title && (
                                <h2
                                    id="modal-title"
                                    className="font-display font-bold text-xl text-gray-900 dark:text-white"
                                >
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {description}
                                </p>
                            )}
                        </div>
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 -mt-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                                aria-label="Đóng"
                            >
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );

    // Use portal to render at document root
    if (typeof window !== "undefined") {
        return createPortal(modalContent, document.body);
    }

    return null;
}

// Modal Footer helper
export function ModalFooter({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 ${className}`}
        >
            {children}
        </div>
    );
}
