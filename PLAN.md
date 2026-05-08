# 📋 Norton E-Library — Project Plan

> **Version:** 1.2  
> **Created:** April 1, 2026  
> **Last Updated:** May 8, 2026  
> **Based on:** [PRD.md](PRD.md) v1.4  
> **Project:** Norton E-Library  
> **Team Lead:** Chan Samnang

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Phases Overview](#2-project-phases-overview)
3. [Phase 1 — Foundation & Core Backend](#phase-1--foundation--core-backend)
4. [Phase 2 — Admin Dashboard MVP](#phase-2--admin-dashboard-mvp)
5. [Phase 3 — Student Frontend MVP](#phase-3--student-frontend-mvp)
6. [Phase 4 — AI Features & Advanced Functionality](#phase-4--ai-features--advanced-functionality)
7. [Phase 5 — Testing, QA & Performance](#phase-5--testing-qa--performance)
8. [Phase 6 — Deployment & Launch](#phase-6--deployment--launch)
9. [Phase 7 — Post-Launch & Iteration](#phase-7--post-launch--iteration)
10. [Sprint Breakdown](#10-sprint-breakdown)
11. [Milestone Timeline](#11-milestone-timeline)
12. [Task Assignment Matrix](#12-task-assignment-matrix)
13. [Risk Management](#13-risk-management)
14. [Dependencies & Blockers](#14-dependencies--blockers)
15. [Quality Assurance Strategy](#15-quality-assurance-strategy)
16. [Definition of Done](#16-definition-of-done)
17. [Communication Plan](#17-communication-plan)

---

## 1. Executive Summary

This plan outlines the full development lifecycle for **Norton E-Library**, a three-application digital library platform serving Norton University, Phnom Penh, Cambodia. The project spans **7 phases** across approximately **16 weeks (4 months)**, covering backend API, admin dashboard, student frontend, AI-powered features, testing, deployment, and post-launch optimization.

**Key Deliverables:**

| # | Deliverable | Platform | Stack |
|---|---|---|---|
| 1 | RESTful Backend API | Render | Node.js + Express + PostgreSQL |
| 2 | Admin Dashboard | Vercel | Next.js 16 + shadcn/ui + Tailwind CSS |
| 3 | Student Frontend | Vercel | Next.js 16 + shadcn/ui + Tailwind CSS |
| 4 | AI Recommendation Engine | Render (within API) | Google Gemini 2.0 Flash |
| 5 | Vector Search Service | External | Image-based book cover search |

---

## 2. Project Phases Overview

```
Phase 1 ██████░░░░░░░░░░ Foundation & Core Backend       (Week 1–4)
Phase 2 ░░░░██████░░░░░░ Admin Dashboard MVP              (Week 3–6)
Phase 3 ░░░░░░████████░░ Student Frontend MVP              (Week 5–9)
Phase 4 ░░░░░░░░░░████░░ AI Features & Advanced            (Week 8–11)
Phase 5 ░░░░░░░░░░░░████ Testing, QA & Performance         (Week 10–13)
Phase 6 ░░░░░░░░░░░░░░██ Deployment & Launch               (Week 13–14)
Phase 7 ░░░░░░░░░░░░░░░█ Post-Launch & Iteration           (Week 15–16+)
```

> **Note:** Phases overlap intentionally. Backend work unblocks frontend teams early; AI features begin once core CRUD is stable.

---

## Phase 1 — Foundation & Core Backend

**Duration:** Week 1–4  
**Owner:** Chan Samnang (Lead), Hoeung Phearun  
**Goal:** Fully functional backend API with database, authentication, RBAC, and core CRUD endpoints.

### 1.1 Environment Setup (Week 1)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 1.1.1 | Initialize Node.js + Express project structure | Samnang | 🔴 Critical | 0.5d |
| 1.1.2 | Configure PostgreSQL on Render + Sequelize ORM | Samnang | 🔴 Critical | 1d |
| 1.1.3 | Set up Cloudflare R2 bucket + AWS S3 SDK config | Phearun | 🔴 Critical | 1d |
| 1.1.4 | Configure environment variables (.env structure) | Samnang | 🔴 Critical | 0.5d |
| 1.1.5 | Set up ESLint, Prettier, project conventions | Phearun | 🟡 Medium | 0.5d |
| 1.1.6 | Implement global error handling middleware | Samnang | 🔴 Critical | 0.5d |
| 1.1.7 | Implement standardized API response formatter | Samnang | 🔴 Critical | 0.5d |
| 1.1.8 | Set up Morgan logging + custom logger utility | Phearun | 🟡 Medium | 0.5d |

### 1.2 Database Models (Week 1–2)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 1.2.1 | Define User model (with bcrypt hooks, soft delete) | Samnang | 🔴 Critical | 1d |
| 1.2.2 | Define Role + Permission models | Samnang | 🔴 Critical | 0.5d |
| 1.2.3 | Define junction tables (UsersRoles, RolesPermissions, UsersPermissions) | Samnang | 🔴 Critical | 0.5d |
| 1.2.4 | Define Book model (all fields, soft delete, associations) | Phearun | 🔴 Critical | 1d |
| 1.2.5 | Define Author, Editor, Publisher, Category, Department, MaterialType models | Phearun | 🔴 Critical | 1d |
| 1.2.6 | Define junction tables (BookAuthor, BookEditor, PublishersBooks) | Phearun | 🟠 High | 0.5d |
| 1.2.7 | Define Download + Activity models | Samnang | 🟠 High | 0.5d |
| 1.2.8 | Define Settings model (key-value store) | Phearun | 🟡 Medium | 0.5d |
| 1.2.9 | Create seed script for default roles + permissions | Samnang | 🔴 Critical | 0.5d |
| 1.2.10 | Sequelize associations & model index file | Samnang | 🔴 Critical | 0.5d |

### 1.3 Authentication System (Week 2)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 1.3.1 | Implement JWT access token + refresh token logic | Samnang | 🔴 Critical | 1d |
| 1.3.2 | Build register endpoint (auto-assign `user` role) | Samnang | 🔴 Critical | 0.5d |
| 1.3.3 | Build login endpoint (email / username / studentId) | Samnang | 🔴 Critical | 0.5d |
| 1.3.4 | Build token refresh endpoint | Samnang | 🔴 Critical | 0.5d |
| 1.3.5 | Build profile endpoints (GET, PATCH) | Phearun | 🟠 High | 0.5d |
| 1.3.6 | Build change-password endpoint | Phearun | 🟠 High | 0.5d |
| 1.3.7 | Build forgot-password → OTP email → verify OTP → reset-password flow | Samnang | 🟠 High | 1.5d |
| 1.3.8 | Configure Nodemailer with Gmail SMTP | Samnang | 🟠 High | 0.5d |
| 1.3.9 | Design OTP email HTML template | Phearun | 🟡 Medium | 0.5d |
| 1.3.10 | Implement express-validator rules for auth routes | Phearun | 🟠 High | 0.5d |

### 1.4 Middleware & Security (Week 2)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 1.4.1 | Implement `authenticate` middleware (JWT verify + load user) | Samnang | 🔴 Critical | 0.5d |
| 1.4.2 | Implement `authorize(...roles)` middleware | Samnang | 🔴 Critical | 0.5d |
| 1.4.3 | Implement `requirePermission(name)` middleware | Samnang | 🟠 High | 0.5d |
| 1.4.4 | Implement `optionalAuth` + `authenticateStream` middleware | Samnang | 🟠 High | 0.5d |
| 1.4.5 | Configure Helmet.js security headers | Phearun | 🟠 High | 0.5d |
| 1.4.6 | Configure CORS whitelist (all approved origins) | Phearun | 🔴 Critical | 0.5d |
| 1.4.7 | Set up rate limiting (general + auth + AI endpoints) | Phearun | 🟠 High | 0.5d |

### 1.5 Core CRUD Endpoints (Week 3)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 1.5.1 | Books CRUD (create, read, update, soft-delete) + search/filter/paginate | Samnang | 🔴 Critical | 2d |
| 1.5.2 | Users CRUD + role/permission assignment | Samnang | 🔴 Critical | 1.5d |
| 1.5.3 | Roles CRUD + permission assignment | Phearun | 🟠 High | 1d |
| 1.5.4 | Categories CRUD | Phearun | 🟠 High | 0.5d |
| 1.5.5 | Authors CRUD | Phearun | 🟠 High | 0.5d |
| 1.5.6 | Editors CRUD | Phearun | 🟡 Medium | 0.5d |
| 1.5.7 | Publishers CRUD | Phearun | 🟡 Medium | 0.5d |
| 1.5.8 | Departments CRUD | Phearun | 🟡 Medium | 0.5d |
| 1.5.9 | Material Types CRUD | Phearun | 🟡 Medium | 0.5d |
| 1.5.10 | Permissions management endpoints | Phearun | 🟠 High | 0.5d |
| 1.5.11 | Settings CRUD (key-value store) | Phearun | 🟡 Medium | 0.5d |

### 1.6 File Management & Storage (Week 3–4)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 1.6.1 | Multer upload middleware (memory storage, MIME validation) | Samnang | 🔴 Critical | 0.5d |
| 1.6.2 | R2 single file upload endpoint (cover / pdf / avatar) | Samnang | 🔴 Critical | 1d |
| 1.6.3 | R2 multiple file upload endpoint | Samnang | 🟠 High | 0.5d |
| 1.6.4 | R2 file delete endpoint | Phearun | 🟠 High | 0.5d |
| 1.6.5 | Presigned URL generation (1-hour expiry) | Samnang | 🔴 Critical | 0.5d |
| 1.6.6 | PDF streaming proxy (server-side with redirect following) | Samnang | 🔴 Critical | 1d |
| 1.6.7 | Book cover redirect endpoint | Phearun | 🟡 Medium | 0.5d |
| 1.6.8 | Avatar upload + retrieval endpoints | Phearun | 🟠 High | 0.5d |
| 1.6.9 | Download recording + tracking in downloads table | Samnang | 🟠 High | 0.5d |

### 1.7 Statistics & Activity (Week 4)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 1.7.1 | Activity logging utility (auto-log CRUD actions) | Samnang | 🟠 High | 0.5d |
| 1.7.2 | Activity controller + routes | Phearun | 🟠 High | 0.5d |
| 1.7.3 | Public stats endpoint (total books, members, categories) | Phearun | 🟠 High | 0.5d |
| 1.7.4 | Admin overview stats (full analytics with trends, distributions) | Samnang | 🟠 High | 1d |
| 1.7.5 | Download stats endpoints | Phearun | 🟡 Medium | 0.5d |
| 1.7.6 | DB connection retry logic (Render cold-start handling) | Samnang | 🟠 High | 0.5d |

**Phase 1 Deliverable:** ✅ Fully functional REST API with 45+ endpoints, JWT auth, RBAC, file management, and PostgreSQL on Render.

---

## Phase 2 — Admin Dashboard MVP

**Duration:** Week 3–6 (overlaps with Phase 1 backend completion)  
**Owner:** Dok Dara, Rorsat Sorphiny  
**Goal:** Functional admin dashboard with complete book/user management, analytics, and RBAC.

### 2.1 Project Setup (Week 3)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 2.1.1 | Initialize Next.js 16 project with TypeScript | Dara | 🔴 Critical | 0.5d |
| 2.1.2 | Configure Tailwind CSS 4 + shadcn/ui component library | Dara | 🔴 Critical | 1d |
| 2.1.3 | Set up Redux Toolkit store + RTK Query base API | Sorphiny | 🔴 Critical | 1d |
| 2.1.4 | Implement RTK Query auth re-authentication logic (auto token refresh) | Sorphiny | 🔴 Critical | 1d |
| 2.1.5 | Configure next-themes (dark/light/system) | Dara | 🟡 Medium | 0.5d |
| 2.1.6 | Set up Sentry error monitoring | Sorphiny | 🟡 Medium | 0.5d |

### 2.2 Layout & Navigation (Week 3)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 2.2.1 | Build app shell (sidebar + header + main content area) | Dara | 🔴 Critical | 1.5d |
| 2.2.2 | Implement collapsible sidebar with icon + text + nested sub-items | Dara | 🔴 Critical | 1d |
| 2.2.3 | Build dynamic breadcrumbs component | Sorphiny | 🟡 Medium | 0.5d |
| 2.2.4 | Implement kbar command palette (⌘K) | Sorphiny | 🟡 Medium | 1d |
| 2.2.5 | Build nav-user dropdown (profile, logout) | Dara | 🟠 High | 0.5d |
| 2.2.6 | Configure navigation config (sidebar items per role) | Dara | 🟠 High | 0.5d |

### 2.3 Authentication Pages (Week 3–4)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 2.3.1 | Build login page with form validation | Sorphiny | 🔴 Critical | 1d |
| 2.3.2 | Build auth API slice (login, logout, refresh, profile) | Sorphiny | 🔴 Critical | 1d |
| 2.3.3 | Implement auth guard (redirect unauthenticated users) | Sorphiny | 🔴 Critical | 0.5d |
| 2.3.4 | Build protected route HOC / middleware | Sorphiny | 🔴 Critical | 0.5d |

### 2.4 Dashboard Overview (Week 4)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 2.4.1 | Build overview API slice (fetch stats) | Sorphiny | 🟠 High | 0.5d |
| 2.4.2 | Build summary stat cards (books, theses, members, journals, etc.) | Dara | 🟠 High | 1d |
| 2.4.3 | Build upload trends chart (Recharts — bar chart, last 5 years) | Dara | 🟠 High | 1d |
| 2.4.4 | Build category distribution chart (pie/bar) | Dara | 🟠 High | 0.5d |
| 2.4.5 | Build role-based activity stats section | Sorphiny | 🟡 Medium | 0.5d |
| 2.4.6 | Build recent activities feed with time filter | Sorphiny | 🟠 High | 1d |

### 2.5 Book Management (Week 4–5)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 2.5.1 | Build book API slice (CRUD + search/filter/sort/pagination) | Sorphiny | 🔴 Critical | 1d |
| 2.5.2 | Build book data table (TanStack React Table) | Dara | 🔴 Critical | 2d |
| 2.5.3 | Implement server-side search, filtering, column sorting | Dara | 🔴 Critical | 1d |
| 2.5.4 | Build book create/edit form (React Hook Form + Zod) | Dara | 🔴 Critical | 2d |
| 2.5.5 | Implement cover image + PDF file upload in book form | Sorphiny | 🔴 Critical | 1.5d |
| 2.5.6 | Build author/editor tag input (find-or-create) | Dara | 🟠 High | 1d |
| 2.5.7 | Build delete confirmation dialog (soft-delete) | Sorphiny | 🟠 High | 0.5d |
| 2.5.8 | Build category management sub-page (CRUD table) | Sorphiny | 🟠 High | 1d |
| 2.5.9 | Build department management sub-page | Sorphiny | 🟡 Medium | 0.5d |
| 2.5.10 | Build material type management sub-page | Sorphiny | 🟡 Medium | 0.5d |
| 2.5.11 | Build publisher management sub-page | Sorphiny | 🟡 Medium | 0.5d |
| 2.5.12 | Build author management sub-page | Dara | 🟡 Medium | 0.5d |
| 2.5.13 | Build editor management sub-page | Dara | 🟡 Medium | 0.5d |

### 2.6 User Management (Week 5–6)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 2.6.1 | Build user API slice (CRUD + role/permission assignment) | Sorphiny | 🔴 Critical | 1d |
| 2.6.2 | Build user data table with search + pagination | Dara | 🔴 Critical | 1.5d |
| 2.6.3 | Build user create/edit form | Dara | 🟠 High | 1d |
| 2.6.4 | Build role assignment UI (multi-select) | Sorphiny | 🟠 High | 0.5d |
| 2.6.5 | Build direct permission assignment UI | Sorphiny | 🟡 Medium | 0.5d |
| 2.6.6 | Build role management sub-page (CRUD + permission matrix) | Dara | 🟠 High | 1.5d |
| 2.6.7 | Build permission management sub-page | Sorphiny | 🟡 Medium | 0.5d |

### 2.7 Profile & Settings (Week 6)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 2.7.1 | Build admin profile page (view/edit, avatar upload) | Dara | 🟠 High | 1d |
| 2.7.2 | Build change password card | Dara | 🟠 High | 0.5d |
| 2.7.3 | Build toast notification system (Sonner) | Sorphiny | 🟡 Medium | 0.5d |
| 2.7.4 | Build billing page (placeholder/display) | Sorphiny | 🟢 Low | 0.5d |

**Phase 2 Deliverable:** ✅ Fully functional admin dashboard with book management, user management, analytics, and RBAC on Vercel.

---

## Phase 3 — Student Frontend MVP

**Duration:** Week 5–9  
**Owner:** Dok Dara, Rorsat Sorphiny  
**Backend Support:** Chan Samnang, Hoeung Phearun

### 3.1 Project Setup (Week 5)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 3.1.1 | Initialize Next.js 16 project with TypeScript | Dara | 🔴 Critical | 0.5d |
| 3.1.2 | Configure Tailwind CSS 4 + shadcn/ui + Framer Motion | Dara | 🔴 Critical | 1d |
| 3.1.3 | Set up Redux Toolkit store + RTK Query base API | Sorphiny | 🔴 Critical | 1d |
| 3.1.4 | Implement auth token refresh logic with mutex | Sorphiny | 🔴 Critical | 0.5d |
| 3.1.5 | Build Navbar (responsive, theme toggle, auth-aware) | Dara | 🔴 Critical | 1d |
| 3.1.6 | Build Footer component | Dara | 🟡 Medium | 0.5d |
| 3.1.7 | Configure next-themes (dark/light/system) | Dara | 🟡 Medium | 0.5d |

### 3.2 Home Page (Week 5–6)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 3.2.1 | Build Hero Section (animated gradient, search bar, book cover marquee) | Dara | 🔴 Critical | 2d |
| 3.2.2 | Build Featured Books section (top 15 by views, rank badges) | Dara | 🟠 High | 1.5d |
| 3.2.3 | Build Statistics Section (live API stats with animated counters) | Sorphiny | 🟠 High | 1d |
| 3.2.4 | Build Categories Section (browse by subject) | Sorphiny | 🟡 Medium | 1d |
| 3.2.5 | Build Testimonials Section (carousel) | Dara | 🟡 Medium | 1d |
| 3.2.6 | Build CTA Section (registration call-to-action) | Dara | 🟢 Low | 0.5d |
| 3.2.7 | Implement scroll-triggered animations (IntersectionObserver) | Dara | 🟡 Medium | 0.5d |

### 3.3 Authentication Pages (Week 6)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 3.3.1 | Build Sign In page (email / username / studentId login) | Sorphiny | 🔴 Critical | 1d |
| 3.3.2 | Build Sign Up page (registration form with validation) | Sorphiny | 🔴 Critical | 1d |
| 3.3.3 | Build Forgot Password page (email → OTP → reset, 3-step) | Sorphiny | 🟠 High | 1.5d |
| 3.3.4 | Build auth API slice (login, register, refresh, profile) | Sorphiny | 🔴 Critical | 1d |
| 3.3.5 | Implement useAuth hook (auth state management) | Sorphiny | 🔴 Critical | 0.5d |

### 3.4 Book Catalog & Detail (Week 6–7)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 3.4.1 | Build Book Catalog page (grid/list view toggle) | Dara | 🔴 Critical | 2d |
| 3.4.2 | Implement real-time search + category filter + sort options | Dara | 🔴 Critical | 1d |
| 3.4.3 | Build server-side pagination component | Sorphiny | 🔴 Critical | 0.5d |
| 3.4.4 | Build skeleton loading cards | Dara | 🟡 Medium | 0.5d |
| 3.4.5 | Build Book Detail page (metadata, cover, actions) | Dara | 🔴 Critical | 1.5d |
| 3.4.6 | Implement view count auto-increment on page visit | Sorphiny | 🟠 High | 0.5d |
| 3.4.7 | Build share functionality (Twitter, Facebook, copy link) | Sorphiny | 🟡 Medium | 0.5d |
| 3.4.8 | Build Add to Favorites button (localStorage per-user) | Sorphiny | 🟠 High | 0.5d |
| 3.4.9 | Build books API slice (list, detail, search, filter) | Sorphiny | 🔴 Critical | 1d |

### 3.5 PDF Reader (Week 7–8)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 3.5.1 | Integrate @react-pdf-viewer with default layout plugin | Samnang | 🔴 Critical | 1.5d |
| 3.5.2 | Implement page position memory (localStorage per book per user) | Samnang | 🟠 High | 0.5d |
| 3.5.3 | Implement reading time tracking (30-second dispatch to Redux) | Samnang | 🟠 High | 0.5d |
| 3.5.4 | Build reading progress tracker (current page / total, percentage) | Samnang | 🟠 High | 0.5d |
| 3.5.5 | Build completion celebration (toast on finish) | Samnang | 🟡 Medium | 0.5d |
| 3.5.6 | Implement authenticated PDF download with tracking | Samnang | 🔴 Critical | 0.5d |

### 3.6 Personal Library (Week 8)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 3.6.1 | Build library page layout (tabs: Favorites, History, Progress) | Dara | 🟠 High | 1d |
| 3.6.2 | Build Favorites tab (list + remove, localStorage) | Sorphiny | 🟠 High | 0.5d |
| 3.6.3 | Build Reading History tab (recently viewed with timestamps) | Sorphiny | 🟠 High | 0.5d |
| 3.6.4 | Build Reading Progress tab (per-book progress bars) | Dara | 🟠 High | 0.5d |
| 3.6.5 | Build stats cards (total favorites, viewed count, completion rate) | Dara | 🟡 Medium | 0.5d |

### 3.7 User Profile (Week 8)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 3.7.1 | Build profile page (view/edit name, email, studentId) | Sorphiny | 🟠 High | 1d |
| 3.7.2 | Build avatar upload with preview (R2, max 5 MB) | Sorphiny | 🟠 High | 0.5d |
| 3.7.3 | Build change password form (current + new + confirm) | Sorphiny | 🟠 High | 0.5d |
| 3.7.4 | Display account info (roles, registration date) | Dara | 🟡 Medium | 0.5d |

### 3.8 Static Pages (Week 9)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 3.8.1 | Build About page (mission, vision, values, timeline) | Dara | 🟡 Medium | 1.5d |
| 3.8.2 | Build team members section (photos, roles) | Dara | 🟡 Medium | 0.5d |
| 3.8.3 | Build Contact page (info cards, map embed, form, FAQ) | Dara | 🟡 Medium | 1.5d |
| 3.8.4 | Implement contact form (with quick-link topic selection) | Sorphiny | 🟡 Medium | 0.5d |
| 3.8.5 | Build FAQ accordion component | Sorphiny | 🟡 Medium | 0.5d |

**Phase 3 Deliverable:** ✅ Fully functional student-facing website with book browsing, PDF reading, personal library, and authentication.

---

## Phase 4 — AI Features & Advanced Functionality

**Duration:** Week 8–11  
**Owner:** Chan Samnang, Hoeung Phearun  
**Goal:** AI-powered recommendations, conversational assistant, and visual book search.

### 4.1 AI Recommendation Engine (Week 8–9)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 4.1.1 | Integrate Google Gemini 2.0 Flash API | Samnang | 🔴 Critical | 1d |
| 4.1.2 | Build recommendations by category endpoint | Samnang | 🟠 High | 1d |
| 4.1.3 | Build recommendations by book title endpoint | Samnang | 🟠 High | 0.5d |
| 4.1.4 | Build personalized recommendations (from download history) | Samnang | 🟠 High | 1d |
| 4.1.5 | Build trending books with AI-generated reasons | Phearun | 🟠 High | 1d |
| 4.1.6 | Build similar books endpoint | Phearun | 🟡 Medium | 0.5d |
| 4.1.7 | Build conversational AI chat assistant | Samnang | 🟠 High | 1.5d |
| 4.1.8 | Implement in-memory cache (5-min TTL, max 200 entries) | Samnang | 🟠 High | 0.5d |
| 4.1.9 | Configure AI-specific rate limiting (20 req/min) | Phearun | 🟠 High | 0.5d |
| 4.1.10 | Implement graceful degradation (Gemini API downtime) | Phearun | 🟡 Medium | 0.5d |

### 4.2 Vector Search Service (Week 9–10)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 4.2.1 | Set up external vector search microservice | Samnang | 🟠 High | 2d |
| 4.2.2 | Build vector index sync (auto-index on book create/update) | Samnang | 🟠 High | 1d |
| 4.2.3 | Build visual book cover search endpoint (scan-search) | Samnang | 🟠 High | 1d |
| 4.2.4 | Build vector delete sync (remove index on book delete) | Phearun | 🟡 Medium | 0.5d |
| 4.2.5 | Build scan-search UI on student frontend | Dara | 🟡 Medium | 1d |

### 4.3 Real-Time Features (Week 10–11)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 4.3.1 | Set up Socket.IO on backend | Phearun | 🟡 Medium | 0.5d |
| 4.3.2 | Implement real-time activity notifications (admin dashboard) | Phearun | 🟡 Medium | 1d |
| 4.3.3 | Implement real-time stats update (new book added notification) | Phearun | 🟢 Low | 0.5d |

**Phase 4 Deliverable:** ✅ AI recommendation engine (7 endpoints), conversational chat assistant, visual book cover search.

---

## Phase 5 — Testing, QA & Performance

**Duration:** Week 10–13  
**Owner:** All Team Members  
**Goal:** Comprehensive testing, bug fixes, performance optimization, and accessibility compliance.

### 5.1 Backend Testing (Week 10–11)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 5.1.1 | Write unit tests for auth controller (register, login, refresh, OTP) | Samnang | 🔴 Critical | 2d |
| 5.1.2 | Write unit tests for book controller (CRUD, search, pagination) | Phearun | 🔴 Critical | 1.5d |
| 5.1.3 | Write unit tests for middleware (authenticate, authorize, permission) | Samnang | 🟠 High | 1d |
| 5.1.4 | Write integration tests for file upload/download flow | Phearun | 🟠 High | 1d |
| 5.1.5 | Write integration tests for AI recommendation endpoints | Samnang | 🟡 Medium | 1d |
| 5.1.6 | Write unit tests for user/role/permission controllers | Phearun | 🟠 High | 1d |
| 5.1.7 | API endpoint testing with Postman collection | Phearun | 🟠 High | 1d |

### 5.2 Frontend Testing (Week 11–12)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 5.2.1 | Test all auth flows (sign in, sign up, forgot password, OTP) | Sorphiny | 🔴 Critical | 1d |
| 5.2.2 | Test book CRUD in admin dashboard (create, edit, delete) | Dara | 🔴 Critical | 1d |
| 5.2.3 | Test user management flows (create, edit, role assignment) | Dara | 🟠 High | 1d |
| 5.2.4 | Test PDF reader (load, navigate, progress saving, download) | Sorphiny | 🔴 Critical | 1d |
| 5.2.5 | Test personal library (favorites, history, progress tracking) | Sorphiny | 🟠 High | 0.5d |
| 5.2.6 | Cross-browser testing (Chrome, Firefox, Safari, Edge) | Dara | 🟠 High | 1d |
| 5.2.7 | Mobile responsive testing (iOS Safari, Android Chrome) | Dara | 🟠 High | 1d |

### 5.3 Performance Optimization (Week 12–13)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 5.3.1 | Optimize database queries (indexes, eager loading, N+1 fixes) | Samnang | 🟠 High | 1.5d |
| 5.3.2 | Implement Next.js Image optimization for book covers | Dara | 🟠 High | 0.5d |
| 5.3.3 | Add loading states and skeleton screens where missing | Dara | 🟡 Medium | 0.5d |
| 5.3.4 | Optimize bundle size (lazy imports, dynamic imports) | Sorphiny | 🟡 Medium | 1d |
| 5.3.5 | Lighthouse performance audit (target: 90+ score) | Sorphiny | 🟠 High | 1d |
| 5.3.6 | PDF streaming performance testing (large files, slow connections) | Samnang | 🟠 High | 0.5d |
| 5.3.7 | API response time benchmarking (<200ms for CRUD, <2s for AI) | Samnang | 🟡 Medium | 0.5d |

### 5.4 Security Audit (Week 13)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 5.4.1 | Verify all admin endpoints require proper auth + role checks | Samnang | 🔴 Critical | 0.5d |
| 5.4.2 | Test rate limiting on all AI and auth endpoints | Phearun | 🟠 High | 0.5d |
| 5.4.3 | Verify soft-delete prevents data leakage (default scope) | Phearun | 🟠 High | 0.5d |
| 5.4.4 | Verify password is never exposed in API responses | Samnang | 🔴 Critical | 0.5d |
| 5.4.5 | Test CORS configuration (reject unauthorized origins) | Phearun | 🟠 High | 0.5d |
| 5.4.6 | Verify JWT token invalidation on password change | Samnang | 🟠 High | 0.5d |

**Phase 5 Deliverable:** ✅ Tested, optimized, and security-audited platform ready for production deployment.

---

## Phase 6 — Deployment & Launch

**Duration:** Week 13–14  
**Owner:** Chan Samnang (DevOps Lead)  
**Goal:** Production deployment on Render + Vercel with custom domains and monitoring.

> ✅ **April 6** — Phase 6.0 Docker preparation complete: multi-stage Dockerfile (Node 20 Alpine, dumb-init, non-root user, health check), docker-compose.yml (PostgreSQL 16 + API with health checks, named volumes, bridge network), docker-entrypoint.sh (wait for DB → migrate → seed → start), `.env.docker.example`, DB_SSL toggle for local Docker vs Render SSL.
>
> ✅ **April 7** — Phase 6.2 Vercel deployment prep: created `vercel.json` for both Student Frontend and Admin Dashboard (sin1 region, security headers, service worker caching), `.env.example` for student frontend (NEXT_PUBLIC_BACKEND_URL + COOKIE_SECRET), updated dashboard `env.example.txt` with missing NEXT_PUBLIC_BACKEND_URL + COOKIE_SECRET vars.

### 6.0 Docker & Container Preparation (Week 13) — ✅ COMPLETE

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 6.0.1 | Create Dockerfile (multi-stage, Node 20 Alpine, non-root, health check) | Samnang | 🔴 Critical | 0.5d |
| 6.0.2 | Create docker-compose.yml (API + PostgreSQL 16, volumes, entrypoint) | Samnang | 🔴 Critical | 0.5d |

### 6.1 Backend Deployment (Week 13)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 6.1.1 | Set up Render Web Service (Node.js) | Samnang | 🔴 Critical | 0.5d |
| 6.1.2 | Configure Render PostgreSQL managed database | Samnang | 🔴 Critical | 0.5d |
| 6.1.3 | Set all production environment variables on Render | Samnang | 🔴 Critical | 0.5d |
| 6.1.4 | Run Sequelize sync + seed permissions in production | Samnang | 🔴 Critical | 0.5d |
| 6.1.5 | Verify DB connection retry logic in production | Samnang | 🟠 High | 0.5d |
| 6.1.6 | Create initial admin user in production DB | Samnang | 🔴 Critical | 0.5d |

### 6.2 Frontend Deployment (Week 13)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 6.2.0a | Create vercel.json for Student Frontend (region, headers, SW cache) | Samnang | 🔴 Critical | 0.5d |
| 6.2.0b | Create vercel.json for Admin Dashboard (region, headers) | Samnang | 🔴 Critical | 0.5d |
| 6.2.0c | Create .env.example templates for both frontends | Samnang | 🟠 High | 0.5d |
| 6.2.1 | Deploy Student Frontend to Vercel | Dara | 🔴 Critical | 0.5d |
| 6.2.2 | Deploy Admin Dashboard to Vercel | Sorphiny | 🔴 Critical | 0.5d |
| 6.2.3 | Configure custom domain: `frontend.samnangchan.shop` | Samnang | 🔴 Critical | 0.5d |
| 6.2.4 | Configure custom domain: `admin-elibrary.samnangchan.shop` | Samnang | 🔴 Critical | 0.5d |
| 6.2.5 | Set production environment variables on Vercel | Dara | 🔴 Critical | 0.5d |
| 6.2.6 | Verify CORS whitelist includes all production domains | Samnang | 🔴 Critical | 0.5d |

### 6.3 Production Verification (Week 14)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 6.3.1 | End-to-end smoke test: register → login → browse → read → download | All | 🔴 Critical | 1d |
| 6.3.2 | End-to-end smoke test: admin login → create book → manage users | All | 🔴 Critical | 0.5d |
| 6.3.3 | Verify Cloudflare R2 file access in production | Samnang | 🔴 Critical | 0.5d |
| 6.3.4 | Verify email delivery (OTP) in production | Samnang | 🟠 High | 0.5d |
| 6.3.5 | Verify AI recommendations in production | Phearun | 🟠 High | 0.5d |
| 6.3.6 | Upload initial book catalog (seed data) | Phearun | 🟠 High | 1d |
| 6.3.7 | Verify Sentry error monitoring is receiving events | Sorphiny | 🟡 Medium | 0.5d |
| 6.3.8 | SSL certificate verification for all domains | Samnang | 🔴 Critical | 0.5d |

**Phase 6 Deliverable:** ✅ Production system live at custom domains with verified functionality.

---

## Phase 7 — Post-Launch & Iteration

**Duration:** Week 15–16+ (ongoing)  
**Owner:** All Team Members  
**Goal:** Monitor, gather feedback, fix bugs, and plan future features.

### 7.1 Monitoring & Bug Fixes (Week 15)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 7.1.1 | Monitor Sentry for production errors (daily triage) | Sorphiny | 🟠 High | Ongoing |
| 7.1.2 | Monitor Render logs for API errors/crashes | Samnang | 🟠 High | Ongoing |
| 7.1.3 | Fix critical bugs reported by early users | All | 🔴 Critical | Ongoing |
| 7.1.4 | Monitor DB performance and optimize slow queries | Samnang | 🟡 Medium | Ongoing |
| 7.1.5 | Migrate database backup to new Render PostgreSQL instance (`nu_elibrary_db_nvwp`) | Samnang | 🔴 Critical | 0.5d |

### 7.2 User Feedback & Iteration (Week 15–16)

| # | Task | Assignee | Priority | Est. |
|---|---|---|---|---|
| 7.2.1 | Gather student feedback via contact form / surveys | All | 🟠 High | Ongoing |
| 7.2.2 | Prioritize feature requests into backlog | Samnang | 🟡 Medium | Ongoing |
| 7.2.3 | A/B test home page layout improvements | Dara | 🟢 Low | Ongoing |

### 7.3 Future Enhancements (Backlog)

| # | Feature | Priority | Complexity |
|---|---|---|---|
| 7.3.1 | Book review & rating system (1–5 stars + comments) | 🟠 High | Medium |
| 7.3.2 | Advanced search with filters (year range, author, language) | 🟠 High | Medium |
| 7.3.3 | Push notifications (new books, recommendations) | 🟡 Medium | High |
| 7.3.4 | Reading goals & achievements (gamification) | 🟡 Medium | Medium |
| 7.3.5 | Book collections / curated playlists by professors | 🟡 Medium | Medium |
| 7.3.6 | Mobile app (React Native / PWA) | 🟡 Medium | High |
| 7.3.7 | Annotation & highlighting in PDF reader | 🟡 Medium | High |
| 7.3.8 | Bulk book import via CSV/Excel | 🟠 High | Low |
| 7.3.9 | Multi-language UI (full Khmer interface) | 🟠 High | High |
| 7.3.10 | Integration with Norton LMS / student portal | 🟡 Medium | High |
| 7.3.11 | Offline reading (PWA with service workers) | 🟡 Medium | High |
| 7.3.12 | Book request system (students can request new books) | 🟡 Medium | Low |
| 7.3.13 | Analytics export (PDF/Excel reports for admin) | 🟡 Medium | Medium |
| 7.3.14 | Real-time collaborative study notes | 🟢 Low | High |

---

## 10. Sprint Breakdown

> Each sprint = **1 week** (5 working days).

| Sprint | Week | Focus | Key Deliverables |
|---|---|---|---|
| **Sprint 1** | Week 1 | Backend Foundation | Project structure, DB models, env setup |
| **Sprint 2** | Week 2 | Auth & Middleware | JWT auth, RBAC middleware, OTP email |
| **Sprint 3** | Week 3 | Backend CRUD + Dashboard Setup | All CRUD endpoints, dashboard project init |
| **Sprint 4** | Week 4 | File Mgmt + Dashboard UI | R2 uploads, PDF streaming, dashboard layout + overview |
| **Sprint 5** | Week 5 | Dashboard Books + Frontend Init | Book management table/forms, frontend project setup |
| **Sprint 6** | Week 6 | Dashboard Users + Frontend Auth | User management, frontend auth pages + book catalog |
| **Sprint 7** | Week 7 | Frontend Books + PDF | Book detail page, PDF reader integration |
| **Sprint 8** | Week 8 | Frontend Library + AI Backend | Personal library, profile, AI recommendation endpoints |
| **Sprint 9** | Week 9 | AI + Static Pages + Vector | Vector search, frontend static pages, AI chat |
| **Sprint 10** | Week 10 | AI Polish + Backend Testing | AI graceful degradation, backend unit tests |
| **Sprint 11** | Week 11 | Frontend Testing | Full frontend QA, cross-browser, mobile |
| **Sprint 12** | Week 12 | Performance & Optimization | Bundle optimization, DB query tuning, Lighthouse |
| **Sprint 13** | Week 13 | Security Audit + Deployment | Security review, Render + Vercel deployment |
| **Sprint 14** | Week 14 | Launch & Verification | E2E smoke tests, data seeding, go-live |
| **Sprint 15** | Week 15 | Post-Launch Monitoring | Bug fixes, error monitoring, user feedback |
| **Sprint 16** | Week 16 | Iteration & Planning | Feature prioritization, roadmap for v2 |

---

## 11. Milestone Timeline

```
WEEK  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16
      │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
  M1 ─┤   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
      │   M2 ─┤   │   │   │   │   │   │   │   │   │   │   │   │   │
      │   │   │   M3 ─┤   │   │   │   │   │   │   │   │   │   │   │
      │   │   │   │   │   M4 ─┤   │   │   │   │   │   │   │   │   │
      │   │   │   │   │   │   │   │   M5 ─┤   │   │   │   │   │   │
      │   │   │   │   │   │   │   │   │   │   M6 ─┤   │   │   │   │
      │   │   │   │   │   │   │   │   │   │   │   │   │   M7 ─┤   │
      │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   M8
```

| Milestone | Week | Description | Success Criteria |
|---|---|---|---|
| **M1** | Week 1 | DB & Environment Ready | PostgreSQL connected, all 14 models synced, seed script runs |
| **M2** | Week 2 | Auth System Complete | Register, login, refresh, OTP password reset all functional |
| **M3** | Week 4 | Backend API Complete | All 45+ endpoints working, file upload/download functional |
| **M4** | Week 6 | Admin Dashboard MVP | Book/user CRUD, analytics dashboard, role management live |
| **M5** | Week 9 | Student Frontend MVP | Home, catalog, detail, PDF reader, library, auth all working |
| **M6** | Week 11 | AI Features Live | 7 AI endpoints working, vector search operational |
| **M7** | Week 14 | Production Launch | All 3 apps deployed to Render/Vercel, custom domains active |
| **M8** | Week 16 | Stable v1.0 | Post-launch bugs fixed, monitoring active, v2 roadmap defined |

---

## 12. Task Assignment Matrix

| Team Member | Primary Responsibility | Phase Focus |
|---|---|---|
| **Hoeurn Chanthorn** | Project Advisor | Review, guidance, approval at milestones |
| **Chan Samnang** | Backend Lead, DevOps | Phase 1 (backend), Phase 4 (AI), Phase 6 (deployment) |
| **Hoeung Phearun** | Backend Developer | Phase 1 (models, CRUD), Phase 4 (vector search), Phase 5 (testing) |
| **Dok Dara** | Frontend Lead, UI/UX | Phase 2 (dashboard UI), Phase 3 (frontend pages) |
| **Rorsat Sorphiny** | Frontend Developer | Phase 2 (API integration), Phase 3 (auth, logic), Phase 5 (testing) |

### Workload Distribution

```
           Backend  Dashboard  Frontend  AI/Vector  Testing  DevOps
Samnang    ████████  ░░░░░░░░  ░░██░░░░  ████████░  ██████░  ████████
Phearun    ██████░░  ░░░░░░░░  ░░░░░░░░  ████░░░░  ██████░  ░░░░░░░░
Dara       ░░░░░░░░  ████████  ████████  ░░██░░░░  ██░░░░░  ░░░░░░░░
Sorphiny   ░░░░░░░░  ████████  ██████░░  ░░░░░░░░  ████░░░  ░░░░░░░░
```

---

## 13. Risk Management

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Render free-tier DB goes idle / cold-start latency | 🟠 High | 🟠 High | DB retry logic (5 attempts, 3s delay); wake endpoint via cron |
| R2 | Google Gemini API rate limits or downtime | 🟡 Medium | 🟠 High | In-memory cache (5-min TTL); graceful degradation to static suggestions |
| R3 | Cloudflare R2 presigned URL expiry causes broken images | 🟡 Medium | 🟡 Medium | 1-hour TTL on URLs; client-side retry on 403; cover redirect endpoint |
| R4 | Large PDF files cause slow streaming/loading | 🟡 Medium | 🟠 High | 10 MB limit; server-side proxy with timeout; progressive loading |
| R5 | JWT token theft / unauthorized access | 🟢 Low | 🔴 Critical | Short-lived access tokens; refresh token rotation; HTTPS-only; Helmet |
| R6 | Scope creep delays launch | 🟠 High | 🟠 High | Strict MVP scope per phase; backlog for future features; weekly reviews |
| R7 | Team member unavailability | 🟡 Medium | 🟠 High | Cross-training; documented code; pair programming sessions |
| R8 | Vercel deployment cold starts | 🟢 Low | 🟡 Medium | ISR for static pages; edge functions for API proxies |
| R9 | Cross-browser PDF rendering issues | 🟡 Medium | 🟡 Medium | Use proven @react-pdf-viewer library; test on all major browsers |
| R10 | Data loss in PostgreSQL | 🟢 Low | 🔴 Critical | Render managed backups; soft-delete pattern; activity audit trail |

---

## 14. Dependencies & Blockers

### Critical Path

```
DB Models → Auth → RBAC Middleware → CRUD Endpoints → File Upload → PDF Streaming
    │                                       │
    │                                       ▼
    │                             Dashboard API Integration → Dashboard UI
    │                                       │
    │                                       ▼
    │                             Frontend API Integration → Frontend UI
    │
    ▼
AI Endpoints → Vector Search → Frontend AI UI
```

### External Dependencies

| Dependency | Required For | Risk Level | Fallback |
|---|---|---|---|
| Render (hosting) | Backend API + PostgreSQL | 🟡 Medium | Migrate to Railway or Fly.io |
| Vercel (hosting) | Both frontends | 🟢 Low | Migrate to Netlify |
| Cloudflare R2 | File storage | 🟢 Low | Migrate to AWS S3 or Supabase Storage |
| Google Gemini API | AI recommendations | 🟡 Medium | OpenAI API fallback; static recommendations |
| Gmail SMTP | Password reset emails | 🟡 Medium | SendGrid or Resend as fallback |
| Vector Search Service | Book cover scan | 🟡 Medium | Disable feature; text-based search only |

### Internal Dependencies

| Task | Blocked By | Impact |
|---|---|---|
| Dashboard API integration | Backend CRUD endpoints | Cannot build admin features without API |
| Frontend auth pages | Backend auth endpoints | Cannot implement login/register |
| PDF reader | Backend PDF streaming endpoint | Cannot load PDFs without proxy |
| AI frontend features | Backend AI endpoints | Cannot show recommendations |
| File upload UI | Backend upload endpoint + R2 config | Cannot upload books |
| Deployment | All features complete + tested | Cannot launch without verification |

---

## 15. Quality Assurance Strategy

### Testing Pyramid

```
        ▲
       / \           E2E Tests (Manual smoke tests)
      /   \          ─ Register → Login → Browse → Read → Download
     /     \         ─ Admin: Create Book → Edit → Delete
    /       \
   /─────────\       Integration Tests
  /           \      ─ Auth flow (register → login → refresh → protected endpoint)
 /             \     ─ Book CRUD (create → read → update → delete)
/               \    ─ File upload → R2 → presigned URL → download
/─────────────────\
                     Unit Tests
                     ─ Controllers (auth, book, user, stats, AI)
                     ─ Middleware (authenticate, authorize, permission)
                     ─ Utilities (responseFormatter, activityLogger)
```

### Acceptance Criteria Per Feature

| Feature | Criteria |
|---|---|
| User Registration | Account created, default `user` role assigned, can login |
| Book Upload | Cover + PDF uploaded to R2, book record created with URLs |
| PDF Reader | Opens in browser, remembers page position, tracks progress |
| AI Recommendations | Returns 5+ relevant suggestions from library catalog |
| Role Management | Admin can create roles, assign permissions, users reflect changes |
| Search | Returns relevant results within 500ms for title/ISBN/description |
| Download | PDF downloads, record created in downloads table, count incremented |

### Browser Support Matrix

| Browser | Desktop | Mobile |
|---|---|---|
| Chrome | ✅ Latest 2 versions | ✅ Android |
| Firefox | ✅ Latest 2 versions | ✅ Android |
| Safari | ✅ Latest 2 versions | ✅ iOS |
| Edge | ✅ Latest 2 versions | — |

---

## 16. Definition of Done

A task is considered **Done** when:

- [ ] Code is written and follows project conventions
- [ ] Code compiles/builds without errors or warnings
- [ ] Feature works as described in the PRD
- [ ] API responses follow the standardized format (`{ success, data/error }`)
- [ ] Error cases are handled gracefully (validation errors, not found, unauthorized)
- [ ] Dark mode and light mode both render correctly (frontend)
- [ ] Responsive design works on mobile (≥375px width)
- [ ] Loading states are implemented (skeletons, spinners)
- [ ] Code is committed to Git with a clear commit message
- [ ] Peer code review completed (at least 1 reviewer)
- [ ] No TypeScript `any` types without justification (frontend)
- [ ] No console.log statements left in production code

---

## 17. Communication Plan

| Activity | Frequency | Participants | Medium |
|---|---|---|---|
| Daily Standup | Daily (15 min) | All developers | In-person / Telegram |
| Sprint Review | Weekly (Friday) | All team + advisor | In-person |
| Sprint Planning | Weekly (Monday) | All developers | In-person |
| Code Review | Per PR | Author + 1 reviewer | GitHub Pull Requests |
| Advisor Check-in | Bi-weekly | Samnang + Chanthorn | In-person |
| Bug Triage | As needed | All developers | Telegram group |
| Demo to Advisor | At milestones | All team + advisor | In-person presentation |

### Git Branch Strategy

```
main ──────────────────────────────────────── Production
  │
  ├── develop ──────────────────────────────── Integration branch
  │     │
  │     ├── feature/backend-auth ────────────  Feature branches
  │     ├── feature/dashboard-book-crud
  │     ├── feature/frontend-pdf-reader
  │     ├── feature/ai-recommendations
  │     │
  │     ├── bugfix/pdf-streaming-timeout
  │     └── hotfix/auth-token-refresh
  │
  └── release/v1.0 ────────────────────────── Release candidate
```

### Commit Message Convention

```
<type>(<scope>): <short description>

Types: feat, fix, docs, style, refactor, test, chore, perf
Scopes: backend, dashboard, frontend, ai, auth, books, users

Examples:
  feat(backend): add JWT refresh token endpoint
  fix(dashboard): fix book table pagination reset on filter change
  feat(frontend): implement PDF reader with progress tracking
  test(backend): add unit tests for auth controller
  chore(deploy): configure Vercel custom domain
```

---

> **📌 This plan is a living document.** Update it as priorities shift, timelines adjust, and new requirements emerge.

> **© 2026 Norton University E-Library · Phnom Penh, Cambodia**
