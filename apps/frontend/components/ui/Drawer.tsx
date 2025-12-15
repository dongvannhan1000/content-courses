"use client";

import { Fragment, useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";

type DrawerPosition = "left" | "right" | "bottom";

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    position?: DrawerPosition;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    children: ReactNode;
    footer?: ReactNode;
}

const positionStyles: Record<DrawerPosition, { container: string; animation: string }> = {
    left: {
        container: "left-0 top-0 h-full w-full max-w-sm",
        animation: "animate-slide-in-left",
    },
    right: {
        container: "right-0 top-0 h-full w-full max-w-sm",
        animation: "animate-slide-in-right",
    },
    bottom: {
        container: "bottom-0 left-0 right-0 max-h-[90vh] rounded-t-2xl",
        animation: "animate-slide-up",
    },
};

export function Drawer({
    isOpen,
    onClose,
    title,
    position = "right",
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    children,
    footer,
}: DrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Lock body scroll
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

    if (!isOpen) return null;

    const styles = positionStyles[position];

    return (
        <Fragment>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={closeOnOverlayClick ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "drawer-title" : undefined}
                className={`
                    fixed z-50
                    bg-white dark:bg-slate-800 shadow-2xl
                    flex flex-col
                    ${styles.container}
                    ${styles.animation}
                `}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
                        {title && (
                            <h2
                                id="drawer-title"
                                className="text-xl font-display font-bold text-gray-900 dark:text-gray-100"
                            >
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer ml-auto"
                                aria-label="Close drawer"
                            >
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </Fragment>
    );
}
