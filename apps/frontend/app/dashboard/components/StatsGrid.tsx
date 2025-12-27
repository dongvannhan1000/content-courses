"use client";

import { BookOpen, TrendingUp, Award, FileEdit, Clock, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui";

interface StatCardProps {
    icon: React.ReactNode;
    value: number;
    label: string;
    colorClass: string;
}

function StatCard({ icon, value, label, colorClass }: StatCardProps) {
    return (
        <Card
            variant="default"
            padding="md"
            className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass} transition-transform duration-300 group-hover:scale-110`}>
                    {icon}
                </div>
                <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                </div>
            </div>
        </Card>
    );
}

interface StudentStatsProps {
    totalCourses: number;
    inProgress: number;
    completed: number;
}

export function StudentStats({ totalCourses, inProgress, completed }: StudentStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
                icon={<BookOpen className="w-7 h-7 text-primary-600 dark:text-primary-400" />}
                value={totalCourses}
                label="Khóa học"
                colorClass="bg-primary-100 dark:bg-primary-900/50"
            />
            <StatCard
                icon={<TrendingUp className="w-7 h-7 text-amber-600 dark:text-amber-400" />}
                value={inProgress}
                label="Đang học"
                colorClass="bg-amber-100 dark:bg-amber-900/50"
            />
            <StatCard
                icon={<Award className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />}
                value={completed}
                label="Hoàn thành"
                colorClass="bg-emerald-100 dark:bg-emerald-900/50"
            />
        </div>
    );
}

interface InstructorStatsProps {
    totalCourses: number;
    draftCourses: number;
    pendingCourses: number;
    publishedCourses: number;
}

export function InstructorStats({ totalCourses, draftCourses, pendingCourses, publishedCourses }: InstructorStatsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard
                icon={<BookOpen className="w-7 h-7 text-primary-600 dark:text-primary-400" />}
                value={totalCourses}
                label="Tổng khóa học"
                colorClass="bg-primary-100 dark:bg-primary-900/50"
            />
            <StatCard
                icon={<FileEdit className="w-7 h-7 text-gray-600 dark:text-gray-400" />}
                value={draftCourses}
                label="Bản nháp"
                colorClass="bg-gray-100 dark:bg-gray-800"
            />
            <StatCard
                icon={<Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />}
                value={pendingCourses}
                label="Chờ duyệt"
                colorClass="bg-amber-100 dark:bg-amber-900/50"
            />
            <StatCard
                icon={<CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />}
                value={publishedCourses}
                label="Đã xuất bản"
                colorClass="bg-emerald-100 dark:bg-emerald-900/50"
            />
        </div>
    );
}
