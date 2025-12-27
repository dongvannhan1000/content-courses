import { RequireRole } from "@/components/auth/RequireRole";
import CoursesListClient from "./CoursesListClient";

export const metadata = {
    title: "Quản lý Khóa học | Nghề Content",
    description: "Quản lý các khóa học của bạn",
};

export default function InstructorCoursesPage() {
    return (
        <RequireRole allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <CoursesListClient />
        </RequireRole>
    );
}
