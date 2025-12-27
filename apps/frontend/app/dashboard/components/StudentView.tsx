"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";
import { Card, Button, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { StudentCourseCard } from "./DashboardCourseCard";
import type { EnrollmentListItem } from "@/types";

interface StudentViewProps {
    enrollments: EnrollmentListItem[];
}

export default function StudentView({ enrollments }: StudentViewProps) {
    const [activeTab, setActiveTab] = useState("in-progress");

    // Filter enrollments
    const inProgressEnrollments = enrollments.filter(
        (e) => e.status === "ACTIVE" && e.progressPercent < 100
    );
    const completedEnrollments = enrollments.filter(
        (e) => e.status === "COMPLETED" || e.progressPercent === 100
    );

    // Empty state component
    const EmptyState = ({ isCompleted }: { isCompleted?: boolean }) => (
        <Card variant="glass" padding="lg" className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                {isCompleted ? (
                    <GraduationCap className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                ) : (
                    <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {isCompleted ? "Chưa hoàn thành khóa học nào" : "Chưa có khóa học nào"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
                {isCompleted
                    ? "Hãy tiếp tục học để hoàn thành khóa học đầu tiên!"
                    : "Khám phá các khóa học chất lượng và bắt đầu học ngay"}
            </p>
            {!isCompleted && (
                <Link href="/courses">
                    <Button variant="primary">Khám phá khóa học</Button>
                </Link>
            )}
        </Card>
    );

    return (
        <div>
            <Tabs defaultValue="in-progress" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="in-progress">
                        Đang học ({inProgressEnrollments.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Hoàn thành ({completedEnrollments.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="in-progress">
                    {inProgressEnrollments.length > 0 ? (
                        <div className="space-y-4">
                            {inProgressEnrollments.map((enrollment) => (
                                <StudentCourseCard key={enrollment.id} enrollment={enrollment} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState />
                    )}
                </TabsContent>

                <TabsContent value="completed">
                    {completedEnrollments.length > 0 ? (
                        <div className="space-y-4">
                            {completedEnrollments.map((enrollment) => (
                                <StudentCourseCard key={enrollment.id} enrollment={enrollment} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState isCompleted />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
