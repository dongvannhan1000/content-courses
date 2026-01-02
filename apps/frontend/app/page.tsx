import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import dynamic from "next/dynamic";
import { Filter, SlidersHorizontal, BookOpen, Users, Award, Star } from "lucide-react";
import Link from "next/link";
import type { CourseListItem, Category } from "@/types";

// Dynamic imports - tách chunk riêng, load khi scroll đến
const StudentExperience = dynamic(() => import("@/components/StudentExperience"), {
    loading: () => (
        <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto animate-pulse" />
                    <div className="h-6 w-96 bg-gray-100 dark:bg-gray-800 rounded mx-auto animate-pulse" />
                </div>
                <div className="max-w-5xl mx-auto aspect-[2/1] bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
            </div>
        </section>
    ),
    ssr: true, // Vẫn render HTML trên server cho SEO
});

const Footer = dynamic(() => import("@/components/Footer"), {
    ssr: true,
});

// Server-side data fetching
async function getFeaturedCourses(): Promise<CourseListItem[]> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${apiUrl}/courses/featured?limit=6`, {
            next: { revalidate: 60 }, // Revalidate every 60 seconds
        });
        if (!res.ok) throw new Error("Failed to fetch courses");
        return res.json();
    } catch (error) {
        console.error("Error fetching featured courses:", error);
        return [];
    }
}

async function getCategories(): Promise<Category[]> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${apiUrl}/categories`, {
            next: { revalidate: 300 }, // Revalidate every 5 minutes
        });
        if (!res.ok) throw new Error("Failed to fetch categories");
        return res.json();
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

export default async function Home() {
    // Fetch data in parallel
    const [courses, categories] = await Promise.all([
        getFeaturedCourses(),
        getCategories(),
    ]);

    // Filter to only show main categories (no parent)
    const mainCategories = categories.filter(cat => !('parentId' in cat) || cat.parentId === null);

    return (
        <main className="min-h-screen">
            {/* Header */}
            <Header />

            {/* Hero Section */}
            <Hero />

            {/* Categories Section */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">
                            Khám phá theo danh mục
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Tìm khóa học phù hợp với nhu cầu của bạn
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {mainCategories.length > 0 ? (
                            mainCategories.slice(0, 6).map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/courses?category=${category.slug}`}
                                    className="group glass rounded-2xl p-6 text-center card-hover cursor-pointer"
                                >
                                    <div className="w-12 h-12 mx-auto mb-4 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                        {category.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {category.courseCount || 0} khóa học
                                    </p>
                                </Link>
                            ))
                        ) : (
                            // Skeleton loading state
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="glass rounded-2xl p-6 text-center animate-pulse">
                                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 px-4 bg-gradient-to-r from-primary-500 to-primary-600">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Users className="w-8 h-8 text-white/80" />
                            </div>
                            <div className="text-4xl font-bold text-white mb-1">20,000+</div>
                            <div className="text-primary-100">Học viên</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <BookOpen className="w-8 h-8 text-white/80" />
                            </div>
                            <div className="text-4xl font-bold text-white mb-1">50+</div>
                            <div className="text-primary-100">Khóa học</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Award className="w-8 h-8 text-white/80" />
                            </div>
                            <div className="text-4xl font-bold text-white mb-1">15+</div>
                            <div className="text-primary-100">Giảng viên</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Star className="w-8 h-8 text-white/80" />
                            </div>
                            <div className="text-4xl font-bold text-white mb-1">4.8</div>
                            <div className="text-primary-100">Đánh giá TB</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Courses Section */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
                        <div>
                            <h2 className="font-display font-bold text-4xl text-gray-900 dark:text-white mb-3">
                                Khóa học nổi bật
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Khám phá các khóa học được yêu thích nhất từ cộng đồng
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-3">
                            <button className="px-5 py-2.5 glass text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer">
                                <Filter className="w-4 h-4" />
                                Lọc
                            </button>
                            <button className="px-5 py-2.5 glass text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer">
                                <SlidersHorizontal className="w-4 h-4" />
                                Sắp xếp
                            </button>
                        </div>
                    </div>

                    {/* Course Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.length > 0 ? (
                            courses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))
                        ) : (
                            // Skeleton loading state
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                                    <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                                    <div className="p-6 space-y-4">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Load More Button */}
                    <div className="flex justify-center mt-12">
                        <Link
                            href="/courses"
                            className="px-8 py-4 glass text-primary-700 dark:text-primary-400 font-semibold rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer"
                        >
                            Xem thêm khóa học
                        </Link>
                    </div>
                </div>
            </section>

            {/* Student Experience Section */}
            <StudentExperience />

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="relative overflow-hidden glass rounded-3xl p-12 md:p-16">
                        {/* Background Decoration */}
                        <div className="absolute inset-0 -z-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-300 dark:bg-primary-700 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-300 dark:bg-accent-700 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30"></div>
                        </div>

                        <div className="text-center space-y-6">
                            <h2 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white">
                                Sẵn sàng bắt đầu hành trình của bạn?
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                Tham gia cộng đồng 20,000+ học viên đang xây dựng sự nghiệp
                                thành công trong lĩnh vực Content Marketing
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 pt-4">
                                <button className="px-8 py-4 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity duration-200 cursor-pointer shadow-lg shadow-primary-500/30">
                                    Đăng ký ngay - Miễn phí
                                </button>
                                <button className="px-8 py-4 glass text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer">
                                    Tư vấn 1-1
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </main>
    );
}
