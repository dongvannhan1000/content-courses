import apiClient from "./client";
import type { LessonListItem, LessonDetail } from "@/types";

export interface LessonsResponse {
    lessons: LessonListItem[];
    total: number;
}

export const lessonsApi = {
    // Get all lessons for a course
    getByCourse: async (courseId: number): Promise<LessonListItem[]> => {
        const { data } = await apiClient.get(`/courses/${courseId}/lessons`);
        return data;
    },

    // Get lesson detail by slug
    getBySlug: async (courseId: number, slug: string): Promise<LessonDetail> => {
        const { data } = await apiClient.get(`/courses/${courseId}/lessons/${slug}`);
        return data;
    },

    // Mark lesson as completed
    markComplete: async (lessonId: number): Promise<void> => {
        await apiClient.post(`/lessons/${lessonId}/complete`);
    },

    // Update lesson progress (for video tracking)
    updateProgress: async (lessonId: number, progressPercent: number): Promise<void> => {
        await apiClient.patch(`/lessons/${lessonId}/progress`, {
            progressPercent,
        });
    },
};

export default lessonsApi;
