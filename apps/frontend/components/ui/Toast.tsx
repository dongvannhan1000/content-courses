"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

// Convenience methods
export function useToastActions() {
    const { addToast } = useToast();

    return {
        success: (title: string, message?: string) =>
            addToast({ type: "success", title, message }),
        error: (title: string, message?: string) =>
            addToast({ type: "error", title, message }),
        warning: (title: string, message?: string) =>
            addToast({ type: "warning", title, message }),
        info: (title: string, message?: string) =>
            addToast({ type: "info", title, message }),
    };
}

interface ToastProviderProps {
    children: ReactNode;
    maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback(
        (toast: Omit<Toast, "id">) => {
            const id = Math.random().toString(36).substring(2, 9);
            const newToast = { ...toast, id };

            setToasts((prev) => {
                const updated = [...prev, newToast];
                // Limit max toasts
                if (updated.length > maxToasts) {
                    return updated.slice(-maxToasts);
                }
                return updated;
            });

            // Auto dismiss
            const duration = toast.duration ?? 5000;
            if (duration > 0) {
                setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== id));
                }, duration);
            }
        },
        [maxToasts]
    );

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

const typeConfig: Record<
    ToastType,
    { icon: typeof CheckCircle; bgClass: string; iconClass: string }
> = {
    success: {
        icon: CheckCircle,
        bgClass: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        iconClass: "text-green-500",
    },
    error: {
        icon: AlertCircle,
        bgClass: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
        iconClass: "text-red-500",
    },
    warning: {
        icon: AlertTriangle,
        bgClass: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
        iconClass: "text-yellow-500",
    },
    info: {
        icon: Info,
        bgClass: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
        iconClass: "text-blue-500",
    },
};

function ToastContainer({
    toasts,
    removeToast,
}: {
    toasts: Toast[];
    removeToast: (id: string) => void;
}) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const config = typeConfig[toast.type];
    const Icon = config.icon;

    return (
        <div
            className={`
                flex items-start gap-3 p-4 rounded-xl border shadow-lg
                animate-slide-in-right
                ${config.bgClass}
            `}
            role="alert"
        >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconClass}`} />
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100">{toast.title}</p>
                {toast.message && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{toast.message}</p>
                )}
            </div>
            <button
                onClick={onClose}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4 text-gray-400" />
            </button>
        </div>
    );
}
