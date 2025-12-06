import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import StudentExperience from "@/components/StudentExperience";
import { mockCourses } from "@/lib/mockData";
import { Filter, SlidersHorizontal } from "lucide-react";

export default function Home() {
    return (
        <main className="min-h-screen">
            {/* Header */}
            <Header />

            {/* Hero Section */}
            <Hero />

            {/* Courses Section */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
                        <div>
                            <h2 className="font-display font-bold text-4xl text-gray-900 mb-3">
                                Khóa học nổi bật
                            </h2>
                            <p className="text-gray-600">
                                Khám phá các khóa học được yêu thích nhất từ cộng đồng
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-3">
                            <button className="px-5 py-2.5 glass text-gray-700 font-medium rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer">
                                <Filter className="w-4 h-4" />
                                Lọc
                            </button>
                            <button className="px-5 py-2.5 glass text-gray-700 font-medium rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer">
                                <SlidersHorizontal className="w-4 h-4" />
                                Sắp xếp
                            </button>
                        </div>
                    </div>

                    {/* Course Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {mockCourses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>

                    {/* Load More Button */}
                    <div className="flex justify-center mt-12">
                        <button className="px-8 py-4 glass text-primary-700 font-semibold rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer">
                            Xem thêm khóa học
                        </button>
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
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
                        </div>

                        <div className="text-center space-y-6">
                            <h2 className="font-display font-bold text-4xl md:text-5xl text-gray-900">
                                Sẵn sàng bắt đầu hành trình của bạn?
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Tham gia cộng đồng 20,000+ học viên đang xây dựng sự nghiệp
                                thành công trong lĩnh vực Content Marketing
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 pt-4">
                                <button className="px-8 py-4 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity duration-200 cursor-pointer shadow-lg shadow-primary-500/30">
                                    Đăng ký ngay - Miễn phí
                                </button>
                                <button className="px-8 py-4 glass text-gray-700 font-semibold rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer">
                                    Tư vấn 1-1
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Brand */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">CC</span>
                                </div>
                                <span className="font-display font-bold text-xl text-primary-700">
                                    Content Course
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">
                                Nền tảng học Content Marketing hàng đầu Việt Nam
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Khóa học</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>
                                    <a href="#" className="hover:text-primary-600 transition-colors duration-200">
                                        Content Marketing
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary-600 transition-colors duration-200">
                                        SEO Content
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary-600 transition-colors duration-200">
                                        Social Media
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Khám phá</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>
                                    <a href="/#student-experience" className="hover:text-primary-600 transition-colors duration-200">
                                        Trải nghiệm học viên
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary-600 transition-colors duration-200">
                                        Giảng viên
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary-600 transition-colors duration-200">
                                        Liên hệ
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Hỗ trợ</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>
                                    <a href="#" className="hover:text-primary-600 transition-colors duration-200">
                                        Trung tâm trợ giúp
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary-600 transition-colors duration-200">
                                        Điều khoản
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary-600 transition-colors duration-200">
                                        Chính sách
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
                        © 2024 Content Course. All rights reserved.
                    </div>
                </div>
            </footer>
        </main>
    );
}
