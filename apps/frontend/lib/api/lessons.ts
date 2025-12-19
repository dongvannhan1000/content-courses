import apiClient from "./client";
import type { LessonListItem, LessonDetail, ProgressDto, CourseProgressDto } from "@/types";

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
    markComplete: async (courseId: number, lessonId: number): Promise<ProgressDto> => {
        const { data } = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
        return data;
    },

    // Get course progress summary
    getCourseProgress: async (courseId: number): Promise<CourseProgressDto> => {
        const { data } = await apiClient.get(`/courses/${courseId}/progress`);
        return data;
    },

    // [Placeholder] Get lesson progress (for video resume)
    getLessonProgress: async (courseId: number, lessonId: number): Promise<ProgressDto> => {
        const { data } = await apiClient.get(`/courses/${courseId}/lessons/${lessonId}/progress`);
        return data;
    },

    // [Placeholder] Update lesson progress (for video tracking)
    updateProgress: async (courseId: number, lessonId: number, watchedSeconds: number, lastPosition: number): Promise<ProgressDto> => {
        const { data } = await apiClient.patch(`/courses/${courseId}/lessons/${lessonId}/progress`, {
            watchedSeconds,
            lastPosition,
        });
        return data;
    },
};

export default lessonsApi;

