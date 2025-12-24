# Phase 04: Student Dashboard & Learning Interface

## Context Links
- [MVP Architecture Research](../research/researcher-01-mvp-architecture.md)
- [Course Management Backend](phase-03-course-management-backend.md)
- [Authentication System](phase-02-authentication-system.md)

## Overview
Build intuitive student interface for course discovery, enrollment, and learning with features including course browsing, video streaming with progress tracking, PDF viewing, and personalized dashboard for managing learning journey.

## Key Insights
- Course discovery critical for user engagement with React 19 performance
- Progress tracking increases completion rates with real-time updates
- Video player with Bunny Stream integration and quality controls essential for learning
- Mobile responsiveness with Next.js 15.1+ and Tailwind CSS 4.0+ crucial for accessibility
- Next.js 15.1+ App Router provides optimal performance for learning interface
- React 19 concurrent features enhance video streaming experience

## Requirements
1. Student dashboard with enrolled courses
2. Course marketplace with categories and search
3. Video player with resolution controls
4. Progress tracking and resume functionality
5. PDF viewer for course materials
6. Course completion certificates
7. Course ratings and reviews
8. Wishlist/bookmarking feature

## Architecture

### Page Structure
```
Student Interface:
├── Dashboard
│   ├── Enrolled courses
│   ├── Progress overview
│   ├── Recent activity
│   └── Recommendations
├── Marketplace
│   ├── Course listing
│   ├── Categories
│   ├── Search & filters
│   └── Course details
├── Learning Interface
│   ├── Video player
│   ├── Course navigation
│   ├── Materials section
│   └── Progress tracker
└── Profile
    ├── Achievements
    ├── Certificates
    └── Settings
```

### Component Architecture
```typescript
// Core Components
<VideoPlayer>
  - Video element with controls
  - Quality selector
  - Playback speed
  - Fullscreen mode
  - Progress save
</VideoPlayer>

<CourseCard>
  - Thumbnail
  - Title/instructor
  - Price/rating
  - Progress bar
  - Enroll button
</CourseCard>

<LessonNavigation>
  - Section list
  - Lesson completion
  - Expandable sections
  - Time tracking
</LessonNavigation>
```

### State Management
```typescript
// Zustand Store Structure
interface StudentStore {
  // Course data
  enrolledCourses: Course[]
  wishlist: string[]
  progress: Record<string, Progress>

  // UI state
  currentLesson: string | null
  playingVideo: boolean
  sidebarOpen: boolean

  // Actions
  enrollCourse: (courseId: string) => Promise<void>
  updateProgress: (lessonId: string, progress: number) => Promise<void>
  toggleWishlist: (courseId: string) => void
}
```

## Related Code Files
- `app/(dashboard)/student/page.tsx` - Student dashboard
- `app/courses/page.tsx` - Course marketplace
- `app/courses/[id]/learn/page.tsx` - Learning interface
- `components/ui/video-player.tsx` - Video player component
- `components/ui/pdf-viewer.tsx` - PDF viewer
- `lib/student-store.ts` - Student state management
- `hooks/use-progress.ts` - Progress tracking hook

## Implementation Steps

### Step 1: Student Dashboard Implementation
```typescript
// app/(dashboard)/student/page.tsx
export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)

  const enrolledCourses = await prisma.enrollment.findMany({
    where: { userId: session?.user.id },
    include: {
      course: {
        include: {
          instructor: true,
          _count: {
            select: { sections: { select: { lessons: true } } }
          }
        }
      }
    },
    orderBy: { enrolledAt: 'desc' }
  })

  const totalProgress = calculateOverallProgress(enrolledCourses)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Courses Enrolled"
          value={enrolledCourses.length}
        />
        <StatsCard
          title="Completed"
          value={enrolledCourses.filter(e => e.completedAt).length}
        />
        <StatsCard
          title="Total Progress"
          value={`${totalProgress}%`}
        />
      </div>

      <RecentCourses courses={enrolledCourses.slice(0, 3)} />
      <Recommendations />
    </div>
  )
}
```

### Step 2: Course Marketplace
```typescript
// app/courses/page.tsx
export default async function CoursesPage({
  searchParams
}: {
  searchParams: { category?: string, search?: string }
}) {
  const courses = await prisma.course.findMany({
    where: {
      status: 'APPROVED',
      ...(searchParams.category && {
        categoryId: searchParams.category
      }),
      ...(searchParams.search && {
        OR: [
          { title: { contains: searchParams.search } },
          { description: { contains: searchParams.search } }
        ]
      })
    },
    include: {
      instructor: { select: { name: true, image: true } },
      category: true,
      _count: { select: { enrollments: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="container mx-auto py-8">
      <CourseFilters />
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}
```

### Step 3: Video Player Component
```typescript
// components/ui/video-player.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface VideoPlayerProps {
  lessonId: string
  videoUrl: string
  poster?: string
  onProgress: (progress: number) => void
}

export function VideoPlayer({
  lessonId,
  videoUrl,
  poster,
  onProgress
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [qualities, setQualities] = useState<VideoQuality[]>([])
  const [selectedQuality, setSelectedQuality] = useState('720p')
  const [playbackRate, setPlaybackRate] = useState(1)

  useEffect(() => {
    // Save progress every 5 seconds
    const interval = setInterval(() => {
      if (videoRef.current) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
        onProgress(progress)
        saveProgressToServer(lessonId, progress)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [lessonId])

  const saveProgressToServer = async (lessonId: string, progress: number) => {
    await fetch(`/api/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress })
    })
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        poster={poster}
        controls
        playsInline
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
        <div className="flex items-center justify-between">
          <QualitySelector
            qualities={qualities}
            selected={selectedQuality}
            onChange={setSelectedQuality}
          />
          <SpeedSelector
            rates={[0.5, 0.75, 1, 1.25, 1.5, 2]}
            selected={playbackRate}
            onChange={setPlaybackRate}
          />
        </div>
      </div>
    </div>
  )
}
```

### Step 4: PDF Viewer Integration
```typescript
// components/ui/pdf-viewer.tsx
'use client'

import { useState } from 'react'

interface PDFViewerProps {
  url: string
  title: string
}

export function PDFViewer({ url, title }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)

  return (
    <div className="h-full bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            Previous
          </button>
          <span>
            {pageNumber} / {numPages || '?'}
          </span>
          <button
            onClick={() => setPageNumber(p => Math.max(numPages || 1, p + 1))}
            disabled={pageNumber >= (numPages || 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Using react-pdf for PDF rendering */}
      <div className="h-[calc(100%-80px)] overflow-auto">
        <iframe
          src={`${url}#page=${pageNumber}`}
          className="w-full h-full"
          title={title}
        />
      </div>
    </div>
  )
}
```

### Step 5: Progress Tracking System
```typescript
// hooks/use-progress.ts
export function useProgress(courseId: string) {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [courseId])

  const fetchProgress = async () => {
    const response = await fetch(`/api/courses/${courseId}/progress`)
    const data = await response.json()
    setProgress(data)
    setLoading(false)
  }

  const updateProgress = async (lessonId: string, progress: number) => {
    await fetch(`/api/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress })
    })

    // Update local state
    setProgress(prev => ({
      ...prev!,
      lessons: {
        ...prev?.lessons,
        [lessonId]: progress
      }
    }))
  }

  return { progress, loading, updateProgress }
}
```

### Step 6: Course Enrollment API
```typescript
// app/api/courses/[id]/enroll/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: params.id
      }
    }
  })

  if (existing) {
    return NextResponse.json({ error: 'Already enrolled' }, { status: 400 })
  }

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { price: true }
  })

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  // Create enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: session.user.id,
      courseId: params.id,
      paidAmount: course.price,
      status: course.price.gt(0) ? 'PENDING' : 'ACTIVE'
    }
  })

  // If free course, activate immediately
  if (course.price.equals(0)) {
    await activateEnrollment(enrollment.id)
  }

  return NextResponse.json(enrollment)
}
```

### Step 7: Learning Interface Layout
```typescript
// app/courses/[id]/learn/layout.tsx
export default function LearningLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar with course navigation */}
      <CourseSidebar courseId={params.id} className="w-80" />

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
```

### Step 8: Responsive Design Implementation
```typescript
// Tailwind responsive breakpoints
// Mobile: < 768px
// Tablet: 768px - 1024px
// Desktop: > 1024px

// Mobile optimizations:
// - Collapsible sidebar
// - Touch-friendly controls
// - Vertical video layout
// - Swipe navigation
```

### Step 9: Offline Support Preparation
- Service worker for caching
- IndexedDB for offline storage
- Downloadable video lessons
- Sync progress when online

### Step 10: Accessibility Features
- Keyboard navigation
- Screen reader support
- Closed captions
- High contrast mode
- Font size controls

## Todo List
- [ ] Build student dashboard with course cards
- [ ] Create course marketplace with filtering
- [ ] Implement responsive video player
- [ ] Add PDF viewer component
- [ ] Build progress tracking system
- [ ] Create course enrollment flow
- [ ] Implement learning interface layout
- [ ] Add course ratings and reviews
- [ ] Build wishlist feature
- [ ] Create certificate generation
- [ ] Implement search functionality
- [ ] Add course recommendations
- [ ] Build mobile-responsive navigation
- [ ] Add offline support preparation
- [ ] Implement accessibility features
- [ ] Create course completion celebration

## Success Criteria
1. ✅ Students can browse and enroll in courses
2. ✅ Video streaming smooth with quality controls
3. ✅ Progress tracking accurate and persistent
4. ✅ Mobile experience fully functional
5. ✅ Page load times <2.5 seconds
6. ✅ Video buffering <5%

## Risk Assessment

**Low Risk**:
- Basic UI components
- Course listing display
- Progress tracking

**Medium Risk**:
- Video player performance
- Cross-browser compatibility
- Mobile responsiveness

**High Risk**:
- Video streaming costs
- Copyright protection
- User engagement metrics

**Mitigation**:
- Optimize video encoding
- Implement streaming tokens
- A/B test features
- Monitor user analytics

## Security Considerations
1. Video access token validation
2. Enrollment status verification
3. Progress manipulation prevention
4. XSS protection in reviews
5. CSRF protection for actions
6. Rate limiting on sensitive actions
7. Secure file downloads
8. User data privacy

## Next Steps
1. Complete mobile responsive testing
2. Implement user feedback collection
3. Add course recommendation algorithm
4. Begin Phase 05: Payment Integration
5. Set up analytics tracking
6. Create user onboarding flow