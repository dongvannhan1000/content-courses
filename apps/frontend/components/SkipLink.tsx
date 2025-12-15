"use client";

import Link from "next/link";

/**
 * SkipLink - Accessibility component for keyboard navigation
 * Allows users to skip to main content without tabbing through header
 */
export function SkipLink() {
    return (
        <Link
            href="#main-content"
            className="
                sr-only focus:not-sr-only
                fixed top-4 left-4 z-[100]
                px-4 py-2
                bg-primary-600 text-white
                font-semibold rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
                transition-all duration-200
            "
        >
            Chuyển đến nội dung chính
        </Link>
    );
}
