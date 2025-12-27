import { RequireRole } from "@/components/auth/RequireRole";
import CourseForm from "../components/CourseForm";

export const metadata = {
    title: "Tạo Khóa học | Nghề Content",
    description: "Tạo khóa học mới",
};

export default function CreateCoursePage() {
    return (
        <RequireRole allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <CourseForm mode="create" />
        </RequireRole>
    );
}
