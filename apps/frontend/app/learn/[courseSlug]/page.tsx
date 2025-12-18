import { notFound, redirect } from "next/navigation";
import { coursesApi } from "@/lib/api";
import LearnClient from "./LearnClient";

interface LearnPageProps {
    params: Promise<{
        courseSlug: string;
    }>;
}

export default async function LearnPage({ params }: LearnPageProps) {
    const { courseSlug } = await params;

    try {
        // Fetch course data
        const course = await coursesApi.getBySlug(courseSlug);

        if (!course) {
            notFound();
        }

        return <LearnClient course={course} />;
    } catch (error) {
        console.error("Error fetching course:", error);
        notFound();
    }
}

// Generate metadata
export async function generateMetadata({ params }: LearnPageProps) {
    const { courseSlug } = await params;

    try {
        const course = await coursesApi.getBySlug(courseSlug);
        return {
            title: `Học: ${course.title} | Content Course`,
            description: course.shortDesc,
        };
    } catch {
        return {
            title: "Khóa học | Content Course",
        };
    }
}
