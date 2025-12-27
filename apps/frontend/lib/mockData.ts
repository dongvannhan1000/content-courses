import type { CourseListItem } from "@/types";

export const mockCourses: CourseListItem[] = [
    {
        id: 1,
        title: "Content Marketing từ Zero đến Hero",
        slug: "content-marketing-tu-zero-den-hero",
        shortDesc: "Khóa học toàn diện về Content Marketing, từ cơ bản đến nâng cao. Học cách xây dựng chiến lược nội dung, viết content hấp dẫn.",
        thumbnail: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop",
        price: 2990000,
        discountPrice: 1990000,
        level: "beginner",
        duration: 43200, // 12 hours in seconds
        status: "PUBLISHED",
        publishedAt: new Date("2024-10-01"),
        instructor: {
            id: 1,
            name: "Nguyễn Văn A",
            photoURL: "https://i.pravatar.cc/150?img=12",
            bio: "Senior Content Strategist với 10 năm kinh nghiệm"
        },
        category: {
            id: 1,
            name: "Content Marketing",
            slug: "content-marketing"
        },
        lessonCount: 48,
        enrollmentCount: 5430,
        reviewCount: 1250,
        rating: 4.8,
    },
    {
        id: 2,
        title: "SEO Content Writing chuyên nghiệp",
        slug: "seo-content-writing-chuyen-nghiep",
        shortDesc: "Nắm vững kỹ thuật viết content chuẩn SEO, tăng traffic tự nhiên cho website. Học từ chuyên gia 10 năm kinh nghiệm.",
        thumbnail: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&h=450&fit=crop",
        price: 2190000,
        discountPrice: 1490000,
        level: "intermediate",
        duration: 28800, // 8 hours
        status: "PUBLISHED",
        publishedAt: new Date("2024-11-15"),
        instructor: {
            id: 2,
            name: "Trần Thị B",
            photoURL: "https://i.pravatar.cc/150?img=45",
            bio: "SEO Expert"
        },
        category: {
            id: 2,
            name: "SEO",
            slug: "seo"
        },
        lessonCount: 32,
        enrollmentCount: 3210,
        reviewCount: 890,
        rating: 4.9,
    },
    {
        id: 3,
        title: "Social Media Content Creator",
        slug: "social-media-content-creator",
        shortDesc: "Trở thành Content Creator chuyên nghiệp trên các nền tảng mạng xã hội. Học cách tạo nội dung viral.",
        thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop",
        price: 2590000,
        discountPrice: 1790000,
        level: "beginner",
        duration: 54000, // 15 hours
        status: "PUBLISHED",
        publishedAt: new Date("2024-09-01"),
        instructor: {
            id: 3,
            name: "Lê Văn C",
            photoURL: "https://i.pravatar.cc/150?img=33",
            bio: "Social Media Manager"
        },
        category: {
            id: 3,
            name: "Social Media",
            slug: "social-media"
        },
        lessonCount: 56,
        enrollmentCount: 6780,
        reviewCount: 1520,
        rating: 4.7,
    },
    {
        id: 4,
        title: "Video Content Marketing chuyên sâu",
        slug: "video-content-marketing-chuyen-sau",
        shortDesc: "Làm chủ video marketing từ ý tưởng, kịch bản, quay dựng đến phân phối. Tối ưu hiệu quả với ngân sách hợp lý.",
        thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=450&fit=crop",
        price: 3290000,
        discountPrice: 2290000,
        level: "advanced",
        duration: 64800, // 18 hours
        status: "PUBLISHED",
        publishedAt: new Date("2024-08-01"),
        instructor: {
            id: 4,
            name: "Phạm Thị D",
            photoURL: "https://i.pravatar.cc/150?img=27",
            bio: "Video Production Expert"
        },
        category: {
            id: 4,
            name: "Video Marketing",
            slug: "video-marketing"
        },
        lessonCount: 64,
        enrollmentCount: 2340,
        reviewCount: 678,
        rating: 4.9,
    },
    {
        id: 5,
        title: "Email Marketing & Automation",
        slug: "email-marketing-automation",
        shortDesc: "Xây dựng hệ thống email marketing tự động, tăng conversion và giữ chân khách hàng hiệu quả.",
        thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop",
        price: 1890000,
        discountPrice: 1290000,
        level: "intermediate",
        duration: 36000, // 10 hours
        status: "PUBLISHED",
        publishedAt: new Date("2024-11-01"),
        instructor: {
            id: 5,
            name: "Hoàng Văn E",
            photoURL: "https://i.pravatar.cc/150?img=56",
            bio: "Email Marketing Specialist"
        },
        category: {
            id: 5,
            name: "Email Marketing",
            slug: "email-marketing"
        },
        lessonCount: 40,
        enrollmentCount: 1890,
        reviewCount: 542,
        rating: 4.6,
    },
    {
        id: 6,
        title: "Content Strategy & Planning",
        slug: "content-strategy-planning",
        shortDesc: "Học cách xây dựng chiến lược content dài hạn, lập kế hoạch nội dung, và quản lý content calendar chuyên nghiệp.",
        thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop",
        price: 2390000,
        discountPrice: 1690000,
        level: "intermediate",
        duration: 50400, // 14 hours
        status: "PUBLISHED",
        publishedAt: new Date("2024-10-15"),
        instructor: {
            id: 6,
            name: "Đỗ Thị F",
            photoURL: "https://i.pravatar.cc/150?img=41",
            bio: "Content Strategist"
        },
        category: {
            id: 6,
            name: "Strategy",
            slug: "strategy"
        },
        lessonCount: 52,
        enrollmentCount: 4120,
        reviewCount: 923,
        rating: 4.8,
    },
];

// Categories for filtering
export const mockCategories = [
    { id: 1, name: "Content Marketing", slug: "content-marketing", courseCount: 15 },
    { id: 2, name: "SEO", slug: "seo", courseCount: 12 },
    { id: 3, name: "Social Media", slug: "social-media", courseCount: 18 },
    { id: 4, name: "Video Marketing", slug: "video-marketing", courseCount: 8 },
    { id: 5, name: "Email Marketing", slug: "email-marketing", courseCount: 6 },
    { id: 6, name: "Strategy", slug: "strategy", courseCount: 10 },
];
