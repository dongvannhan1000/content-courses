"use client";

import React, { useState, useCallback } from "react";
import { Eye, Edit3, Bold, Italic, Link2, List, Code } from "lucide-react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    mode?: "simple" | "full";
    minHeight?: string;
    className?: string;
    disabled?: boolean;
}

/**
 * RichTextEditor - Simple markdown editor with preview
 * 
 * Phase 1: Basic textarea with markdown preview toggle
 * Future: Upgrade to TipTap or similar for full WYSIWYG
 * 
 * Supports:
 * - Edit mode: Plain textarea
 * - Preview mode: Rendered markdown (basic)
 * - Toolbar for common formatting (simple mode)
 * 
 * Designed for lesson content and future blog posts.
 */
export function RichTextEditor({
    value,
    onChange,
    placeholder = "Nhập nội dung...",
    mode = "simple",
    minHeight = "200px",
    className = "",
    disabled = false,
}: RichTextEditorProps) {
    const [isPreview, setIsPreview] = useState(false);

    // Insert markdown syntax at cursor
    const insertMarkdown = useCallback((prefix: string, suffix: string = "") => {
        const textarea = document.querySelector<HTMLTextAreaElement>("#rich-text-editor");
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);

        onChange(newText);

        // Restore cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + prefix.length,
                start + prefix.length + selectedText.length
            );
        }, 0);
    }, [value, onChange]);

    // Basic markdown to HTML (very simple)
    const renderMarkdown = useCallback((text: string): string => {
        if (!text) return "";

        let html = text
            // Escape HTML
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            // Bold
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            // Italic
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            // Code
            .replace(/`(.*?)`/g, "<code class='bg-gray-100 dark:bg-slate-700 px-1 rounded'>$1</code>")
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' class='text-primary-600 dark:text-primary-400 underline' target='_blank'>$1</a>")
            // Line breaks
            .replace(/\n/g, "<br />");

        return html;
    }, []);

    return (
        <div className={`border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1">
                    {mode === "full" && (
                        <>
                            <ToolbarButton
                                icon={<Bold className="w-4 h-4" />}
                                title="Bold"
                                onClick={() => insertMarkdown("**", "**")}
                                disabled={disabled || isPreview}
                            />
                            <ToolbarButton
                                icon={<Italic className="w-4 h-4" />}
                                title="Italic"
                                onClick={() => insertMarkdown("*", "*")}
                                disabled={disabled || isPreview}
                            />
                            <ToolbarButton
                                icon={<Code className="w-4 h-4" />}
                                title="Code"
                                onClick={() => insertMarkdown("`", "`")}
                                disabled={disabled || isPreview}
                            />
                            <ToolbarButton
                                icon={<Link2 className="w-4 h-4" />}
                                title="Link"
                                onClick={() => insertMarkdown("[", "](url)")}
                                disabled={disabled || isPreview}
                            />
                            <ToolbarButton
                                icon={<List className="w-4 h-4" />}
                                title="List"
                                onClick={() => insertMarkdown("- ")}
                                disabled={disabled || isPreview}
                            />
                            <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1" />
                        </>
                    )}
                </div>

                {/* Preview Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsPreview(!isPreview)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${isPreview
                                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                            }`}
                    >
                        {isPreview ? (
                            <>
                                <Edit3 className="w-4 h-4" />
                                <span>Sửa</span>
                            </>
                        ) : (
                            <>
                                <Eye className="w-4 h-4" />
                                <span>Xem trước</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor / Preview */}
            {isPreview ? (
                <div
                    className="p-4 prose prose-sm dark:prose-invert max-w-none overflow-auto"
                    style={{ minHeight }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
                />
            ) : (
                <textarea
                    id="rich-text-editor"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full p-4 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-y focus:outline-none"
                    style={{ minHeight }}
                />
            )}
        </div>
    );
}

// Toolbar button component
function ToolbarButton({
    icon,
    title,
    onClick,
    disabled,
}: {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {icon}
        </button>
    );
}
