import { notFound } from "next/navigation";
import { coursesApi, lessonsApi } from "@/lib/api";
import LessonPlayerClient from "./LessonPlayerClient";

interface LessonPageProps {
    params: Promise<{
        courseSlug: string;
        lessonSlug: string;
    }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
    const { courseSlug, lessonSlug } = await params;

    try {
        // Fetch course first to get courseId
        const course = await coursesApi.getBySlug(courseSlug);

        if (!course) {
            notFound();
        }

        // Fetch lesson detail
        const lesson = await lessonsApi.getBySlug(course.id, lessonSlug);

        if (!lesson) {
            notFound();
        }

        return (
            <LessonPlayerClient
                course={course}
                lesson={lesson}
                allLessons={course.lessons || []}
            />
        );
    } catch (error) {
        console.error("Error fetching lesson:", error);
        notFound();
    }
}

// Generate metadata
export async function generateMetadata({ params }: LessonPageProps) {
    const { courseSlug, lessonSlug } = await params;

    try {
        const course = await coursesApi.getBySlug(courseSlug);
        const lesson = await lessonsApi.getBySlug(course.id, lessonSlug);

        return {
            title: `${lesson.title} - ${course.title} | Content Course`,
            description: lesson.content?.substring(0, 160),
        };
    } catch {
        return {
            title: "Bài học | Content Course",
        };
    }
}
