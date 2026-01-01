# 🎨 Frontend Status

> **Framework:** Next.js 16.0.7  
> **React:** 19.2.1  
> **Styling:** Tailwind CSS 3.4.15  
> **Port:** 3000

---

## 📱 Pages Overview

| Route | Page | Status | Description |
|-------|------|--------|-------------|
| `/` | Home | ✅ Complete | Landing page, featured courses |
| `/courses` | Course List | ✅ Complete | Search, filter, pagination |
| `/courses/[slug]` | Course Detail | ✅ Complete | Course info, lessons preview, enroll |
| `/cart` | Shopping Cart | ✅ Complete | Cart management, checkout |
| `/payment/success` | Payment Success | ✅ Complete | Payment confirmation |
| `/learn/[courseId]` | Learn Page | ✅ Complete | Video player, lesson list, progress |
| `/dashboard` | Student Dashboard | ✅ Complete | My courses, progress overview |
| `/dashboard/instructor` | Instructor Dashboard | ✅ Complete | Course management |

---

## 🧩 Components Structure

```
components/
├── auth/
│   ├── AuthModal.tsx         # Login/Register modal
│   ├── LoginForm.tsx         # Login form
│   └── RegisterForm.tsx      # Register form
│
├── features/
│   ├── CartDrawer.tsx        # Cart slide-out drawer
│   ├── LessonPlayer.tsx      # Video/content player
│   ├── ProgressTracker.tsx   # Learning progress
│   └── CourseFilters.tsx     # Search filters
│
├── providers/
│   ├── AuthProvider.tsx      # Firebase auth context
│   ├── QueryProvider.tsx     # TanStack Query provider
│   ├── ToastProvider.tsx     # Toast notifications
│   └── ThemeProvider.tsx     # Theme management
│
├── shared/
│   ├── LoadingSpinner.tsx    # Loading states
│   ├── ErrorBoundary.tsx     # Error handling
│   ├── EmptyState.tsx        # Empty content
│   └── Skeleton.tsx          # Loading skeleton
│
├── ui/
│   ├── Button.tsx            # Button variants
│   ├── Card.tsx              # Card component
│   ├── Input.tsx             # Form input
│   ├── Modal.tsx             # Modal dialog
│   ├── Badge.tsx             # Status badges
│   ├── Avatar.tsx            # User avatar
│   ├── Dropdown.tsx          # Dropdown menu
│   └── ...                   # 9 more UI components
│
├── CourseCard.tsx            # Course card display
├── FilterSidebar.tsx         # Filter panel
├── Footer.tsx                # Site footer
├── Header.tsx                # Navigation header
├── Hero.tsx                  # Hero section
├── SkipLink.tsx              # Accessibility skip link
└── StudentExperience.tsx     # Testimonials section
```

---

## 📊 State Management

### Zustand Stores

| Store | Location | Purpose |
|-------|----------|---------|
| `cartStore` | `lib/store/cartStore.ts` | Shopping cart state |
| `authStore` | `lib/store/authStore.ts` | Auth state (deprecated, using provider) |

### TanStack Query

| Query Key | Usage |
|-----------|-------|
| `['courses']` | Course listing |
| `['course', slug]` | Single course |
| `['categories']` | Category list |
| `['enrollments']` | User enrollments |
| `['cart']` | Cart items |
| `['progress', lessonId]` | Lesson progress |

---

## 🔌 API Integration

### API Client

**Location:** `lib/api/`

```
lib/api/
├── index.ts           # Axios instance config
├── authApi.ts         # Auth endpoints
├── coursesApi.ts      # Courses endpoints
├── categoriesApi.ts   # Categories endpoints
├── enrollmentsApi.ts  # Enrollments endpoints
├── paymentsApi.ts     # Payments endpoints
├── cartApi.ts         # Cart endpoints
├── progressApi.ts     # Progress endpoints
└── lessonsApi.ts      # Lessons endpoints
```

### Axios Configuration

- Base URL: `http://localhost:3001/api`
- Automatic Firebase token injection
- Response error handling
- Request/response interceptors

---

## 🔐 Authentication

### Firebase Integration

| Feature | Status |
|---------|--------|
| Email/Password login | ✅ |
| Google OAuth | ✅ |
| Token refresh | ✅ |
| Persistent session | ✅ |

### AuthProvider Features

- Auto-fetch user on mount
- Token injection for API calls
- Cart sync on login/logout
- Protected route handling

---

## 🎭 UI/UX Features

### Design Features

| Feature | Implementation |
|---------|----------------|
| **Glassmorphism** | `backdrop-blur-lg bg-white/80` |
| **Gradients** | Tailwind gradient utilities |
| **Shadows** | Custom shadow-lg variants |
| **Hover effects** | `group-hover`, `transition-all` |
| **Animations** | CSS keyframes + Tailwind animate |

### Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large screens |

### Accessibility

- ✅ Skip link for keyboard navigation
- ✅ ARIA labels on interactive elements
- ✅ Focus visible states
- ✅ prefers-reduced-motion support
- ✅ Semantic HTML structure
- ✅ Alt text for images

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Server state management |
| `zustand` | Client state management |
| `axios` | HTTP client |
| `firebase` | Authentication |
| `lucide-react` | Icon library |

---

## 🚀 Build & Deploy

### Development

```bash
npm run dev:frontend
# or
cd apps/frontend && npm run dev
```

### Production Build

```bash
npm run build:frontend
```

### Output

- Static export compatible
- Image optimization enabled
- Automatic code splitting
