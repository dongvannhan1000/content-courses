"use client";

import { create } from "zustand";
import { enrollmentsApi } from "@/lib/api/enrollments";

interface EnrollmentState {
    enrolledCourseIds: Set<number>;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchEnrollments: () => Promise<void>;
    isEnrolled: (courseId: number) => boolean;
    resetEnrollments: () => void;
}

export const useEnrollmentStore = create<EnrollmentState>()((set, get) => ({
    enrolledCourseIds: new Set(),
    isLoading: false,
    error: null,

    // Fetch enrollments from server (called on login)
    fetchEnrollments: async () => {
        try {
            set({ isLoading: true, error: null });
            const enrollments = await enrollmentsApi.getMyEnrollments();

            // Filter only ACTIVE enrollments and extract course IDs
            const activeEnrollmentIds = enrollments
                .filter((e) => e.status === "ACTIVE" || e.status === "COMPLETED")
                .map((e) => e.course.id);

            set({
                enrolledCourseIds: new Set(activeEnrollmentIds),
                isLoading: false
            });
        } catch (error) {
            console.error("Failed to fetch enrollments:", error);
            set({ error: "Không thể tải danh sách khóa học đã mua", isLoading: false });
        }
    },

    // Check if user is enrolled in a course
    isEnrolled: (courseId) => {
        return get().enrolledCourseIds.has(courseId);
    },

    // Reset enrollments state (called on logout)
    resetEnrollments: () => {
        set({ enrolledCourseIds: new Set(), isLoading: false, error: null });
    },
}));
