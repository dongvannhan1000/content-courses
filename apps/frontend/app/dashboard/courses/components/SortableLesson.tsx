"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Edit3,
    Trash2,
    GripVertical,
    Video,
    FileText,
    Eye,
    EyeOff,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { LessonListItem, LessonType } from "@/types";

interface SortableLessonProps {
    lesson: LessonListItem;
    index: number;
    onEdit: (lesson: LessonListItem) => void;
    onDelete: (lesson: LessonListItem) => void;
}

// Lesson type icons
const lessonTypeIcons: Record<LessonType, React.ReactNode> = {
    VIDEO: <Video className="w-5 h-5 text-primary-500" />,
    DOCUMENT: <FileText className="w-5 h-5 text-blue-500" />,
    QUIZ: <FileText className="w-5 h-5 text-orange-500" />,
};

// Format duration from seconds to minutes
function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function SortableLesson({ lesson, index, onEdit, onDelete }: SortableLessonProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lesson.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 overflow-hidden ${isDragging ? "opacity-50 shadow-2xl z-50" : ""}`}
        >
            <div className="flex items-center p-4 gap-4">
                {/* Drag handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none"
                >
                    <GripVertical className="w-5 h-5" />
                </div>

                {/* Order number */}
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    {index + 1}
                </div>

                {/* Type icon */}
                <div className="shrink-0">
                    {lessonTypeIcons[lesson.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {lesson.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{lesson.type}</span>
                        {lesson.duration > 0 && (
                            <>
                                <span>•</span>
                                <span>{formatDuration(lesson.duration)}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2">
                    {lesson.isFree && (
                        <Badge variant="success" size="sm">FREE</Badge>
                    )}
                    {lesson.isPublished ? (
                        <Badge variant="primary" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            Public
                        </Badge>
                    ) : (
                        <Badge variant="default" size="sm">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Draft
                        </Badge>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit3 className="w-4 h-4" />}
                        onClick={() => onEdit(lesson)}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={() => onDelete(lesson)}
                    />
                </div>
            </div>
        </div>
    );
}
