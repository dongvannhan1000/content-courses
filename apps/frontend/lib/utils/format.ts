/**
 * Format utilities for course-related data
 */

/**
 * Format course level for display
 * Converts lowercase API values to human-readable Vietnamese labels
 */
export function formatLevel(level: string | undefined | null): string {
    if (!level) return '';

    const levelMap: Record<string, string> = {
        'beginner': 'Cơ bản',
        'intermediate': 'Trung cấp',
        'advanced': 'Nâng cao',
        // Handle capitalized variants (legacy data)
        'Beginner': 'Cơ bản',
        'Intermediate': 'Trung cấp',
        'Advanced': 'Nâng cao',
    };

    return levelMap[level] || level;
}

/**
 * Format duration from seconds to readable string
 */
export function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0m';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
}

/**
 * Format price in VND
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date));
}
