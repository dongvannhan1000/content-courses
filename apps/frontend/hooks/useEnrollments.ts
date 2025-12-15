import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "@/lib/api";
import { EnrollmentListItem, EnrollmentCheck } from "@/types";
import { useAuthStore } from "@/stores";

// ============ Query Keys ============

export const enrollmentKeys = {
    all: ["enrollments"] as const,
    lists: () => [...enrollmentKeys.all, "list"] as const,
    check: (courseId: number) => [...enrollmentKeys.all, "check", courseId] as const,
};

// ============ API Functions ============

async function fetchMyEnrollments(): Promise<EnrollmentListItem[]> {
    const { data } = await api.get("/enrollments");
    return data;
}

async function checkEnrollment(courseId: number): Promise<EnrollmentCheck> {
    const { data } = await api.get(`/enrollments/${courseId}/check`);
    return data;
}

async function enrollInCourse(courseId: number): Promise<EnrollmentListItem> {
    const { data } = await api.post("/enrollments", { courseId });
    return data;
}

// ============ Query Hooks ============

/**
 * Fetch user's enrollments (My Courses)
 * Used in: Dashboard, My Learning page
 */
export function useMyEnrollments() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: enrollmentKeys.lists(),
        queryFn: fetchMyEnrollments,
        enabled: isAuthenticated,
    });
}

/**
 * Check if user is enrolled in a course
 * Used in: Course detail page (show Enroll vs Continue button)
 */
export function useEnrollmentCheck(courseId: number) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: enrollmentKeys.check(courseId),
        queryFn: () => checkEnrollment(courseId),
        enabled: isAuthenticated && courseId > 0,
    });
}

// ============ Mutation Hooks ============

/**
 * Enroll in a course
 * Used in: Course detail page Enroll button
 */
export function useEnroll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: enrollInCourse,
        onSuccess: (data) => {
            // Invalidate enrollments list
            queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() });
            // Update the check query for this course
            queryClient.setQueryData(
                enrollmentKeys.check(data.course.id),
                {
                    enrolled: true,
                    status: data.status,
                    progressPercent: data.progressPercent,
                    enrollmentId: data.id,
                }
            );
        },
    });
}
