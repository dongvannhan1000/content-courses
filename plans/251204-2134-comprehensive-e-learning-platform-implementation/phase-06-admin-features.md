# Phase 06: Admin Features

## Context Links
- [MVP Architecture Research](../research/researcher-01-mvp-architecture.md)
- [Payment Integration](phase-05-payment-integration.md)

## Overview
Implement comprehensive admin dashboard for platform management including course approval workflow, user management, order processing, content moderation, analytics dashboard, and system configuration to ensure platform quality and compliance.

## Key Insights
- Course approval essential for quality control with NestJS role-based access
- User management critical for platform safety with advanced admin controls
- Analytics dashboard drives business decisions with React 19 real-time updates
- Bulk operations reduce admin workload with efficient NestJS background jobs
- Comprehensive audit trails required for compliance and security monitoring
- Multi-factor authentication for admin access prevents unauthorized platform control
- Latest NestJS 11.0+ security features enhance admin protection

## Requirements
1. Course approval/rejection workflow
2. User management (view, edit, ban, role change)
3. Order management and dispute handling
4. Content moderation tools
5. Analytics and reporting dashboard
6. System configuration and settings
7. Announcement management
8. Support ticket system

## Architecture

### Admin Dashboard Structure
```
Admin Dashboard:
├── Overview
│   ├── Key metrics
│   ├── Recent activities
│   └── Quick actions
├── Courses
│   ├── Pending approval
│   ├── Published courses
│   └── Course details/edit
├── Users
│   ├── User listing with filters
│   ├── User details
│   └── Bulk actions
├── Orders
│   ├── Order history
│   ├── Dispute management
│   └── Refund processing
├── Analytics
│   ├── Revenue reports
│   ├── User engagement
│   └── Course performance
├── Content
│   ├── Reports & flags
│   ├── Categories management
│   └── Announcements
└── Settings
    ├── Platform configuration
    ├── Payment settings
    └── System preferences
```

### Permission System
```typescript
enum AdminPermission {
  // Course Management
  APPROVE_COURSES = 'approve_courses',
  EDIT_COURSES = 'edit_courses',
  DELETE_COURSES = 'delete_courses',

  // User Management
  VIEW_USERS = 'view_users',
  EDIT_USERS = 'edit_users',
  BAN_USERS = 'ban_users',
  CHANGE_ROLES = 'change_roles',

  // Order Management
  VIEW_ORDERS = 'view_orders',
  PROCESS_REFUNDS = 'process_refunds',
  HANDLE_DISPUTES = 'handle_disputes',

  // System
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SETTINGS = 'manage_settings',
  SEND_ANNOUNCEMENTS = 'send_announcements'
}
```

## Related Code Files
- `app/(dashboard)/admin/page.tsx` - Admin dashboard
- `app/api/admin/courses/approve/route.ts` - Course approval
- `app/api/admin/users/[id]/role/route.ts` - Role management
- `components/admin/analytics-chart.tsx` - Analytics components
- `lib/admin-permissions.ts` - Permission utilities
- `hooks/use-admin-permissions.ts` - Permission hook

## Implementation Steps

### Step 1: Admin Permission System
```typescript
// lib/admin-permissions.ts
export const adminPermissions = {
  SUPER_ADMIN: [
    AdminPermission.APPROVE_COURSES,
    AdminPermission.EDIT_COURSES,
    AdminPermission.DELETE_COURSES,
    AdminPermission.VIEW_USERS,
    AdminPermission.EDIT_USERS,
    AdminPermission.BAN_USERS,
    AdminPermission.CHANGE_ROLES,
    AdminPermission.VIEW_ORDERS,
    AdminPermission.PROCESS_REFUNDS,
    AdminPermission.HANDLE_DISPUTES,
    AdminPermission.VIEW_ANALYTICS,
    AdminPermission.MANAGE_SETTINGS,
    AdminPermission.SEND_ANNOUNCEMENTS
  ],
  CONTENT_ADMIN: [
    AdminPermission.APPROVE_COURSES,
    AdminPermission.EDIT_COURSES,
    AdminPermission.VIEW_USERS,
    AdminPermission.BAN_USERS
  ],
  SUPPORT_ADMIN: [
    AdminPermission.VIEW_USERS,
    AdminPermission.VIEW_ORDERS,
    AdminPermission.PROCESS_REFUNDS,
    AdminPermission.HANDLE_DISPUTES
  ]
}

export function hasPermission(
  userRole: string,
  permission: AdminPermission
): boolean {
  const permissions = adminPermissions[userRole as keyof typeof adminPermissions]
  return permissions?.includes(permission) || false
}
```

### Step 2: Admin Dashboard Overview
```typescript
// app/(dashboard)/admin/page.tsx
export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  // Fetch dashboard data
  const [
    totalUsers,
    totalCourses,
    pendingCourses,
    monthlyRevenue,
    recentOrders,
    userGrowth,
    courseCompletions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    getMonthlyRevenue(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } }
      }
    }),
    getUserGrowthStats(),
    getCourseCompletionStats()
  ])

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          change={userGrowth.change}
          trend={userGrowth.trend}
        />
        <MetricCard
          title="Total Courses"
          value={totalCourses}
          change={null}
        />
        <MetricCard
          title="Pending Approval"
          value={pendingCourses}
          critical={pendingCourses > 10}
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          change={monthlyRevenue.change}
          trend={monthlyRevenue.trend}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={monthlyRevenue.data} />
        <UserGrowthChart data={userGrowth.data} />
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrders orders={recentOrders} />
        <CourseCompletionChart data={courseCompletions} />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  )
}
```

### Step 3: Course Approval Workflow
```typescript
// app/api/admin/courses/[id]/review/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!hasPermission(session?.user.role, AdminPermission.APPROVE_COURSES)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, reason } = await request.json()

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      instructor: true,
      sections: { include: { lessons: true } }
    }
  })

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  // Validation checks
  const issues = await validateCourse(course)
  if (issues.length > 0 && action === 'APPROVE') {
    return NextResponse.json({
      error: 'Course has validation issues',
      issues
    }, { status: 400 })
  }

  // Update course status
  const updatedCourse = await prisma.course.update({
    where: { id: params.id },
    data: {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
      metadata: {
        rejectionReason: action === 'REJECT' ? reason : null
      }
    }
  })

  // Notify instructor
  await sendCourseReviewEmail(course.instructor.email, {
    courseTitle: course.title,
    status: action.toLowerCase(),
    reason: action === 'REJECT' ? reason : null
  })

  // Log activity
  await logAdminActivity({
    adminId: session.user.id,
    action: `COURSE_${action}`,
    targetId: params.id,
    targetType: 'COURSE',
    details: { reason }
  })

  return NextResponse.json({ course: updatedCourse })
}

async function validateCourse(course: any): Promise<string[]> {
  const issues: string[] = []

  // Check required fields
  if (!course.title || course.title.length < 10) {
    issues.push('Title must be at least 10 characters')
  }

  if (!course.description || course.description.length < 50) {
    issues.push('Description must be at least 50 characters')
  }

  if (!course.thumbnail) {
    issues.push('Course thumbnail is required')
  }

  // Check content
  if (course.sections.length === 0) {
    issues.push('Course must have at least one section')
  }

  const totalLessons = course.sections.reduce(
    (sum, section) => sum + section.lessons.length,
    0
  )

  if (totalLessons === 0) {
    issues.push('Course must have at least one lesson')
  }

  // Check video content
  const videoLessons = course.sections.flatMap(s => s.lessons)
    .filter(l => l.content.type === 'video')

  if (videoLessons.length === 0) {
    issues.push('Course must have video content')
  }

  return issues
}
```

### Step 4: User Management Interface
```typescript
// app/(dashboard)/admin/users/page.tsx
export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: {
    page?: string
    role?: string
    status?: string
    search?: string
  }
}) {
  const page = parseInt(searchParams.page || '1')
  const take = 20
  const skip = (page - 1) * take

  const where = {
    ...(searchParams.role && { role: searchParams.role }),
    ...(searchParams.status && {
      status: searchParams.status === 'active' ? { not: 'BANNED' } : 'BANNED'
    }),
    ...(searchParams.search && {
      OR: [
        { name: { contains: searchParams.search, mode: 'insensitive' } },
        { email: { contains: searchParams.search, mode: 'insensitive' } }
      ]
    })
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      take,
      skip,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            courses: true,
            enrollments: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setShowBulkActions(!showBulkActions)}>
          Bulk Actions
        </Button>
      </div>

      {/* Filters */}
      <UserFilters />

      {/* User Table */}
      <UserTable users={users} />

      {/* Pagination */}
      <Pagination
        page={page}
        total={total}
        take={take}
        baseUrl="/admin/users"
      />
    </div>
  )
}
```

### Step 5: Order Management System
```typescript
// app/(dashboard)/admin/orders/page.tsx
export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: {
    status?: string
    dateFrom?: string
    dateTo?: string
    search?: string
  }
}) {
  const orders = await prisma.order.findMany({
    where: {
      ...(searchParams.status && { status: searchParams.status }),
      ...(searchParams.dateFrom && searchParams.dateTo && {
        createdAt: {
          gte: new Date(searchParams.dateFrom),
          lte: new Date(searchParams.dateTo)
        }
      }),
      ...(searchParams.search && {
        OR: [
          { transactionId: { contains: searchParams.search } },
          { user: { name: { contains: searchParams.search } } },
          { course: { title: { contains: searchParams.search } } }
        ]
      })
    },
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true, instructorId: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  return (
    <div className="space-y-6">
      <OrderFilters />
      <OrderStats />
      <OrderTable orders={orders} />
    </div>
  )
}
```

### Step 6: Analytics Dashboard
```typescript
// components/admin/analytics/revenue-chart.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value) => formatCurrency(value as number)}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      </LineChart>
    </div>
  )
}
```

### Step 7: Content Moderation
```typescript
// app/api/admin/content/reports/route.ts
export async function GET() {
  const reports = await prisma.report.findMany({
    where: { status: 'OPEN' },
    include: {
      reporter: { select: { name: true } },
      targetUser: { select: { name: true } },
      targetCourse: {
        select: { title: true, instructorId: true },
        include: {
          instructor: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(reports)
}

export async function POST(request: Request) {
  const { targetType, targetId, reason, description } = await request.json()
  const session = await getServerSession(authOptions)

  const report = await prisma.report.create({
    data: {
      reporterId: session!.user.id,
      targetType,
      targetId,
      reason,
      description
    }
  })

  // Notify admins
  await notifyAdmins({
    type: 'NEW_REPORT',
    reportId: report.id
  })

  return NextResponse.json(report)
}
```

### Step 8: System Settings Management
```typescript
// app/api/admin/settings/route.ts
export async function GET() {
  const settings = await prisma.setting.findMany({
    where: { category: 'PLATFORM' }
  })

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, any>)

  return NextResponse.json(settingsMap)
}

export async function PUT(request: Request) {
  const updates = await request.json()
  const session = await getServerSession(authOptions)

  // Update each setting
  for (const [key, value] of Object.entries(updates)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: {
        key,
        value: String(value),
        category: 'PLATFORM',
        updatedBy: session!.user.id
      }
    })
  }

  // Log changes
  await logAdminActivity({
    adminId: session!.user.id,
    action: 'UPDATE_SETTINGS',
    targetType: 'SETTINGS',
    details: updates
  })

  return NextResponse.json({ success: true })
}
```

### Step 9: Announcement System
```typescript
// app/api/admin/announcements/route.ts
export async function POST(request: Request) {
  const { title, content, type, targetAudience, scheduledAt } = await request.json()
  const session = await getServerSession(authOptions)

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      type,
      targetAudience,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      createdBy: session!.user.id
    }
  })

  // Send immediately if not scheduled
  if (!scheduledAt) {
    await sendAnnouncement(announcement)
  }

  return NextResponse.json(announcement)
}

async function sendAnnouncement(announcement: any) {
  // Get target users based on audience
  const users = await getTargetUsers(announcement.targetAudience)

  // Send notifications
  await Promise.all(
    users.map(user =>
      prisma.notification.create({
        data: {
          userId: user.id,
          type: 'ANNOUNCEMENT',
          title: announcement.title,
          content: announcement.content,
          data: { announcementId: announcement.id }
        }
      })
    )
  )
}
```

### Step 10: Audit Trail System
```typescript
// app/api/admin/audit-logs/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const targetType = searchParams.get('targetType')
  const adminId = searchParams.get('adminId')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const logs = await prisma.adminActivity.findMany({
    where: {
      ...(action && { action }),
      ...(targetType && { targetType }),
      ...(adminId && { adminId }),
      ...(dateFrom && dateTo && {
        createdAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      })
    },
    include: {
      admin: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  return NextResponse.json(logs)
}
```

## Todo List
- [ ] Set up admin permission system
- [ ] Build admin dashboard overview
- [ ] Implement course approval workflow
- [ ] Create user management interface
- [ ] Build order management system
- [ ] Implement analytics dashboard
- [ ] Add content moderation tools
- [ ] Create system settings management
- [ ] Build announcement system
- [ ] Implement audit trail logging
- [ ] Add bulk operations
- [ ] Create support ticket system
- [ ] Build notification center
- [ ] Add data export functionality
- [ ] Implement backup management
- [ ] Create admin activity monitoring

## Success Criteria
1. ✅ Course approval workflow operational
2. ✅ User management features complete
3. ✅ Order processing functional
4. ✅ Analytics providing insights
5. ✅ Content moderation effective
6. ✅ System settings configurable

## Risk Assessment

**Low Risk**:
- Basic CRUD operations
- Dashboard displays
- Permission checks

**Medium Risk**:
- Complex filtering and search
- Analytics performance
- Bulk operations

**High Risk**:
- **Admin Account Compromise**: Unauthorized access to platform control
- **Data Privacy Violations**: Mishandling user data and GDPR compliance
- **Privilege Escalation**: Admin role abuse and unauthorized actions
- **System Stability**: Bulk operations affecting platform performance
- **Data Manipulation**: Unauthorized modification of critical platform data
- **Audit Trail Bypass**: Admin actions without proper logging

**Mitigation**:
- Implement proper audit logging
- Use read replicas for analytics
- Add rate limiting
- Regular security audits
- Backup all admin actions

## Security Considerations
1. Strict permission validation
2. Admin action logging
3. IP whitelisting options
4. 2FA requirement for admins
5. Session timeout management
6. Input sanitization
7. SQL injection prevention
8. XSS protection

## Next Steps
1. Complete admin testing with different roles
2. Set up admin activity monitoring
3. Create admin documentation
4. Begin Phase 07: Security & Performance
5. Set up automated backups
6. Create admin training materials