# 📋 TODO & Next Steps

> **Last Updated:** 2026-01-01

---

## ✅ Đã hoàn thành

### Backend

- [x] 10 modules API hoàn chỉnh
- [x] Firebase Authentication
- [x] PayOS Payment Integration
- [x] 313 automated tests
- [x] CI/CD GitHub Actions
- [x] Performance testing setup
- [x] Swagger API documentation

### Frontend

- [x] Landing page với Hero section
- [x] Course listing với search & filter
- [x] Course detail page
- [x] Shopping cart (server-synced)
- [x] Payment flow (PayOS)
- [x] Learn page với video player
- [x] Progress tracking
- [x] Student dashboard
- [x] Instructor dashboard
- [x] Admin course approval
- [x] **Firebase Storage upload** - Thumbnail upload for courses
- [x] **Slug auto-generation** - Backend generates SEO-friendly slugs

---

## 🔄 Có thể cải thiện (Nice to have)

### Performance & Optimization

- [ ] **Image optimization** - Implement Next.js Image component for all images
- [ ] **Lazy loading** - Lazy load components below the fold
- [ ] **Caching strategy** - Redis caching for frequently accessed data
- [ ] **CDN setup** - Use CDN for static assets and media files

### Features

- [ ] **Reviews & Ratings** - Allow students to review courses
- [ ] **Notifications** - Email/push notifications for enrollment, completion
- [ ] **Certificates** - Generate completion certificates
- [ ] **Wishlist** - Save courses for later
- [ ] **Coupon system** - Discount codes and promotions
- [ ] **Multi-language** - i18n support (Vietnamese, English)

### Instructor Features

- [ ] **Analytics dashboard** - Course performance metrics
- [ ] **Revenue reports** - Earning statistics
- [ ] **Student management** - View enrolled students
- [ ] **Course builder** - Drag-and-drop lesson creation

### Admin Features

- [ ] **Full admin panel** - Comprehensive management UI
- [ ] **User management** - Ban/unban, role management
- [ ] **Content moderation** - Review queue for courses
- [ ] **Platform analytics** - Overall statistics

### Technical Debt

- [ ] **Frontend testing** - Add Jest/Vitest tests for components
- [ ] **E2E frontend tests** - Playwright/Cypress tests
- [ ] **Error tracking** - Sentry integration
- [ ] **Logging service** - Centralized logging (ELK/Datadog)
- [ ] **Database backup** - Automated backup strategy

---

## 🚀 Deployment Checklist

### Before Production

- [ ] **Environment variables** - Secure all secrets
- [ ] **SSL/TLS** - HTTPS for all endpoints
- [ ] **Database** - Production PostgreSQL instance
- [ ] **Monitoring** - Health checks, uptime monitoring
- [ ] **Rate limiting** - Review and adjust limits
- [ ] **CORS** - Update allowed origins

### Recommended Stack

| Service | Recommendation |
|---------|----------------|
| **Frontend** | Vercel |
| **Backend** | Railway / Render / AWS |
| **Database** | Neon / Supabase / AWS RDS |
| **CDN** | Cloudflare |
| **Storage** | Firebase Storage ✅ |
| **Email** | SendGrid / Resend |
| **Monitoring** | Sentry + Uptime Robot |

---

## 📝 Documentation Needed

- [ ] **API documentation** - Detailed endpoint docs
- [ ] **Deployment guide** - Step-by-step deployment
- [ ] **Contributing guide** - For open source contributors
- [ ] **Architecture decision records** - ADRs for major decisions

---

## 🎯 Priority Matrix

### High Priority (Do First)

| Task | Effort | Impact |
|------|--------|--------|
| SSL/HTTPS setup | Low | High |
| Production deployment | Medium | High |
| Error tracking (Sentry) | Low | High |

### Medium Priority

| Task | Effort | Impact |
|------|--------|--------|
| Image optimization | Medium | Medium |
| Caching (Redis) | Medium | Medium |
| Email notifications | Medium | Medium |

### Low Priority (Nice to have)

| Task | Effort | Impact |
|------|--------|--------|
| Multi-language | High | Medium |
| Certificates | Medium | Low |
| Advanced analytics | High | Medium |

---

## 💡 Ideas for Future

- Mobile app (React Native)
- Live sessions / Webinars
- Quiz & Assignments
- Discussion forums
- Affiliate program
- Corporate/Team plans
