# Phase 02: Authentication System

## Context Links
- [MVP Architecture Research](../research/researcher-01-mvp-architecture.md)
- [Foundation Setup](phase-01-foundation-setup.md)

## Overview
Implement comprehensive authentication system supporting multiple user roles (student, instructor, admin), OAuth integration, and secure session management optimized for Vietnamese market requirements.

## Key Insights
- NestJS + Passport.js provides enterprise-grade auth with latest security patches
- Role-based access control essential for platform functionality
- Google OAuth critical for user onboarding (reduces friction)
- JWT tokens with latest security practices for secure session management
- Password reset functionality required for user retention
- Latest dependency versions ensure protection against authentication vulnerabilities

## Requirements
1. User registration with email verification
2. Social login (Google OAuth)
3. Role-based authentication (student/instructor/admin)
4. Password reset functionality
5. Session management with secure tokens
6. Login attempt tracking for security
7. Profile management interface

## Architecture

### Authentication Flow (NestJS + Passport.js)
1. **Registration**: Email/password → Email verification → Role assignment → JWT token generation
2. **Login**: Credentials/OAuth → Passport.js validation → JWT token creation → Secure storage
3. **Authorization**: NestJS Guards → Role validation → Route protection
4. **Session**: JWT tokens with latest security → Secure storage → Auto-refresh mechanism
5. **Security**: Rate limiting, login attempt tracking, account lockout protection

### User Role Structure
```typescript
enum UserRole {
  STUDENT = 'STUDENT',      // Can view/enroll in courses
  INSTRUCTOR = 'INSTRUCTOR', // Can create/manage courses
  ADMIN = 'ADMIN'           // Full platform access
}
```

### Security Measures (NestJS + Latest Security)
- bcrypt (minimum 12 rounds) with Node.js 22+ security features
- @nestjs/throttler for advanced rate limiting on auth endpoints
- Passport.js with latest OAuth security practices
- JWT tokens with secure rotation and refresh mechanisms
- @nestjs/csrf for CSRF protection
- Secure HttpOnly, SameSite cookie configurations
- Account lockout after failed attempts
- Login attempt logging with audit trails
- Email verification with secure token generation
- Password reset with secure expiration tokens

## Related Code Files
- `apps/api/src/modules/auth/` - NestJS authentication module
- `apps/api/src/modules/auth/auth.controller.ts` - Auth endpoints controller
- `apps/api/src/modules/auth/auth.service.ts` - Authentication business logic
- `apps/api/src/modules/auth/strategies/` - Passport.js strategies (Google, JWT)
- `apps/api/src/modules/auth/guards/` - NestJS guards for route protection
- `apps/api/src/modules/auth/dto/` - Authentication DTOs with validation
- `apps/api/src/common/guards/` - Common security guards
- `apps/web/src/components/auth/` - React 19 authentication components
- `packages/db/prisma/schema.prisma` - User and session schemas
- `apps/web/src/app/(auth)/login/page.tsx` - Login page
- `apps/web/src/app/(auth)/register/page.tsx` - Registration page
- `apps/web/src/app/(auth)/reset-password/page.tsx` - Password reset
- `apps/web/src/middleware.ts` - Route protection middleware
- `apps/web/src/lib/auth.ts` - Auth utilities for frontend

## Implementation Steps

### Step 1: Configure NextAuth.js
```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Custom authentication logic
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      // Add role to token
      if (user) token.role = user.role
      return token
    },
    session: async ({ session, token }) => {
      // Add role to session
      if (token) session.user.role = token.role
      return session
    }
  }
}

export default NextAuth(authOptions)
```

### Step 2: Update User Model in Prisma Schema
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?
  role          Role      @default(STUDENT)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  courses       Course[]
  enrollments   Enrollment[]
  orders        Order[]

  @@map('users')
}

enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
}
```

### Step 3: Implement Registration Page
- Email/password form with validation
- Terms of service agreement
- Email verification workflow
- Role selection (student/instructor)
- Success state with email sent message

### Step 4: Implement Login Page
- Email/password and OAuth options
- Remember me functionality
- Forgot password link
- Error handling for invalid credentials
- Redirect based on user role

### Step 5: Password Reset Flow
1. Request reset with email
2. Generate secure token
3. Send email with reset link
4. Verify token and update password
5. Invalidate existing sessions

### Step 6: Create Auth Middleware
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/courses/create',
    '/admin/:path*',
    '/api/courses/:path*'
  ]
}
```

### Step 7: Protected Routes Implementation
- Route groups with layout protection
- Role-based component access
- API endpoint protection
- Automatic redirect handling

### Step 8: Profile Management
- Profile view/edit page
- Avatar upload functionality
- Password change form
- Email update with verification
- Account deletion option

### Step 9: Session Management
- Session expiration handling
- Automatic token refresh
- Multiple session detection
- Logout all devices option
- Session analytics tracking

### Step 10: Security Enhancements
- Rate limiting on auth attempts
- IP-based detection
- Brute force protection
- Login attempt logging
- Suspicious activity alerts

## Todo List
- [ ] Configure NextAuth.js with Google OAuth
- [ ] Update Prisma schema with user roles
- [ ] Create registration form with validation
- [ ] Implement login page with OAuth
- [ ] Build password reset flow
- [ ] Set up email verification system
- [ ] Create auth middleware for route protection
- [ ] Implement role-based access control
- [ ] Build user profile management
- [ ] Add session management features
- [ ] Implement rate limiting
- [ ] Create login attempt tracking
- [ ] Set up email templates (welcome, reset)
- [ ] Add two-factor authentication (future)
- [ ] Create admin user management interface
- [ ] Implement social profile linking
- [ ] Add account security settings

## Success Criteria
1. ✅ Users can register with email/password
2. ✅ Google OAuth integration working
3. ✅ Password reset flow functional
4. ✅ Role-based access control enforced
5. ✅ Session management secure and reliable
6. ✅ All auth endpoints rate limited

## Risk Assessment

**Low Risk**:
- NestJS authentication patterns (well-established framework)
- Passport.js Google OAuth (official implementation)
- Email/password authentication with bcrypt hashing

**Medium Risk**:
- Email delivery reliability for verification/reset tokens
- OAuth configuration and Google API setup complexity
- JWT token management and refresh mechanisms
- Multi-service session coordination (frontend + backend)

**High Risk**:
- **Authentication Vulnerabilities**: Custom NestJS auth logic security flaws
- **Session Hijacking**: JWT token theft or manipulation
- **OAuth Security**: Improper state parameter or PKCE implementation
- **Rate Limiting Bypass**: Authentication endpoint abuse and brute force attacks
- **Password Security**: Weak password policies or improper hashing implementation
- **Authorization Bypass**: NestJS guards failure or role escalation vulnerabilities

**Mitigation Strategies**:
1. **Authentication Security**:
   - Follow official NestJS authentication patterns exactly
   - Implement comprehensive security testing for auth endpoints
   - Regular security audits with automated vulnerability scanning
   - Use Passport.js official strategies, avoid custom OAuth implementations

2. **Session Protection**:
   - Implement JWT token rotation with secure refresh mechanisms
   - Use HttpOnly, Secure cookies with SameSite=Strict
   - Add device fingerprinting for anomaly detection
   - Implement short access token expiration (15 minutes)

3. **OAuth Security**:
   - Implement PKCE (Proof Key for Code Exchange) for Google OAuth
   - Use secure state parameter with CSRF protection
   - Validate redirect URIs strictly
   - Regularly review OAuth security best practices

4. **Rate Limiting & Abuse Prevention**:
   - Advanced @nestjs/throttler with IP-based and user-based limits
   - Account lockout after failed attempts (5 strikes, 15-minute lockout)
   - Login attempt monitoring with anomaly detection
   - CAPTCHA implementation for suspicious activity

5. **Password Security**:
   - Enforce strong password policies (12+ chars, mixed types)
   - bcrypt with minimum 12 rounds using Node.js 22+ features
   - Password breach checking with HaveIBeenPwned API
   - Regular password expiration requirements

6. **Authorization Security**:
   - Implement defense-in-depth with multiple guard layers
   - Role-based access control with principle of least privilege
   - Regular audit of guard implementations
   - Automated testing for authorization bypass attempts

## Security Considerations (Latest Security Standards)
1. **Password Security**: bcrypt hashing (minimum 12 rounds) with latest Node.js 22+ security features
2. **JWT Token Management**: Short-lived access tokens (15 min), refresh tokens (7 days) with secure rotation
3. **Session Security**: HttpOnly, Secure, SameSite cookies with SameSite=Lax
4. **CSRF Protection**: CSRF tokens with @nestjs/csrf middleware
5. **Rate Limiting**: @nestjs/throttler with latest security configurations
6. **Input Validation**: class-validator DTOs with comprehensive sanitization
7. **Database Security**: Prisma 6.0+ with SQL injection prevention
8. **Content Security Policy**: CSP headers with XSS protection
9. **OAuth Security**: Passport.js Google OAuth with PKCE and state parameters
10. **Dependency Security**: Automated vulnerability scanning with Dependabot
11. **API Security**: Helmet.js with latest security headers (HSTS, X-Frame-Options, etc.)

## Next Steps
1. Complete authentication testing
2. Implement social profile linking
3. Set up production email service
4. Begin Phase 03: Course Management Backend
5. Document auth API endpoints
6. Create auth troubleshooting guide