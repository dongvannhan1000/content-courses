"use client";

import { Fragment, useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: ModalSize;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    children: ReactNode;
    footer?: ReactNode;
}

const sizeStyles: Record<ModalSize, string> = {
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
    size = "md",
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    children,
    footer,
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Focus trap
    useEffect(() => {
        if (!isOpen) return;

        const content = contentRef.current;
        if (!content) return;

        const focusableElements = content.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        document.addEventListener("keydown", handleTab);
        firstElement?.focus();

        return () => document.removeEventListener("keydown", handleTab);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Fragment>
            {/* Overlay */}
            <div
                ref={overlayRef}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={closeOnOverlayClick ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div
                    ref={contentRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? "modal-title" : undefined}
                    aria-describedby={description ? "modal-description" : undefined}
                    className={`
                        relative w-full ${sizeStyles[size]}
                        bg-white dark:bg-slate-800
                        rounded-2xl shadow-2xl
                        animate-scale-in
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                            <div>
                                {title && (
                                    <h2
                                        id="modal-title"
                                        className="text-xl font-display font-bold text-gray-900 dark:text-gray-100"
                                    >
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p
                                        id="modal-description"
                                        className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        {description}
                                    </p>
                                )}
                            </div>
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 -mt-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6">{children}</div>

                    {/* Footer */}
                    {footer && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    );
}
