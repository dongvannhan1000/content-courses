import apiClient from "./client";
import type { LessonListItem, LessonDetail, ProgressDto, CourseProgressDto, CreateLessonDto, UpdateLessonDto } from "@/types";

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

    // ============ Instructor/Admin Functions ============

    // Create new lesson
    create: async (courseId: number, dto: CreateLessonDto): Promise<LessonDetail> => {
        const { data } = await apiClient.post(`/courses/${courseId}/lessons`, dto);
        return data;
    },

    // Update lesson
    update: async (courseId: number, lessonId: number, dto: UpdateLessonDto): Promise<LessonDetail> => {
        const { data } = await apiClient.put(`/courses/${courseId}/lessons/${lessonId}`, dto);
        return data;
    },

    // Delete lesson
    delete: async (courseId: number, lessonId: number): Promise<void> => {
        await apiClient.delete(`/courses/${courseId}/lessons/${lessonId}`);
    },

    // Reorder lessons
    reorder: async (courseId: number, lessonOrders: { id: number; order: number }[]): Promise<LessonListItem[]> => {
        const { data } = await apiClient.patch(`/courses/${courseId}/lessons/reorder`, { lessonOrders });
        return data;
    },
};

export default lessonsApi;
