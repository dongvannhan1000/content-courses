"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const testimonials = [
    {
        id: "1",
        name: "Nguyễn Thu Hà",
        role: "Content Creator Freelance",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
        course: "Content Marketing Masterclass",
        feedback: "Khóa học thực sự đã thay đổi tư duy làm nghề của mình. Từ một người viết theo bản năng, mình đã biết cách xây dựng chiến lược nội dung bài bản. Doanh thu freelance của mình đã tăng gấp đôi sau 3 tháng.",
        image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=800&auto=format&fit=crop",
        rating: 5
    },
    {
        id: "2",
        name: "Trần Minh Tuấn",
        role: "Marketing Manager",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
        course: "SEO Content Chuyên Sâu",
        feedback: "Kiến thức rất thực tế, áp dụng được ngay vào dự án của công ty. Giảng viên hỗ trợ cực kỳ nhiệt tình. Mình đặc biệt thích phần case study, rất chi tiết và dễ hiểu.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
        rating: 5
    },
    {
        id: "3",
        name: "Lê Thanh Hương",
        role: "Chủ shop thời trang",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
        course: "Social Media Branding",
        feedback: "Mình học để tự xây dựng thương hiệu cho shop. Kết quả vượt ngoài mong đợi! Lượng tương tác trên Fanpage tăng vọt, đơn hàng cũng đều hơn hẳn. Cảm ơn Content Course rất nhiều!",
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop",
        rating: 5
    }
];

export default function StudentExperience() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);

    useEffect(() => {
        if (!isAutoPlay) return;
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(interval);
    }, [currentIndex, isAutoPlay]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    return (
        <section id="student-experience" className="py-20 px-4 bg-gradient-to-b from-white to-primary-50/30">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16 space-y-4">
                    <h2 className="font-display font-bold text-4xl text-gray-900">
                        Trải nghiệm học viên
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Lắng nghe chia sẻ từ những học viên đã thành công cùng Content Course
                    </p>
                </div>

                {/* Carousel */}
                <div
                    className="relative max-w-5xl mx-auto"
                    onMouseEnter={() => setIsAutoPlay(false)}
                    onMouseLeave={() => setIsAutoPlay(true)}
                >
                    <div className="overflow-hidden rounded-3xl glass shadow-xl border border-white/50">
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {testimonials.map((item) => (
                                <div key={item.id} className="w-full flex-shrink-0">
                                    <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
                                        {/* Content */}
                                        <div className="space-y-6 order-2 md:order-1">
                                            <div className="flex gap-1">
                                                {[...Array(item.rating)].map((_, i) => (
                                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>

                                            <div className="relative">
                                                <Quote className="absolute -top-4 -left-4 w-8 h-8 text-primary-200 rotate-180" />
                                                <p className="text-xl text-gray-700 italic relative z-10 leading-relaxed">
                                                    "{item.feedback}"
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary-100">
                                                    <Image
                                                        src={item.avatar}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                                                    <p className="text-sm text-primary-600 font-medium">{item.role}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Học viên khóa: {item.course}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Image */}
                                        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg order-1 md:order-2 group">
                                            <Image
                                                src={item.image}
                                                alt="Student Project Result"
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-primary-700 shadow-sm">
                                                    Kết quả thực tế
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 md:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-primary-600 hover:scale-110 transition-all duration-200 focus:outline-none z-10"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 md:-right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-primary-600 hover:scale-110 transition-all duration-200 focus:outline-none z-10"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                                        ? "bg-primary-600 w-8"
                                        : "bg-gray-300 hover:bg-primary-300"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
