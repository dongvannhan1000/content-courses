"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
    Play,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Clock,
    FileText,
    Download,
    Loader2,
    Menu,
    X,
} from "lucide-react";
import Header from "@/components/Header";
import { Card, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { RequireAuth } from "@/components/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEnrollmentStore } from "@/lib/stores";
import { enrollmentsApi, coursesApi, lessonsApi } from "@/lib/api";
import type { CourseDetail, LessonDetail, LessonSummary } from "@/types";

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Demo YouTube videos for testing
const DEMO_YOUTUBE_IDS = [
    "dQw4w9WgXcQ", // Rick Astley
    "jNQXAC9IVRw", // First YouTube video
    "9bZkp7q19f0", // Gangnam Style
    "kJQP7kiw5Fk", // Despacito
    "RgKAFK5djSk", // See You Again
];

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export default function LessonPage() {
    const router = useRouter();
    const params = useParams();
    const courseSlug = params.courseSlug as string;
    const lessonSlug = params.lessonSlug as string;

    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { isEnrolled: isEnrolledInStore } = useEnrollmentStore();

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [lesson, setLesson] = useState<LessonDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            if (!courseSlug || !lessonSlug) return;

            try {
                setIsLoading(true);
                setError(null);

                // Fetch course first
                const courseData = await coursesApi.getBySlug(courseSlug);
                setCourse(courseData);

                // If authenticated, check enrollment
                if (isAuthenticated && courseData) {
                    try {
                        const enrollData = await enrollmentsApi.checkEnrollment(courseData.id);

                        // Redirect to course detail if not enrolled (and lesson is not free)
                        // For now, allow access to lesson detail to test
                    } catch (enrollError) {
                        console.error("Failed to check enrollment:", enrollError);
                    }
                }

                // Fetch lesson detail
                if (courseData) {
                    try {
                        const lessonData = await lessonsApi.getBySlug(courseData.id, lessonSlug);
                        setLesson(lessonData);
                    } catch (lessonError) {
                        console.error("Failed to fetch lesson:", lessonError);
                        // Use mock lesson data for testing
                        const mockLesson = courseData.lessons?.find(l => l.slug === lessonSlug);
                        if (mockLesson) {
                            setLesson({
                                id: mockLesson.id,
                                title: mockLesson.title,
                                slug: mockLesson.slug,
                                order: mockLesson.order,
                                duration: mockLesson.duration,
                                isFree: mockLesson.isFree,
                                type: "VIDEO" as const,
                                isPublished: true,
                                content: "<p>Nội dung bài học sẽ được hiển thị ở đây.</p>",
                                media: [],
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });
                        } else {
                            setError("Không tìm thấy bài học");
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Không tìm thấy khóa học");
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
            fetchData();
        }
    }, [courseSlug, lessonSlug, isAuthenticated, authLoading, router]);

    const allLessons = course?.lessons || [];
    const currentIndex = allLessons.findIndex((l) => l.slug === lessonSlug);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    // Get video from media or use demo
    const videoMedia = lesson?.media?.find(
        (m) => m.type === "VIDEO" || m.type === "YOUTUBE_EMBED"
    );
    const youtubeId = videoMedia?.url
        ? extractYouTubeId(videoMedia.url)
        : DEMO_YOUTUBE_IDS[Math.abs(currentIndex) % DEMO_YOUTUBE_IDS.length];

    const handleMarkComplete = () => {
        setIsCompleted(true);
        // Navigate to next lesson if available
        if (nextLesson) {
            setTimeout(() => {
                router.push(`/learn/${courseSlug}/${nextLesson.slug}`);
            }, 1000);
        }
    };

    // Loading state
    if (authLoading || isLoading) {
        return (
            <main className="min-h-screen bg-gray-900">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                        <p className="text-gray-400">Đang tải...</p>
                    </div>
                </div>
            </main>
        );
    }

    // Error state
    if (error || !course || !lesson) {
        return (
            <main className="min-h-screen">
                <Header />
                <div className="min-h-screen py-8 pt-24 flex items-center justify-center">
                    <Card variant="glass" padding="lg" className="text-center max-w-md">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">
                            {error || "Không tìm thấy bài học"}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Bài học này không tồn tại hoặc bạn chưa có quyền truy cập.
                        </p>
                        <Link href={`/learn/${courseSlug}`}>
                            <Button variant="primary">Quay lại khóa học</Button>
                        </Link>
                    </Card>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-900">
            <RequireAuth>
                {/* Top Bar */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/learn/${courseSlug}`}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="hidden sm:inline">{course.title}</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant={isCompleted ? "secondary" : "primary"}
                                size="sm"
                                onClick={handleMarkComplete}
                                disabled={isCompleted}
                                leftIcon={isCompleted ? <CheckCircle className="w-4 h-4" /> : undefined}
                            >
                                {isCompleted ? "Đã hoàn thành" : "Hoàn thành bài học"}
                            </Button>

                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex pt-14">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Video Player */}
                        <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
                            {youtubeId ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                                    title={lesson.title}
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-gray-400">
                                        <Play className="w-16 h-16 mx-auto mb-4" />
                                        <p>Video chưa được cấu hình</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lesson Info */}
                        <div className="p-4 sm:p-6 text-white">
                            <div className="max-w-4xl">
                                {/* Title & Meta */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                        <span>Bài {currentIndex + 1}</span>
                                        {lesson.isFree && (
                                            <Badge variant="success" size="sm">
                                                Miễn phí
                                            </Badge>
                                        )}
                                        <span>•</span>
                                        <Clock className="w-4 h-4" />
                                        <span>{formatDuration(lesson.duration)}</span>
                                    </div>
                                    <h1 className="font-display font-bold text-2xl sm:text-3xl">
                                        {lesson.title}
                                    </h1>
                                </div>

                                {/* Tabs */}
                                <Tabs defaultValue="content">
                                    <TabsList className="bg-gray-800">
                                        <TabsTrigger value="content">Nội dung</TabsTrigger>
                                        <TabsTrigger value="materials">
                                            Tài liệu ({lesson.media?.filter(m => m.type === "DOCUMENT").length || 0})
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="content" className="mt-6">
                                        {lesson.content ? (
                                            <div
                                                className="prose prose-invert prose-lg max-w-none"
                                                dangerouslySetInnerHTML={{ __html: lesson.content }}
                                            />
                                        ) : (
                                            <p className="text-gray-400">
                                                Nội dung bài học sẽ được hiển thị ở đây.
                                            </p>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="materials" className="mt-6">
                                        {lesson.media?.filter(m => m.type === "DOCUMENT").length ? (
                                            <div className="space-y-3">
                                                {lesson.media
                                                    .filter((m) => m.type === "DOCUMENT")
                                                    .map((doc) => (
                                                        <a
                                                            key={doc.id}
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                                                        >
                                                            <FileText className="w-8 h-8 text-primary-400" />
                                                            <div className="flex-1">
                                                                <p className="font-medium">{doc.title || doc.filename}</p>
                                                                {doc.size && (
                                                                    <p className="text-sm text-gray-400">
                                                                        {(doc.size / 1024 / 1024).toFixed(2)} MB
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Download className="w-5 h-5 text-gray-400" />
                                                        </a>
                                                    ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400">Không có tài liệu đính kèm.</p>
                                        )}
                                    </TabsContent>
                                </Tabs>

                                {/* Navigation */}
                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
                                    {prevLesson ? (
                                        <Link
                                            href={`/learn/${courseSlug}/${prevLesson.slug}`}
                                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                            <div className="text-left">
                                                <p className="text-xs text-gray-500">Bài trước</p>
                                                <p className="font-medium truncate max-w-[200px]">
                                                    {prevLesson.title}
                                                </p>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div />
                                    )}

                                    {nextLesson ? (
                                        <Link
                                            href={`/learn/${courseSlug}/${nextLesson.slug}`}
                                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Bài tiếp theo</p>
                                                <p className="font-medium truncate max-w-[200px]">
                                                    {nextLesson.title}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5" />
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/learn/${courseSlug}`}
                                            className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
                                        >
                                            <span>Hoàn thành khóa học</span>
                                            <CheckCircle className="w-5 h-5" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Curriculum */}
                    <div
                        className={`fixed lg:relative inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800 transform transition-transform duration-300 z-40 ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
                            } pt-14 lg:pt-0`}
                    >
                        <div className="h-full overflow-y-auto">
                            <div className="p-4 border-b border-gray-800">
                                <h3 className="font-semibold text-white">Nội dung khóa học</h3>
                                <p className="text-sm text-gray-400">{allLessons.length} bài học</p>
                            </div>

                            <div className="p-2">
                                {allLessons.map((l, index) => {
                                    const isCurrent = l.slug === lessonSlug;
                                    const isDone = index < currentIndex;

                                    return (
                                        <Link
                                            key={l.id}
                                            href={`/learn/${courseSlug}/${l.slug}`}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isCurrent
                                                ? "bg-primary-600/20 text-primary-400"
                                                : "text-gray-300 hover:bg-gray-800"
                                                }`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${isDone
                                                    ? "bg-green-600 text-white"
                                                    : isCurrent
                                                        ? "bg-primary-600 text-white"
                                                        : "bg-gray-700 text-gray-400"
                                                    }`}
                                            >
                                                {isDone ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{l.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDuration(l.duration)}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </RequireAuth>
        </main>
    );
}
