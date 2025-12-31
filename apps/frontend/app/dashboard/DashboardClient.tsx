"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { enrollmentsApi, coursesApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import {
    DashboardHeader,
    StudentStats,
    StudentView,
    CourseFormModal,
} from "./components";
import InstructorView from "./components/InstructorView";
import type { EnrollmentListItem, CourseListItem } from "@/types";

export default function DashboardClient() {
    const { user, isLoading: authLoading } = useAuth();

    // Student data
    const [enrollments, setEnrollments] = useState<EnrollmentListItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Instructor drawer state (lifted here for header button)
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CourseListItem | undefined>(undefined);
    const [courses, setCourses] = useState<CourseListItem[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);

    // Determine if user is instructor/admin
    const isInstructor = user?.role === "INSTRUCTOR" || user?.role === "ADMIN";
    const isAdmin = user?.role === "ADMIN";

    // Fetch enrollments for students
    useEffect(() => {
        if (!user?.id || isInstructor) {
            setLoading(false);
            return;
        }

        let isCancelled = false;

        const fetchEnrollments = async () => {
            try {
                setLoading(true);
                const data = await enrollmentsApi.getMyEnrollments();
                if (!isCancelled) {
                    setEnrollments(data);
                }
            } catch (err: unknown) {
                console.error("Error fetching enrollments:", err);
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        fetchEnrollments();

        return () => {
            isCancelled = true;
        };
    }, [user?.id, isInstructor]);

    // Fetch courses for instructors
    useEffect(() => {
        if (!user?.id || !isInstructor) {
            setCoursesLoading(false);
            return;
        }

        const fetchCourses = async () => {
            try {
                setCoursesLoading(true);
                const data = await coursesApi.getMyCourses();
                setCourses(data);
            } catch (err) {
                console.error("Error fetching courses:", err);
            } finally {
                setCoursesLoading(false);
            }
        };

        fetchCourses();
    }, [user?.id, isInstructor]);

    // Refresh courses after create/edit
    const refreshCourses = useCallback(async () => {
        try {
            const data = await coursesApi.getMyCourses();
            setCourses(data);
        } catch (err) {
            console.error("Error refreshing courses:", err);
        }
    }, []);

    // Drawer handlers
    const handleCreateCourse = useCallback(() => {
        setEditingCourse(undefined);
        setDrawerOpen(true);
    }, []);

    const handleEditCourse = useCallback((course: CourseListItem) => {
        setEditingCourse(course);
        setDrawerOpen(true);
    }, []);

    const handleDrawerSuccess = useCallback(() => {
        refreshCourses();
    }, [refreshCourses]);

    // Calculate student stats
    const inProgressEnrollments = enrollments.filter(
        (e) => e.status === "ACTIVE" && e.progressPercent < 100
    );
    const completedEnrollments = enrollments.filter(
        (e) => e.status === "COMPLETED" || e.progressPercent === 100
    );

    const studentStats = {
        totalCourses: enrollments.length,
        inProgress: inProgressEnrollments.length,
        completed: completedEnrollments.length,
    };

    // Continue learning link
    const continueLink = inProgressEnrollments.length > 0
        ? `/learn/${inProgressEnrollments[0].course.slug}`
        : undefined;

    // Loading state
    if (authLoading || (user && loading && !isInstructor) || (user && isInstructor && coursesLoading)) {
        return (
            <div className="min-h-screen py-8 pt-24 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen py-8 pt-24">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header with gradient */}
                <DashboardHeader
                    user={user}
                    hasInProgressCourses={inProgressEnrollments.length > 0}
                    continueLink={continueLink}
                    onCreateCourse={isInstructor ? handleCreateCourse : undefined}
                />

                {/* Role-based content */}
                {isInstructor ? (
                    <>
                        <InstructorView
                            isAdmin={isAdmin}
                            courses={courses}
                            setCourses={setCourses}
                            onEditCourse={handleEditCourse}
                            onCreateCourse={handleCreateCourse}
                        />
                    </>
                ) : (
                    <>
                        {/* Student Stats */}
                        <StudentStats
                            totalCourses={studentStats.totalCourses}
                            inProgress={studentStats.inProgress}
                            completed={studentStats.completed}
                        />

                        {/* Student Courses */}
                        <StudentView enrollments={enrollments} />
                    </>
                )}
            </div>

            {/* Course Form Modal - rendered at top level */}
            {isInstructor && (
                <CourseFormModal
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    course={editingCourse}
                    onSuccess={handleDrawerSuccess}
                />
            )}
        </div>
    );
}
