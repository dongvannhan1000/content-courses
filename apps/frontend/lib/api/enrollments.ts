import { apiClient } from "./client";
import type { EnrollmentListItem, EnrollmentDetail, EnrollmentCheck } from "@/types";

export const enrollmentsApi = {
    /**
     * Get all enrollments for the current user
     * Used for: User's "My Courses" dashboard
     */
    getMyEnrollments: async (): Promise<EnrollmentListItem[]> => {
        const { data } = await apiClient.get("/enrollments");
        return data;
    },

    /**
     * Check if current user is enrolled in a course
     * Used for: Course detail page button state
     */
    checkEnrollment: async (courseId: number): Promise<EnrollmentCheck> => {
        const { data } = await apiClient.get(`/enrollments/${courseId}/check`);
        return data;
    },

    /**
     * Enroll in a course
     * Used for: After successful payment or for free courses
     */
    enroll: async (courseId: number): Promise<EnrollmentDetail> => {
        const { data } = await apiClient.post("/enrollments", { courseId });
        return data;
    },

    /**
     * Update learning progress
     */
    updateProgress: async (enrollmentId: number, progressPercent: number): Promise<EnrollmentDetail> => {
        const { data } = await apiClient.patch(`/enrollments/${enrollmentId}/progress`, { progressPercent });
        return data;
    },

    /**
     * Mark enrollment as completed
     */
    markComplete: async (enrollmentId: number): Promise<EnrollmentDetail> => {
        const { data } = await apiClient.post(`/enrollments/${enrollmentId}/complete`);
        return data;
    },
};
