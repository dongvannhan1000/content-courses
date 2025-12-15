import { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDetailClient from "./CourseDetailClient";

interface CourseDetailPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({
    params,
}: CourseDetailPageProps): Promise<Metadata> {
    const { slug } = await params;

    // In production, fetch course data for SEO
    return {
        title: `${slug.replace(/-/g, " ")} | Content Course`,
        description: "Khóa học chất lượng cao trên nền tảng Content Course",
    };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
    const { slug } = await params;

    if (!slug) {
        notFound();
    }

    return <CourseDetailClient slug={slug} />;
}
