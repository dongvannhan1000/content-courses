# MVP E-Learning Platform Architecture Research

## Technology Stack Recommendations

### Backend (NestJS)
- **Framework**: NestJS 11.0+ with TypeScript 5.7+ (full Node.js 22+ API)
- **Database**: PostgreSQL 16+ + Prisma ORM 6.0+ (robust, scalable)
- **Authentication**: NestJS + Passport.js (Google OAuth, JWT tokens with latest security, password reset)
- **File Storage**: AWS S3/Cloudinary (media, PDFs)
- **Video Streaming**: Bunny Stream API ($0.007/GB, 86% cost savings)
- **Payments**: PayOS integration (VietQR, cards)
- **Security**: Latest dependency updates, security headers, vulnerability scanning

### Frontend (Next.js/React)
- **Framework**: Next.js 15.1+ with App Router, React 19, TypeScript 5.7+
- **UI Library**: React 19 + Tailwind CSS 4.0+
- **State Management**: Zustand 5.0+ (lightweight, simple)
- **Forms**: React Hook Form + Zod validation (latest versions)
- **Styling**: Tailwind CSS 4.0+ + Headless UI 2.0+
- **API Client**: Axios/React Query for NestJS API communication
- **Security**: Latest React 19 security patches, content security policy

## Core Architecture Patterns

### Monorepo Structure
```
/
├── apps/
│   ├── web (Next.js frontend - student/instructor/admin)
│   └── api (NestJS backend - REST APIs)
├── packages/
│   ├── db (Prisma schemas - shared)
│   ├── auth (NestJS auth module)
│   ├── payments (PayOS integration module)
│   └── ui (shared React components)
```

### Database Schema (Simplified)
```typescript
// Users
- id, email, role (student/instructor/admin), profile

// Courses
- id, title, description, price, status (draft/published/approved)
- instructorId, categoryId, thumbnail

// Lessons
- id, title, content (video/PDF), duration, order

// Enrollments
- userId, courseId, progress, completedAt

// Orders
- id, userId, courseId, amount, status, paymentMethod
```

### API Design (NestJS)
- **RESTful APIs** with NestJS controllers and modules
- **Authentication**: JWT tokens + Passport.js strategies
- **File uploads**: Signed URLs for direct S3 upload
- **Video access**: Temporary signed tokens (1hr expiry)
- **CORS**: Configured for Next.js frontend domain
- **Validation**: DTOs with class-validator
- **Error handling**: Global exception filters

## Implementation Considerations

### Cost Optimization
- NestJS backend: Use Railway/DigitalOcean for cost-effective hosting
- Next.js frontend: Vercel Edge Runtime for performance
- Implement CDN for static assets (Cloudflare)
- Database connection pooling with Prisma
- Efficient video transcoding (Bunny Stream auto)

### Security (NestJS)
- Video streaming with signed tokens
- Rate limiting with @nestjs/throttler (latest version)
- Input validation with class-validator DTOs (latest version)
- CORS strict configuration for frontend domain
- Helmet.js security headers middleware (latest security headers)
- JWT token management with Passport.js (latest security practices)
- Guards for route protection by role
- Regular dependency updates with npm audit
- Content Security Policy (CSP) headers
- HTTP Strict Transport Security (HSTS)
- XSS and CSRF protection with latest mitigation techniques

### Performance Targets
- <2.5s load time (Lighthouse >90)
- Mobile-first responsive design
- Lazy loading for videos/media
- Image optimization (next/image)
- Caching strategies (CDN + Redis)
- NestJS: Response caching with @nestjs/cache-manager
- Database: Prisma query optimization
- API: Efficient pagination and filtering

### Payment Integration (NestJS)
- PayOS webhook controller for automated course unlock
- QR code generation service for VietQR payments
- Payment status synchronization with database
- Refund handling service logic
- Transaction logging and audit trails

### Scalability Features
- Database read replicas for scaling
- Video streaming CDN (Bunny Stream/Cloudflare)
- Horizontal scaling for NestJS (load balancer + multiple instances)
- Next.js: Edge runtime and serverless functions
- Monitoring (Sentry + custom NestJS logging)
- Health checks and metrics endpoints

## Deployment & Operations
- **Frontend**: Vercel (Next.js, edge functions)
- **Backend**: Railway/DigitalOcean (NestJS, Docker containers)
- **Database**: Supabase PostgreSQL (managed)
- **Storage**: Cloudinary/S3
- **Video**: Bunny Stream API
- **Monitoring**: Sentry + custom NestJS logging + Vercel Analytics

## Critical Success Factors
1. Minimal viable feature set
2. Focus on core user journeys
3. Payment reliability
4. Video streaming performance
5. Mobile experience quality