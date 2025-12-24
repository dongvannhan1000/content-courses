# Phase 01: Foundation Setup

## Context Links
- [MVP Architecture Research](../research/researcher-01-mvp-architecture.md)
- [Cost-Effective Deployment Infrastructure](../research/researcher-251204-cost-effective-deployment-infrastructure.md)

## Overview
Establish the technical foundation for the e-learning platform MVP with focus on cost-effective setup, modular architecture, and development workflow optimization for solo developer efficiency.

## Key Insights
- NestJS 11.0+ backend + Next.js 15.1+ frontend separation provides better security and scalability
- Monorepo structure essential for managing frontend/backend packages
- Supabase PostgreSQL 16+ provides optimal database hosting ($25/month)
- TypeScript 5.7+ essential for maintaining code quality and security across stack
- Latest versions (React 19, Node.js 22+) provide critical security patches

## Requirements
1. Development environment with hot reload and debugging for both frontend and backend
2. Monorepo structure optimized for solo development with NestJS + Next.js separation
3. PostgreSQL 16+ database schema supporting all MVP features with Prisma 6.0+
4. CI/CD pipeline for automated testing and deployment with security scanning
5. Development documentation and coding standards with latest security practices
6. Automated dependency monitoring and vulnerability scanning setup

## Architecture

### Project Structure (Monorepo with Latest Versions)
```
e-learning/
├── apps/
│   ├── web/               # Next.js 15.1+ frontend (React 19, TypeScript 5.7+)
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   └── public/        # Static assets
│   └── api/               # NestJS 11.0+ backend (TypeScript 5.7+, Node.js 22+)
│       ├── src/
│       │   ├── modules/   # NestJS modules (auth, courses, payments)
│       │   ├── common/    # Shared utilities
│       │   └── main.ts    # Application entry
├── packages/
│   ├── db/                # Prisma 6.0+ schema and migrations
│   ├── types/             # Shared TypeScript types
│   └── ui/                # Shared React components
├── .github/
│   └── workflows/         # CI/CD with security scanning
└── docs/                  # Development documentation
```

### Technology Stack (Latest Versions)
**Frontend**: Next.js 15.1+, React 19, TypeScript 5.7+, Tailwind CSS 4.0+
**Backend**: NestJS 11.0+, Node.js 22+, TypeScript 5.7+, Prisma 6.0+
**Database**: PostgreSQL 16+ (Supabase hosting)
**Security**: Dependabot, CSP headers, HSTS, automated vulnerability scanning

### Core Dependencies
**Frontend**: Next.js 15.1+, React 19, TypeScript 5.7+, Tailwind CSS 4.0+
**Backend**: NestJS 11.0+, Node.js 22+, TypeScript 5.7+, Prisma 6.0+
**Security**: ESLint + Prettier, Husky pre-commit hooks, automated security scanning

## Related Code Files
- `package.json` (root) - Workspace dependencies and scripts
- `apps/web/package.json` - Frontend dependencies
- `apps/api/package.json` - Backend dependencies
- `packages/db/prisma/schema.prisma` - PostgreSQL 16+ database schema
- `.github/workflows/` - CI/CD with security scanning
- `.env.example` - Environment variables template
- `README.md` - Development documentation

## Implementation Steps

### Step 1: Initialize Monorepo Structure
```bash
# Create root monorepo
mkdir e-learning && cd e-learning
npm init -y

# Setup workspace configuration
echo '{"workspaces": ["apps/*", "packages/*"]}' > package.json

# Create frontend
npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Create backend
npx @nestjs/cli new apps/api --package-manager npm

# Create shared packages
mkdir -p packages/{db,types,ui}
```

### Step 2: Configure Latest Dependencies
- Set up ESLint with TypeScript rules
- Configure Prettier with consistent formatting
- Add Husky for pre-commit hooks
- Set up VSCode workspace settings
- Configure debugging with launch.json

### Step 3: Database Setup with Supabase
1. Create Supabase project
2. Install Prisma and Supabase client
3. Initialize Prisma schema
4. Set up database connection
5. Configure environment variables

### Step 4: Core Dependencies Installation
```bash
# Auth & Session Management
npm install next-auth @auth/prisma-adapter

# Database & ORM
npm install prisma @prisma/client

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# UI Components
npm install @headlessui/react @heroicons/react

# File Upload
npm install @uploadthing/react

# Date Handling
npm install date-fns

# HTTP Client
npm install axios
```

### Step 5: Database Schema Design
Create comprehensive schema supporting:
- User management (roles: student, instructor, admin)
- Course structure (lessons, sections, resources)
- Enrollment and progress tracking
- Payment and orders
- Categories and tags

### Step 6: Environment Configuration
Set up environment variables for:
- Database connection
- NextAuth secret
- OAuth providers (Google)
- File storage (Cloudinary)
- Payment (PayOS)
- External APIs

### Step 7: Basic Routing Structure
Create route groups:
- `(auth)` - Login, register, password reset
- `(dashboard)` - Student/instructor dashboard
- `courses/[id]` - Course details and learning
- `admin` - Admin panel

### Step 8: CI/CD Pipeline
1. Set up GitHub repository
2. Configure Vercel for hosting
3. Set up automatic deployments
4. Add environment variables to Vercel
5. Configure preview deployments

### Step 9: Development Workflow
1. Create conventional commit guidelines
2. Set up issue templates
3. Configure project boards
4. Document coding standards
5. Create development guidelines

### Step 10: Initial Testing Setup
- Configure Jest for unit testing
- Set up Cypress for E2E testing
- Create test utilities
- Write initial smoke tests

## Todo List
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Supabase database and Prisma ORM
- [ ] Design and implement database schema
- [ ] Configure Tailwind CSS with custom theme
- [ ] Set up ESLint and Prettier configurations
- [ ] Create base component library structure
- [ ] Implement NextAuth.js configuration
- [ ] Set up Cloudinary for file storage
- [ ] Configure Vercel deployment
- [ ] Create development documentation
- [ ] Set up testing framework (Jest + Cypress)
- [ ] Implement error boundaries and 404 pages
- [ ] Create loading and skeleton states
- [ ] Set up analytics and monitoring (Sentry)
- [ ] Write initial API documentation

## Success Criteria
1. ✅ Development environment running locally
2. ✅ Database connected with migrations applied
3. ✅ Basic routing structure functional
4. ✅ CI/CD pipeline deploying to Vercel
5. ✅ Code quality tools enforced
6. ✅ Documentation complete and accessible

## Risk Assessment

**Low Risk**:
- Next.js 15.1+ setup (well-documented with latest features)
- Tailwind CSS 4.0+ configuration (modern CSS features)
- TypeScript 5.7+ setup (enhanced type safety)

**Medium Risk**:
- Monorepo complexity with NestJS + Next.js integration
- PostgreSQL 16+ database schema evolution during development
- Environment variable management across multiple services
- Prisma 6.0+ migration management

**High Risk**:
- **Version Compatibility Issues**: React 19 + Next.js 15.1+ ecosystem compatibility
- **Security Vulnerabilities**: Latest versions may have undiscovered vulnerabilities
- **Scope Creep**: Over-engineering monorepo structure for MVP needs
- **Developer Workflow Complexity**: Managing frontend/backend separation as solo developer

**Mitigation Strategies**:
1. **Version Compatibility**:
   - Use official compatibility matrix for React 19 + Next.js 15.1+
   - Implement automated testing for dependency updates
   - Create canary deployments for major version upgrades

2. **Security Protection**:
   - Configure Dependabot for automated vulnerability scanning
   - Implement pre-commit hooks for security checks
   - Regular security audits with npm audit fix

3. **Complexity Management**:
   - Start with minimal monorepo, add complexity incrementally
   - Use standardized scripts for common operations
   - Document all development workflows thoroughly

4. **Scope Control**:
   - Weekly MVP requirement reviews
   - Feature freeze for foundation phase
   - Progressive enhancement approach

## Security Considerations (Latest Version Security)
1. **Environment Security**: Environment variables properly encrypted with .env files
2. **Database Security**: PostgreSQL 16+ connection strings with SSL/TLS encryption
3. **API Security**: @nestjs/throttler rate limiting configuration for development
4. **CORS Configuration**: Strict CORS settings for frontend/backend communication
5. **Secret Management**: AWS Secrets Manager or equivalent for production secrets
6. **Input Validation**: class-validator DTOs setup for all API endpoints
7. **Error Handling**: Secure error responses without information leakage
8. **Dependency Security**: Dependabot configuration for automated vulnerability scanning
9. **Development Security**: Development-only configurations with environment guards
10. **Version Security**: Locked dependency versions with automated security updates
11. **Infrastructure Security**: Vercel/Railway security headers and SSL enforcement
12. **Code Security**: Pre-commit hooks for security linting and vulnerability checks

## Next Steps
1. Complete Phase 01 setup
2. Review and validate foundation
3. Begin Phase 02: Authentication System
4. Set up regular development schedule
5. Establish progress tracking metrics