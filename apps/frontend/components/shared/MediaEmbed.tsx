"use client";

import React, { useMemo } from "react";
import { Play, ExternalLink } from "lucide-react";

type MediaType = "youtube" | "video" | "image" | "document";

interface MediaEmbedProps {
    type: MediaType;
    url: string;
    title?: string;
    className?: string;
    autoplay?: boolean;
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - VIDEO_ID (direct)
 */
function extractYouTubeId(url: string): string | null {
    if (!url) return null;

    // Already just an ID (11 characters, alphanumeric with - and _)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    // Standard watch URL
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    // Short URL (youtu.be)
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    // Embed URL
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    return null;
}

/**
 * MediaEmbed - Unified media embedding component
 * 
 * Phase 1: YouTube embed only
 * Future: Bunny Stream, direct video, image galleries, document viewer
 * 
 * Usage:
 * ```tsx
 * <MediaEmbed 
 *   type="youtube" 
 *   url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *   title="Introduction Video"
 * />
 * ```
 */
export function MediaEmbed({
    type,
    url,
    title,
    className = "",
    autoplay = false,
}: MediaEmbedProps) {
    const youtubeId = useMemo(() => {
        if (type === "youtube") {
            return extractYouTubeId(url);
        }
        return null;
    }, [type, url]);

    // YouTube Embed
    if (type === "youtube") {
        if (!youtubeId) {
            return (
                <div className={`aspect-video bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center ${className}`}>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        URL YouTube không hợp lệ
                    </p>
                </div>
            );
        }

        const embedUrl = `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}`;

        return (
            <div className={`relative aspect-video rounded-xl overflow-hidden bg-black ${className}`}>
                <iframe
                    src={embedUrl}
                    title={title || "YouTube video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
            </div>
        );
    }

    // Direct video (future)
    if (type === "video") {
        return (
            <div className={`relative aspect-video rounded-xl overflow-hidden bg-black ${className}`}>
                <video
                    src={url}
                    title={title}
                    controls
                    className="absolute inset-0 w-full h-full"
                />
            </div>
        );
    }

    // Image
    if (type === "image") {
        return (
            <div className={`relative rounded-xl overflow-hidden ${className}`}>
                <img
                    src={url}
                    alt={title || "Media image"}
                    className="w-full h-auto"
                />
            </div>
        );
    }

    // Document (future - show link)
    if (type === "document") {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${className}`}
            >
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                        {title || "Tài liệu"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {url}
                    </p>
                </div>
            </a>
        );
    }

    return null;
}

/**
 * YouTubeThumbnail - Show YouTube thumbnail without loading iframe
 * Useful for performance in lists
 */
export function YouTubeThumbnail({
    url,
    title,
    onClick,
    className = "",
}: {
    url: string;
    title?: string;
    onClick?: () => void;
    className?: string;
}) {
    const videoId = extractYouTubeId(url);

    if (!videoId) {
        return (
            <div className={`aspect-video bg-gray-100 dark:bg-slate-800 rounded-xl ${className}`} />
        );
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return (
        <div
            className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer group ${className}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <img
                src={thumbnailUrl}
                alt={title || "YouTube thumbnail"}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
            </div>
        </div>
    );
}
