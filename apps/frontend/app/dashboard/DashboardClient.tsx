"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { enrollmentsApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import {
    DashboardHeader,
    StudentStats,
    InstructorStats,
    StudentView,
    InstructorView,
} from "./components";
import type { EnrollmentListItem } from "@/types";

export default function DashboardClient() {
    const { user, isLoading: authLoading } = useAuth();

    // Student data
    const [enrollments, setEnrollments] = useState<EnrollmentListItem[]>([]);
    const [loading, setLoading] = useState(true);

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
    if (authLoading || (user && loading && !isInstructor)) {
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
                />

                {/* Role-based content */}
                {isInstructor ? (
                    <>
                        {/* Instructor Stats - will be calculated inside InstructorView */}
                        <InstructorView isAdmin={isAdmin} />
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
        </div>
    );
}
