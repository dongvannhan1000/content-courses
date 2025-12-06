import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    variable: "--font-inter",
    display: "swap",
});

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    variable: "--font-poppins",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Content Course - Khóa học Content Marketing chuyên nghiệp",
    description: "Nền tảng học content marketing hàng đầu với các khóa học chất lượng cao",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" className="scroll-smooth">
            <body
                className={`${inter.variable} ${poppins.variable} font-sans antialiased bg-gradient-to-br from-primary-50 via-white to-accent-50 min-h-screen`}
            >
                {children}
            </body>
        </html>
    );
}
