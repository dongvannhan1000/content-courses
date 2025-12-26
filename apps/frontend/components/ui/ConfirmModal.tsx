"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { Button } from "./Button";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

const variantStyles = {
    danger: {
        icon: <Trash2 className="w-6 h-6" />,
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        buttonVariant: "danger" as const,
    },
    warning: {
        icon: <AlertTriangle className="w-6 h-6" />,
        iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
        iconColor: "text-yellow-600 dark:text-yellow-400",
        buttonVariant: "primary" as const,
    },
    info: {
        icon: <AlertTriangle className="w-6 h-6" />,
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        buttonVariant: "primary" as const,
    },
};

/**
 * ConfirmModal - Confirmation dialog for destructive actions
 * 
 * Usage:
 * ```tsx
 * <ConfirmModal
 *   isOpen={showDeleteModal}
 *   onClose={() => setShowDeleteModal(false)}
 *   onConfirm={handleDelete}
 *   title="Xóa khóa học"
 *   message="Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác."
 *   variant="danger"
 * />
 * ```
 */
export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Xác nhận",
    message = "Bạn có chắc chắn muốn thực hiện hành động này?",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "danger",
    isLoading = false,
}: ConfirmModalProps) {
    const styles = variantStyles[variant];

    const handleConfirm = () => {
        onConfirm();
        // Note: Parent should close modal after async operation completes
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnOverlay={!isLoading}>
            <div className="text-center">
                {/* Icon */}
                <div className={`w-14 h-14 mx-auto mb-4 ${styles.iconBg} rounded-full flex items-center justify-center`}>
                    <span className={styles.iconColor}>{styles.icon}</span>
                </div>

                {/* Title */}
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>

                {/* Message */}
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {message}
                </p>
            </div>

            {/* Actions */}
            <ModalFooter className="justify-center">
                <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={isLoading}
                >
                    {cancelText}
                </Button>
                <Button
                    variant={styles.buttonVariant}
                    onClick={handleConfirm}
                    loading={isLoading}
                >
                    {confirmText}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
