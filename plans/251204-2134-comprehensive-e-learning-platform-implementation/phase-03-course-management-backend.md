# Phase 03: Course Management Backend

## Context Links
- [MVP Architecture Research](../research/researcher-01-mvp-architecture.md)
- [Authentication System](phase-02-authentication-system.md)

## Overview
Implement robust backend API for course management enabling instructors to create, upload, and manage courses with support for video lessons, PDF materials, and course metadata while ensuring proper access control and file management.

## Key Insights
- Bunny Stream API provides cost-effective video streaming ($0.007/GB) with secure tokens
- Cloudinary simplifies media management with transformations and CDN
- File upload requires chunked handling for large videos with NestJS streaming
- Course preview essential for instructor approval workflow with proper access control
- Version control needed for course updates with audit trails
- NestJS 11.0+ provides robust file handling and security features

## Requirements
1. Course creation API (title, description, price, category)
2. Video upload with processing and streaming
3. PDF resource management
4. Course structure (sections and lessons)
5. Draft/published/approved status management
6. Preview functionality for admins
7. Instructor dashboard for course management

## Architecture

### API Structure
```
/api/courses/
├── POST /           - Create new course
├── GET /            - List courses (with filters)
├── GET /[id]        - Get course details
├── PUT /[id]        - Update course
├── DELETE /[id]     - Delete course
├── POST /[id]/publish - Publish course
├── POST /[id]/upload - Upload media
└── GET /[id]/stats  - Course analytics
```

### Data Models
```typescript
// Course Structure
Course {
  id: string
  title: string
  description: string
  price: number
  status: 'DRAFT' | 'PUBLISHED' | 'APPROVED'
  thumbnail?: string
  instructorId: string
  categoryId: string
  sections: Section[]
  enrollments: Enrollment[]
}

// Course Content
Section {
  id: string
  title: string
  order: number
  courseId: string
  lessons: Lesson[]
}

Lesson {
  id: string
  title: string
  content: {
    type: 'video' | 'pdf' | 'text'
    url: string
    duration?: number
  }
  order: number
  sectionId: string
  isPreview: boolean
}
```

### File Handling Strategy
1. **Videos**: Direct upload to Mux via signed URLs
2. **Images**: Cloudinary with automatic optimization
3. **PDFs**: AWS S3 with CDN distribution
4. **Thumbnails**: Auto-generated from video frames

## Related Code Files
- `app/api/courses/route.ts` - Course CRUD endpoints
- `app/api/courses/[id]/route.ts` - Individual course operations
- `app/api/upload/route.ts` - File upload handling
- `lib/mux.ts` - Mux API integration
- `lib/cloudinary.ts` - Cloudinary configuration
- `lib/s3.ts` - AWS S3 utilities
- `prisma/schema.prisma` - Course models

## Implementation Steps

### Step 1: Create Course Schema in Prisma
```prisma
model Course {
  id          String      @id @default(cuid())
  title       String
  description String
  price       Decimal     @default(0)
  status      CourseStatus @default(DRAFT)
  thumbnail   String?
  instructorId String
  categoryId  String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  instructor  User        @relation(fields: [instructorId], references: [id])
  category    Category    @relation(fields: [categoryId], references: [id])
  sections    Section[]
  enrollments Enrollment[]

  @@map('courses')
}

model Section {
  id        String  @id @default(cuid())
  title     String
  order     Int
  courseId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  course   Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons  Lesson[]

  @@map('sections')
}

model Lesson {
  id         String       @id @default(cuid())
  title      String
  content    Json         // {type, url, duration}
  order      Int
  isPreview  Boolean      @default(false)
  sectionId  String
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  section  Section @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  progress LessonProgress[]

  @@map('lessons')
}
```

### Step 2: Set Up Mux Video Integration
```typescript
// lib/mux.ts
import { Mux } from '@mux/mux-node'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

export async function createUpload(uploadData: {
  title: string
  courseId: string
  lessonId: string
}) {
  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: 'signed',
    },
    cors_origin: process.env.NEXT_PUBLIC_APP_URL,
  })

  // Store upload info in database
  await prisma.lesson.update({
    where: { id: uploadData.lessonId },
    data: {
      content: {
        type: 'video',
        uploadId: upload.id,
        status: 'uploading'
      }
    }
  })

  return upload
}
```

### Step 3: Implement Course CRUD API
```typescript
// app/api/courses/route.ts
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const course = await prisma.course.create({
    data: {
      ...body,
      instructorId: session.user.id,
    },
    include: {
      instructor: true,
      category: true,
    },
  })

  return NextResponse.json(course)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status') || 'PUBLISHED'

  const courses = await prisma.course.findMany({
    where: {
      status,
      ...(category && { categoryId: category })
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  })

  return NextResponse.json(courses)
}
```

### Step 4: File Upload Handling
```typescript
// app/api/upload/video/route.ts
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const courseId = formData.get('courseId') as string
  const lessonId = formData.get('lessonId') as string

  // Create Mux upload
  const upload = await createUpload({
    title: file.name,
    courseId,
    lessonId,
  })

  return NextResponse.json({
    uploadUrl: upload.url,
    uploadId: upload.id,
  })
}
```

### Step 5: Cloudinary Image Upload
```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(file: File, folder: string) {
  const buffer = await file.arrayBuffer()
  const result = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`,
    {
      folder,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { crop: 'fill', width: 1200, height: 630 }
      ]
    }
  )
  return result
}
```

### Step 6: Course Publishing Workflow
1. Instructor marks course as ready
2. System validates course completeness
3. Course status changes to PUBLISHED
4. Admin receives notification for approval
5. Admin can approve/reject with feedback

### Step 7: Webhook for Mux Processing
```typescript
// app/api/webhooks/mux/route.ts
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('mux-signature')

  // Verify webhook signature
  if (!verifyWebhook(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.type === 'video.asset.ready') {
    // Update lesson with playback URLs
    await prisma.lesson.update({
      where: {
        content: { path: ['uploadId'] },
        equals: event.object.id
      },
      data: {
        content: {
          type: 'video',
          assetId: event.object.id,
          playbackId: event.object.playback_ids[0].id,
          duration: event.object.duration,
          status: 'ready'
        }
      }
    })
  }

  return NextResponse.json({ received: true })
}
```

### Step 8: Course Analytics Endpoint
```typescript
// app/api/courses/[id]/stats/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const course = await prisma.course.findFirst({
    where: {
      id: params.id,
      instructorId: session.user.id,
    },
    include: {
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      },
      _count: {
        select: {
          enrollments: true,
          sections: {
            select: {
              lessons: true,
            }
          }
        }
      }
    }
  })

  // Calculate completion rates
  const stats = {
    totalEnrollments: course?._count.enrollments || 0,
    totalRevenue: course?.enrollments.reduce(
      (sum, e) => sum + Number(e.paidAmount || 0),
      0
    ),
    averageProgress: calculateAverageProgress(course?.enrollments || []),
    recentEnrollments: course?.enrollments.slice(-10),
  }

  return NextResponse.json(stats)
}
```

### Step 9: Error Handling & Validation
- Comprehensive input validation with Zod
- File size and format restrictions
- Upload progress tracking
- Failed upload recovery
- Duplicate prevention

### Step 10: API Documentation
- OpenAPI/Swagger documentation
- Example requests/responses
- Error code reference
- Rate limiting information

## Todo List
- [ ] Set up Mux video streaming integration
- [ ] Configure Cloudinary for image uploads
- [ ] Implement course CRUD API endpoints
- [ ] Create file upload handlers
- [ ] Build course publishing workflow
- [ ] Set up Mux webhook processing
- [ ] Implement course analytics
- [ ] Add input validation and sanitization
- [ ] Create course preview functionality
- [ ] Build instructor dashboard API
- [ ] Implement course versioning
- [ ] Add course search and filtering
- [ ] Set up CDN for media delivery
- [ ] Create course export/import feature
- [ ] Implement course completion certificates
- [ ] Add course ratings and reviews API

## Success Criteria
1. ✅ Instructors can create courses with metadata
2. ✅ Video uploads processed and streaming functional
3. ✅ Course preview available for admins
4. ✅ Publishing workflow complete
5. ✅ File management secure and efficient
6. ✅ API response times <500ms

## Risk Assessment

**Low Risk**:
- Basic CRUD operations with NestJS 11.0+ patterns
- File upload with established NestJS libraries (@nestjs/platform-express)
- Bunny Stream integration (well-documented, cost-effective)

**Medium Risk**:
- Large file upload reliability with chunked uploads
- Video processing delays with Bunny Stream API
- Storage cost management with Cloudinary/S3 optimization
- File validation and security scanning

**High Risk**:
- **Copyright Protection**: Video theft and unauthorized distribution
- **Content Security**: Malicious file uploads and injection attacks
- **Access Control**: Unauthorized course modification or deletion
- **Performance Bottlenecks**: Large video uploads affecting API performance
- **Data Integrity**: Course content corruption during uploads
- **Storage Vulnerabilities**: Direct file access bypassing authentication

**Mitigation Strategies**:
1. **Content Protection**:
   - Implement Bunny Stream signed URLs with expiration
   - Add dynamic watermarks to videos using Bunny Stream API
   - Track viewing logs and detect abnormal access patterns
   - Implement DRM-style token validation for video access

2. **Upload Security**:
   - Comprehensive file validation (type, size, content scanning)
   - Virus scanning with ClamAV for all uploads
   - Sandboxing of uploaded files during processing
   - Rate limiting on upload endpoints with @nestjs/throttler

3. **Access Control**:
   - Multi-layer authorization with NestJS guards
   - Resource-based access control (instructors only own their courses)
   - Audit trails for all course modifications
   - Admin approval workflow for course publication

4. **Performance Optimization**:
   - Chunked upload with resumable transfers for large files
   - Background job processing with Bull Queue for video transcoding
   - CDN caching for static course content
   - Database query optimization with Prisma indexes

5. **Data Integrity**:
   - Checksum validation for uploaded files
   - Transactional database operations for course updates
   - Automated backup of course content
   - Rollback mechanisms for failed operations

6. **Storage Security**:
   - Pre-signed URLs with limited expiration
   - Server-side encryption for stored files
   - Regular security audits of file access patterns
   - Isolation of user uploads in separate storage paths

## Security Considerations
1. Video access tokens with expiration
2. Upload size limits to prevent abuse
3. File type validation for security
4. Instructor authentication for uploads
5. API rate limiting on uploads
6. Secure temporary URLs for uploads
7. Audit logging for all changes
8. Content scanning for malware

## Next Steps
1. Complete API testing with Postman/Insomnia
2. Implement frontend course creation UI
3. Set up monitoring for uploads
4. Begin Phase 04: Student Dashboard
5. Create API rate limiting rules
6. Document all endpoints