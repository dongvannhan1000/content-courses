import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Youtube, Instagram } from "lucide-react";
import { Input, Button } from "@/components/ui";

const footerLinks = {
    courses: [
        { label: "Content Marketing", href: "/courses?category=content-marketing" },
        { label: "SEO Content", href: "/courses?category=seo" },
        { label: "Social Media", href: "/courses?category=social-media" },
        { label: "Video Marketing", href: "/courses?category=video-marketing" },
        { label: "Email Marketing", href: "/courses?category=email-marketing" },
    ],
    company: [
        { label: "Về chúng tôi", href: "/about" },
        { label: "Đội ngũ giảng viên", href: "/instructors" },
        { label: "Trở thành giảng viên", href: "/become-instructor" },
        { label: "Blog", href: "/blog" },
        { label: "Liên hệ", href: "/contact" },
    ],
    support: [
        { label: "Trung tâm trợ giúp", href: "/help" },
        { label: "Câu hỏi thường gặp", href: "/faq" },
        { label: "Điều khoản sử dụng", href: "/terms" },
        { label: "Chính sách bảo mật", href: "/privacy" },
        { label: "Chính sách hoàn tiền", href: "/refund" },
    ],
};

export default function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800">
            {/* Newsletter Section */}
            <div className="border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="glass rounded-2xl p-8 md:p-12">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">
                                    Nhận thông tin mới nhất
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Đăng ký để nhận bài viết, tips và khuyến mãi mới nhất từ Content Course
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <Input
                                        type="email"
                                        placeholder="Nhập email của bạn"
                                        leftIcon={<Mail className="w-5 h-5" />}
                                    />
                                </div>
                                <Button variant="primary">Đăng ký</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">CC</span>
                            </div>
                            <span className="font-display font-bold text-xl text-primary-700 dark:text-primary-400">
                                Content Course
                            </span>
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Nền tảng học Content Marketing hàng đầu Việt Nam với hơn 20,000 học viên.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer"
                            >
                                <Youtube className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Courses */}
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Khóa học</h4>
                        <ul className="space-y-3">
                            {footerLinks.courses.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Về chúng tôi</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Hỗ trợ</h4>
                        <ul className="space-y-3">
                            {footerLinks.support.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Liên hệ</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-5 h-5 shrink-0 text-primary-500" />
                                <span>123 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <Phone className="w-5 h-5 shrink-0 text-primary-500" />
                                <span>1900 1234 56</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <Mail className="w-5 h-5 shrink-0 text-primary-500" />
                                <span>support@contentcourse.vn</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            © 2024 Content Course. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link
                                href="/terms"
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                                Điều khoản
                            </Link>
                            <Link
                                href="/privacy"
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                                Bảo mật
                            </Link>
                            <Link
                                href="/sitemap"
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                                Sitemap
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
