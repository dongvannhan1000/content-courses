import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseDetailClient from "./CourseDetailClient";
import type { CourseDetail } from "@/types";

// Server-side data fetching
async function getCourse(slug: string): Promise<CourseDetail | null> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${apiUrl}/courses/${slug}`, {
            next: { revalidate: 60 }, // Revalidate every 60 seconds
        });

        if (!res.ok) {
            if (res.status === 404) {
                return null;
            }
            throw new Error("Failed to fetch course");
        }

        return res.json();
    } catch (error) {
        console.error("Error fetching course:", error);
        return null;
    }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const course = await getCourse(slug);

    if (!course) {
        notFound();
    }

    return (
        <main className="min-h-screen">
            <Header />
            <CourseDetailClient course={course} />
            <Footer />
        </main>
    );
}
