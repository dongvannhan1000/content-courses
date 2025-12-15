import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { ThemeProvider } from "@/components/providers";
import { ToastProvider } from "@/components/ui";
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
    description:
        "Nền tảng học content marketing hàng đầu với các khóa học chất lượng cao, giúp bạn làm chủ nghệ thuật viết content và xây dựng thương hiệu.",
    keywords: [
        "content marketing",
        "khóa học content",
        "học viết content",
        "marketing online",
        "SEO content",
        "social media marketing",
    ],
    authors: [{ name: "Content Course Team" }],
    openGraph: {
        title: "Content Course - Khóa học Content Marketing chuyên nghiệp",
        description: "Nền tảng học content marketing hàng đầu Việt Nam",
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
            <head>
                {/* Prevent flash of wrong theme */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                const stored = localStorage.getItem('theme');
                                const theme = stored || 'system';
                                const resolved = theme === 'system' 
                                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                                    : theme;
                                document.documentElement.classList.add(resolved);
                            })();
                        `,
                    }}
                />
            </head>
            <body
                className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
            >
                <ThemeProvider defaultTheme="system">
                    <ToastProvider>
                        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                            {children}
                        </div>
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
