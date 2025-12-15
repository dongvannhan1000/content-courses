import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "@/lib/api";
import {
    CourseListItem,
    CourseDetail,
    PaginatedCourses,
    CourseFilters,
    CategoryTreeItem,
} from "@/types";

// ============ Query Keys ============

export const courseKeys = {
    all: ["courses"] as const,
    lists: () => [...courseKeys.all, "list"] as const,
    list: (filters: CourseFilters) => [...courseKeys.lists(), filters] as const,
    featured: () => [...courseKeys.all, "featured"] as const,
    details: () => [...courseKeys.all, "detail"] as const,
    detail: (slug: string) => [...courseKeys.details(), slug] as const,
};

export const categoryKeys = {
    all: ["categories"] as const,
    tree: () => [...categoryKeys.all, "tree"] as const,
};

// ============ API Functions ============

async function fetchCourses(filters: CourseFilters): Promise<PaginatedCourses> {
    const { data } = await api.get("/courses", { params: filters });
    return data;
}

async function fetchFeaturedCourses(): Promise<CourseListItem[]> {
    const { data } = await api.get("/courses/featured");
    return data;
}

async function fetchCourseBySlug(slug: string): Promise<CourseDetail> {
    const { data } = await api.get(`/courses/${slug}`);
    return data;
}

async function fetchCategories(): Promise<CategoryTreeItem[]> {
    const { data } = await api.get("/categories");
    return data;
}

// ============ Query Hooks ============

/**
 * Fetch paginated courses with filters
 * Used in: Courses listing page
 */
export function useCourses(filters: CourseFilters = {}) {
    return useQuery({
        queryKey: courseKeys.list(filters),
        queryFn: () => fetchCourses(filters),
    });
}

/**
 * Fetch featured courses for homepage
 * Used in: Homepage featured section
 */
export function useFeaturedCourses() {
    return useQuery({
        queryKey: courseKeys.featured(),
        queryFn: fetchFeaturedCourses,
        staleTime: 10 * 60 * 1000, // Featured courses can be stale longer
    });
}

/**
 * Fetch single course by slug
 * Used in: Course detail page
 */
export function useCourse(slug: string) {
    return useQuery({
        queryKey: courseKeys.detail(slug),
        queryFn: () => fetchCourseBySlug(slug),
        enabled: !!slug,
    });
}

/**
 * Fetch category tree for navigation
 * Used in: Header, FilterSidebar
 */
export function useCategories() {
    return useQuery({
        queryKey: categoryKeys.tree(),
        queryFn: fetchCategories,
        staleTime: 30 * 60 * 1000, // Categories don't change often
    });
}

// ============ Prefetch Functions ============

/**
 * Prefetch course detail on hover (for faster navigation)
 */
export function usePrefetchCourse() {
    const queryClient = useQueryClient();

    return (slug: string) => {
        queryClient.prefetchQuery({
            queryKey: courseKeys.detail(slug),
            queryFn: () => fetchCourseBySlug(slug),
            staleTime: 5 * 60 * 1000,
        });
    };
}
