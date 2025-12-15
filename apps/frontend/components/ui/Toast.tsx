"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const bgClasses: Record<ToastType, string> = {
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { ...toast, id }]);

        // Auto remove after duration
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, toast.duration || 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback(
        (title: string, description?: string) => {
            addToast({ type: "success", title, description });
        },
        [addToast]
    );

    const error = useCallback(
        (title: string, description?: string) => {
            addToast({ type: "error", title, description });
        },
        [addToast]
    );

    const warning = useCallback(
        (title: string, description?: string) => {
            addToast({ type: "warning", title, description });
        },
        [addToast]
    );

    const info = useCallback(
        (title: string, description?: string) => {
            addToast({ type: "info", title, description });
        },
        [addToast]
    );

    return (
        <ToastContext.Provider
            value={{ toasts, addToast, removeToast, success, error, warning, info }}
        >
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}

function ToastContainer({
    toasts,
    onRemove,
}: {
    toasts: Toast[];
    onRemove: (id: string) => void;
}) {
    if (typeof window === "undefined" || toasts.length === 0) return null;

    return createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        flex items-start gap-3 p-4
                        rounded-xl border shadow-lg backdrop-blur-sm
                        animate-slide-in-right
                        ${bgClasses[toast.type]}
                    `}
                >
                    <span className="shrink-0 mt-0.5">{icons[toast.type]}</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                            {toast.title}
                        </p>
                        {toast.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {toast.description}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => onRemove(toast.id)}
                        className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            ))}
        </div>,
        document.body
    );
}
