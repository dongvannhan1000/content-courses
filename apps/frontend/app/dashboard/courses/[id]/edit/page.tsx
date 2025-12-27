import { RequireRole } from "@/components/auth/RequireRole";
import CourseForm from "../../components/CourseForm";

interface EditCoursePageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditCoursePageProps) {
    const { id } = await params;
    return {
        title: `Chỉnh sửa Khóa học #${id} | Nghề Content`,
        description: "Chỉnh sửa khóa học",
    };
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
    const { id } = await params;
    const courseId = parseInt(id, 10);

    return (
        <RequireRole allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <CourseForm mode="edit" courseId={courseId} />
        </RequireRole>
    );
}
