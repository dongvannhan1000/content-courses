import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    variable: "--font-inter",
    display: "swap",
});

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin", "latin-ext"],
    variable: "--font-poppins",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Content Course - Khóa học Content Marketing chuyên nghiệp",
    description: "Nền tảng học content marketing hàng đầu với các khóa học chất lượng cao",
    keywords: ["content marketing", "khóa học", "marketing", "digital marketing"],
    authors: [{ name: "Content Course" }],
    openGraph: {
        title: "Content Course - Khóa học Content Marketing chuyên nghiệp",
        description: "Nền tảng học content marketing hàng đầu với các khóa học chất lượng cao",
        type: "website",
        locale: "vi_VN",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" className="scroll-smooth" suppressHydrationWarning>
            <body
                className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
            >
                <Providers>
                    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
                        {children}
                    </div>
                </Providers>
            </body>
        </html>
    );
}
