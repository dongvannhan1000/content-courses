export interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    instructorAvatar: string;
    thumbnail: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewCount: number;
    studentCount: number;
    duration: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    category: string;
    tags: string[];
    lessons: number;
    lastUpdated: string;
    isBestseller?: boolean;
    isNew?: boolean;
}
