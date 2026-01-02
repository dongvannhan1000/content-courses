import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
        // Kích thước cho full-width images (course thumbnails, hero)
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        // Kích thước cho thumbnails nhỏ (avatar, icons)
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
        // AVIF nhỏ hơn WebP 20-30%, auto fallback nếu browser không hỗ trợ
        formats: ['image/avif', 'image/webp'],
    },
};

export default nextConfig;
