import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider, QueryProvider, AuthProvider } from "@/components/providers";
import { ToastProvider } from "@/components/ui";
import { SkipLink } from "@/components/SkipLink";
import "./globals.css";

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    variable: "--font-inter",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Nghề Content",
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
    authors: [{ name: "Nghề Content Team" }],
    openGraph: {
        title: "Nghề Content - Khóa học Content Marketing chuyên nghiệp",
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
                className={`${inter.variable} font-sans antialiased`}
            >
                <ThemeProvider defaultTheme="system">
                    <AuthProvider>
                        <QueryProvider>
                            <ToastProvider>
                                <SkipLink />
                                <div id="main-content" className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                                    {children}
                                </div>
                            </ToastProvider>
                        </QueryProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
