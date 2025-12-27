import { RequireRole } from "@/components/auth/RequireRole";
import LessonsListClient from "./LessonsListClient";

interface LessonsPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LessonsPageProps) {
    const { id } = await params;
    return {
        title: `Quản lý Bài học | Nghề Content`,
        description: "Quản lý bài học của khóa học",
    };
}

export default async function LessonsPage({ params }: LessonsPageProps) {
    const { id } = await params;
    const courseId = parseInt(id, 10);

    return (
        <RequireRole allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <LessonsListClient courseId={courseId} />
        </RequireRole>
    );
}
