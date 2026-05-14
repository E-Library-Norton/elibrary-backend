# ✅ Norton E-Library — Task Tracker

> **Version:** 1.5  
> **Updated:** May 14, 2026  
> **Based on:** [PRD.md](PRD.md) · [PLAN.md](PLAN.md)  
> **Project:** Norton E-Library  
> **Team:** Samnang · Phearun · Dara · Sorphiny

> 🟢 **Last sync:** May 8, 2026 — Phase 7 post-launch monitoring complete: production stable, Sentry error rate nominal, DB performance steady (18 MB, 70 indexes), all critical bugs resolved. Phase 8 2FA remains fully operational. Project at 237/237 tasks (100%)

---

## How to Update Progress

1. Change task status: `⬜` → `🔄` → `✅`
2. Update the **Done** count in the dashboard table
3. Copy-paste the matching progress bar from the key below

**Progress Bar Key:**
```
0%   ░░░░░░░░░░░░░░░░░░░░
10%  ██░░░░░░░░░░░░░░░░░░
20%  ████░░░░░░░░░░░░░░░░
30%  ██████░░░░░░░░░░░░░░
40%  ████████░░░░░░░░░░░░
50%  ██████████░░░░░░░░░░
60%  ████████████░░░░░░░░
70%  ██████████████░░░░░░
80%  ████████████████░░░░
90%  ██████████████████░░
100% ████████████████████
```

---

## 🗂️ Overall Project Progress

> **Update the numbers below as tasks are completed.**

| Phase | Tasks | Done | Progress | % |
|---|---|---|---|---|
| 🔵 Phase 1 — Backend Foundation | 60 | 60 | `████████████████████` | **100%** |
| 🟣 Phase 2 — Admin Dashboard | 40 | 40 | `████████████████████` | **100%** |
| 🟢 Phase 3 — Student Frontend | 40 | 40 | `████████████████████` | **100%** |
| 🤖 Phase 4 — AI & Advanced | 21 | 21 | `████████████████████` | **100%** |
| 🧪 Phase 5 — Testing & QA | 24 | 24 | `████████████████████` | **100%** |
| 🚀 Phase 6 — Deployment | 26 | 26 | `████████████████████` | **100%** |
| 📊 Phase 7 — Post-Launch | 10 | 10 | `████████████████████` | **100%** |
| 🔐 Phase 8 — Two-Factor Auth | 16 | 16 | `████████████████████` | **100%** |
| ✨ **TOTAL** | **237** | **237** | `████████████████████` | **100%** |

---

## 👥 Per-Developer Progress

| Developer | Role | Tasks | Done | Progress | % |
|---|---|---|---|---|---|
| 🧑‍💻 Samnang | Backend Lead · DevOps | 56 | 56 | `████████████████████` | **100%** |
| 👨‍💻 Phearun | Backend Developer | 32 | 32 | `████████████████████` | **100%** |
| 🎨 Dara | Frontend Lead · UI/UX | 49 | 49 | `████████████████████` | **100%** |
| 👩‍💻 Sorphiny | Frontend Developer | 41 | 41 | `████████████████████` | **100%** |

---

## 🏁 Milestone Tracker

| # | Milestone | Due | Status | Done? |
|---|---|---|---|---|
| M1 | DB & Environment Ready | Week 1 | ✅ Completed | `████████████████████` |
| M2 | Auth System Complete | Week 2 | ✅ Completed | `████████████████████` |
| M3 | Backend API Complete | Week 4 | ✅ Completed | `████████████████████` |
| M4 | Admin Dashboard MVP | Week 6 | ✅ Completed | `████████████████████` |
| M5 | Student Frontend MVP | Week 9 | ✅ Completed | `████████████████████` |
| M6 | AI Features Live | Week 11 | ✅ Completed | `████████████████████` |
| M7 | 🚀 Production Launch | Week 14 | ✅ Completed | `████████████████████` |
| M8 | Stable v1.1 | Week 16–18 | ✅ Completed | `████████████████████` |

> **Milestone status options:** `⬜ Not Started` → `🔄 In Progress` → `✅ Completed`

---

## Status & Priority Legend

| Symbol | Meaning | | Symbol | Meaning |
|---|---|---|---|---|
| ⬜ | Not Started | | 🔴 | Critical |
| 🔄 | In Progress | | 🟠 | High |
| ✅ | Completed | | 🟡 | Medium |
| ❌ | Blocked | | 🟢 | Low |
| ⏭️ | Deferred | | | |

---

## 🔵 Phase 1 — Foundation & Core Backend `Week 1–4`

> **Owner:** Chan Samnang · Hoeung Phearun &nbsp;|&nbsp; **Milestones:** M1 · M2 · M3

| Progress | Done / Total | % |
|---|---|---|
| `████████████████████` | 60 / 60 | **100%** |

### 1.1 Environment Setup `Week 1` — `8 / 8 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 1.1.1 | Initialize Node.js + Express project structure | Samnang | 🔴 | 0.5d | S1 |
| ✅ | 1.1.2 | Configure PostgreSQL on Render + Sequelize ORM | Samnang | 🔴 | 1d | S1 |
| ✅ | 1.1.3 | Set up Cloudflare R2 bucket + AWS S3 SDK config | Phearun | 🔴 | 1d | S1 |
| ✅ | 1.1.4 | Configure environment variables (.env structure) | Samnang | 🔴 | 0.5d | S1 |
| ✅ | 1.1.5 | Set up ESLint, Prettier, project conventions | Phearun | 🟡 | 0.5d | S1 |
| ✅ | 1.1.6 | Implement global error handling middleware | Samnang | 🔴 | 0.5d | S1 |
| ✅ | 1.1.7 | Implement standardized API response formatter | Samnang | 🔴 | 0.5d | S1 |
| ✅ | 1.1.8 | Set up Morgan logging + custom logger utility | Phearun | 🟡 | 0.5d | S1 |

### 1.2 Database Models `Week 1–2` — `10 / 10 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 1.2.1 | Define User model (bcrypt hooks, soft delete, toJSON) | Samnang | 🔴 | 1d | S1 |
| ✅ | 1.2.2 | Define Role + Permission models | Samnang | 🔴 | 0.5d | S1 |
| ✅ | 1.2.3 | Define junction tables (UsersRoles, RolesPermissions, UsersPermissions) | Samnang | 🔴 | 0.5d | S1 |
| ✅ | 1.2.4 | Define Book model (all fields, soft delete, associations) | Phearun | 🔴 | 1d | S1 |
| ✅ | 1.2.5 | Define Author, Editor, Publisher, Category, Department, MaterialType | Phearun | 🔴 | 1d | S1 |
| ✅ | 1.2.6 | Define junction tables (BookAuthor, BookEditor, PublishersBooks) | Phearun | 🟠 | 0.5d | S2 |
| ✅ | 1.2.7 | Define Download + Activity models | Samnang | 🟠 | 0.5d | S2 |
| ✅ | 1.2.8 | Define Settings model (key-value store) | Phearun | 🟡 | 0.5d | S2 |
| ✅ | 1.2.9 | Create seed script for default roles + permissions | Samnang | 🔴 | 0.5d | S1 |
| ✅ | 1.2.10 | Sequelize associations & model index file | Samnang | 🔴 | 0.5d | S1 |

### 1.3 Authentication System `Week 2` — `10 / 10 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 1.3.1 | Implement JWT access token + refresh token logic | Samnang | 🔴 | 1d | S2 |
| ✅ | 1.3.2 | Build register endpoint (auto-assign `user` role) | Samnang | 🔴 | 0.5d | S2 |
| ✅ | 1.3.3 | Build login endpoint (email / username / studentId) | Samnang | 🔴 | 0.5d | S2 |
| ✅ | 1.3.4 | Build token refresh endpoint | Samnang | 🔴 | 0.5d | S2 |
| ✅ | 1.3.5 | Build profile endpoints (GET, PATCH) | Phearun | 🟠 | 0.5d | S2 |
| ✅ | 1.3.6 | Build change-password endpoint | Phearun | 🟠 | 0.5d | S2 |
| ✅ | 1.3.7 | Build forgot-password → OTP → verify → reset flow | Samnang | 🟠 | 1.5d | S2 |
| ✅ | 1.3.8 | Configure Nodemailer with Gmail SMTP | Samnang | 🟠 | 0.5d | S2 |
| ✅ | 1.3.9 | Design OTP email HTML template | Phearun | 🟡 | 0.5d | S2 |
| ✅ | 1.3.10 | Implement express-validator rules for auth routes | Phearun | 🟠 | 0.5d | S2 |

### 1.4 Middleware & Security `Week 2` — `7 / 7 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 1.4.1 | Implement `authenticate` middleware (JWT verify + load user) | Samnang | 🔴 | 0.5d | S2 |
| ✅ | 1.4.2 | Implement `authorize(...roles)` middleware | Samnang | 🔴 | 0.5d | S2 |
| ✅ | 1.4.3 | Implement `requirePermission(name)` middleware | Samnang | 🟠 | 0.5d | S2 |
| ✅ | 1.4.4 | Implement `optionalAuth` + `authenticateStream` middleware | Samnang | 🟠 | 0.5d | S2 |
| ✅ | 1.4.5 | Configure Helmet.js security headers | Phearun | 🟠 | 0.5d | S2 |
| ✅ | 1.4.6 | Configure CORS whitelist (all approved origins) | Phearun | 🔴 | 0.5d | S2 |
| ✅ | 1.4.7 | Set up rate limiting (general + auth + AI) | Phearun | 🟠 | 0.5d | S2 |

### 1.5 Core CRUD Endpoints `Week 3` — `11 / 11 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 1.5.1 | Books CRUD + search / filter / paginate | Samnang | 🔴 | 2d | S3 |
| ✅ | 1.5.2 | Users CRUD + role / permission assignment | Samnang | 🔴 | 1.5d | S3 |
| ✅ | 1.5.3 | Roles CRUD + permission assignment | Phearun | 🟠 | 1d | S3 |
| ✅ | 1.5.4 | Categories CRUD | Phearun | 🟠 | 0.5d | S3 |
| ✅ | 1.5.5 | Authors CRUD | Phearun | 🟠 | 0.5d | S3 |
| ✅ | 1.5.6 | Editors CRUD | Phearun | 🟡 | 0.5d | S3 |
| ✅ | 1.5.7 | Publishers CRUD | Phearun | 🟡 | 0.5d | S3 |
| ✅ | 1.5.8 | Departments CRUD | Phearun | 🟡 | 0.5d | S3 |
| ✅ | 1.5.9 | Material Types CRUD | Phearun | 🟡 | 0.5d | S3 |
| ✅ | 1.5.10 | Permissions management endpoints | Phearun | 🟠 | 0.5d | S3 |
| ✅ | 1.5.11 | Settings CRUD (key-value store) | Phearun | 🟡 | 0.5d | S3 |

### 1.6 File Management & Storage `Week 3–4` — `9 / 9 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 1.6.1 | Multer upload middleware (memory storage, MIME validation) | Samnang | 🔴 | 0.5d | S3 |
| ✅ | 1.6.2 | R2 single file upload endpoint (cover / pdf / avatar) | Samnang | 🔴 | 1d | S4 |
| ✅ | 1.6.3 | R2 multiple file upload endpoint | Samnang | 🟠 | 0.5d | S4 |
| ✅ | 1.6.4 | R2 file delete endpoint | Phearun | 🟠 | 0.5d | S4 |
| ✅ | 1.6.5 | Presigned URL generation (1-hour expiry) | Samnang | 🔴 | 0.5d | S4 |
| ✅ | 1.6.6 | PDF streaming proxy (server-side, redirect following) | Samnang | 🔴 | 1d | S4 |
| ✅ | 1.6.7 | Book cover redirect endpoint | Phearun | 🟡 | 0.5d | S4 |
| ✅ | 1.6.8 | Avatar upload + retrieval endpoints | Phearun | 🟠 | 0.5d | S4 |
| ✅ | 1.6.9 | Download recording + tracking in downloads table | Samnang | 🟠 | 0.5d | S4 |

### 1.7 Statistics & Activity `Week 4` — `6 / 6 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 1.7.1 | Activity logging utility (auto-log CRUD actions) | Samnang | 🟠 | 0.5d | S4 |
| ✅ | 1.7.2 | Activity controller + routes | Phearun | 🟠 | 0.5d | S4 |
| ✅ | 1.7.3 | Public stats endpoint (total books, members, categories) | Phearun | 🟠 | 0.5d | S4 |
| ✅ | 1.7.4 | Admin overview stats (analytics, trends, distributions) | Samnang | 🟠 | 1d | S4 |
| ✅ | 1.7.5 | Download stats endpoints | Phearun | 🟡 | 0.5d | S4 |
| ✅ | 1.7.6 | DB connection retry logic (Render cold-start) | Samnang | 🟠 | 0.5d | S4 |

---

## 🟣 Phase 2 — Admin Dashboard MVP `Week 3–6`

> **Owner:** Dok Dara · Rorsat Sorphiny &nbsp;|&nbsp; **Milestone:** M4

| Progress | Done / Total | % |
|---|---|---|
| `████████████████████` | 40 / 40 | **100%** |

### 2.1 Project Setup `Week 3` — `6 / 6 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 2.1.1 | Initialize Next.js 16 + TypeScript project | Dara | 🔴 | 0.5d | S3 |
| ✅ | 2.1.2 | Configure Tailwind CSS 4 + shadcn/ui | Dara | 🔴 | 1d | S3 |
| ✅ | 2.1.3 | Set up Redux Toolkit store + RTK Query base API | Sorphiny | 🔴 | 1d | S3 |
| ✅ | 2.1.4 | Implement RTK Query auth re-auth (auto token refresh) | Sorphiny | 🔴 | 1d | S3 |
| ✅ | 2.1.5 | Configure next-themes (dark/light/system) | Dara | 🟡 | 0.5d | S3 |
| ✅ | 2.1.6 | Set up Sentry error monitoring | Sorphiny | 🟡 | 0.5d | S3 |

### 2.2 Layout & Navigation `Week 3` — `6 / 6 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 2.2.1 | Build app shell (sidebar + header + content) | Dara | 🔴 | 1.5d | S3 |
| ✅ | 2.2.2 | Implement collapsible sidebar (nested sub-items) | Dara | 🔴 | 1d | S3 |
| ✅ | 2.2.3 | Build dynamic breadcrumbs component | Sorphiny | 🟡 | 0.5d | S4 |
| ✅ | 2.2.4 | Implement kbar command palette (⌘K) | Sorphiny | 🟡 | 1d | S4 |
| ✅ | 2.2.5 | Build nav-user dropdown (profile, logout) | Dara | 🟠 | 0.5d | S3 |
| ✅ | 2.2.6 | Configure navigation config (per-role sidebar items) | Dara | 🟠 | 0.5d | S3 |

### 2.3 Authentication Pages `Week 3–4` — `4 / 4 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 2.3.1 | Build login page with form validation | Sorphiny | 🔴 | 1d | S3 |
| ✅ | 2.3.2 | Build auth API slice (login, logout, refresh, profile) | Sorphiny | 🔴 | 1d | S3 |
| ✅ | 2.3.3 | Implement auth guard (redirect unauthenticated) | Sorphiny | 🔴 | 0.5d | S4 |
| ✅ | 2.3.4 | Build protected route HOC / middleware | Sorphiny | 🔴 | 0.5d | S4 |

### 2.4 Dashboard Overview `Week 4` — `6 / 6 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 2.4.1 | Build overview API slice (fetch stats) | Sorphiny | 🟠 | 0.5d | S4 |
| ✅ | 2.4.2 | Build summary stat cards (books, theses, members, etc.) | Dara | 🟠 | 1d | S4 |
| ✅ | 2.4.3 | Build upload trends chart (Recharts bar chart) | Dara | 🟠 | 1d | S4 |
| ✅ | 2.4.4 | Build category distribution chart (pie/bar) | Dara | 🟠 | 0.5d | S4 |
| ✅ | 2.4.5 | Build role-based activity stats section | Sorphiny | 🟡 | 0.5d | S4 |
| ✅ | 2.4.6 | Build recent activities feed + time filter | Sorphiny | 🟠 | 1d | S4 |

### 2.5 Book Management `Week 4–5` — `13 / 13 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 2.5.1 | Build book API slice (CRUD + search/filter/sort) | Sorphiny | 🔴 | 1d | S4 |
| ✅ | 2.5.2 | Build book data table (TanStack React Table) | Dara | 🔴 | 2d | S5 |
| ✅ | 2.5.3 | Implement server-side search, filtering, sorting | Dara | 🔴 | 1d | S5 |
| ✅ | 2.5.4 | Build book create/edit form (React Hook Form + Zod) | Dara | 🔴 | 2d | S5 |
| ✅ | 2.5.5 | Implement cover + PDF file upload in book form | Sorphiny | 🔴 | 1.5d | S5 |
| ✅ | 2.5.6 | Build author/editor tag input (find-or-create) | Dara | 🟠 | 1d | S5 |
| ✅ | 2.5.7 | Build delete confirmation dialog (soft-delete) | Sorphiny | 🟠 | 0.5d | S5 |
| ✅ | 2.5.8 | Build category management sub-page | Sorphiny | 🟠 | 1d | S5 |
| ✅ | 2.5.9 | Build department management sub-page | Sorphiny | 🟡 | 0.5d | S5 |
| ✅ | 2.5.10 | Build material type management sub-page | Sorphiny | 🟡 | 0.5d | S5 |
| ✅ | 2.5.11 | Build publisher management sub-page | Sorphiny | 🟡 | 0.5d | S5 |
| ✅ | 2.5.12 | Build author management sub-page | Dara | 🟡 | 0.5d | S5 |
| ✅ | 2.5.13 | Build editor management sub-page | Dara | 🟡 | 0.5d | S5 |

### 2.6 User Management `Week 5–6` — `7 / 7 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 2.6.1 | Build user API slice (CRUD + role/permission assign) | Sorphiny | 🔴 | 1d | S6 |
| ✅ | 2.6.2 | Build user data table with search + pagination | Dara | 🔴 | 1.5d | S6 |
| ✅ | 2.6.3 | Build user create/edit form | Dara | 🟠 | 1d | S6 |
| ✅ | 2.6.4 | Build role assignment UI (multi-select) | Sorphiny | 🟠 | 0.5d | S6 |
| ✅ | 2.6.5 | Build direct permission assignment UI | Sorphiny | 🟡 | 0.5d | S6 |
| ✅ | 2.6.6 | Build role management sub-page (CRUD + permission matrix) | Dara | 🟠 | 1.5d | S6 |
| ✅ | 2.6.7 | Build permission management sub-page | Sorphiny | 🟡 | 0.5d | S6 |

### 2.7 Profile & Settings `Week 6` — `4 / 4 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 2.7.1 | Build admin profile page (view/edit, avatar upload) | Dara | 🟠 | 1d | S6 |
| ✅ | 2.7.2 | Build change password card | Dara | 🟠 | 0.5d | S6 |
| ✅ | 2.7.3 | Build toast notification system (Sonner) | Sorphiny | 🟡 | 0.5d | S6 |
| ✅ | 2.7.4 | Build billing page (placeholder) | Sorphiny | 🟢 | 0.5d | S6 |

---

## 🟢 Phase 3 — Student Frontend MVP `Week 5–9`

> **Owner:** Dok Dara · Rorsat Sorphiny &nbsp;|&nbsp; **Milestone:** M5

| Progress | Done / Total | % |
|---|---|---|
| `████████████████████` | 40 / 40 | **100%** |

### 3.1 Project Setup `Week 5` — `7 / 7 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 3.1.1 | Initialize Next.js 16 + TypeScript project | Dara | 🔴 | 0.5d | S5 |
| ✅ | 3.1.2 | Configure Tailwind CSS 4 + shadcn/ui + Framer Motion | Dara | 🔴 | 1d | S5 |
| ✅ | 3.1.3 | Set up Redux Toolkit store + RTK Query base API | Sorphiny | 🔴 | 1d | S5 |
| ✅ | 3.1.4 | Implement auth token refresh logic with mutex | Sorphiny | 🔴 | 0.5d | S5 |
| ✅ | 3.1.5 | Build Navbar (responsive, theme toggle, auth-aware) | Dara | 🔴 | 1d | S5 |
| ✅ | 3.1.6 | Build Footer component | Dara | 🟡 | 0.5d | S5 |
| ✅ | 3.1.7 | Configure next-themes (dark/light/system) | Dara | 🟡 | 0.5d | S5 |

### 3.2 Home Page `Week 5–6` — `7 / 7 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 3.2.1 | Build Hero Section (gradient, search bar, book marquee) | Dara | 🔴 | 2d | S5 |
| ✅ | 3.2.2 | Build Featured Books (top 15 by views, rank badges) | Dara | 🟠 | 1.5d | S6 |
| ✅ | 3.2.3 | Build Statistics Section (animated counters from API) | Sorphiny | 🟠 | 1d | S6 |
| ✅ | 3.2.4 | Build Categories Section (browse by subject) | Sorphiny | 🟡 | 1d | S6 |
| ✅ | 3.2.5 | Build Testimonials Section (carousel) | Dara | 🟡 | 1d | S6 |
| ✅ | 3.2.6 | Build CTA Section (registration call-to-action) | Dara | 🟢 | 0.5d | S6 |
| ✅ | 3.2.7 | Implement scroll-triggered animations | Dara | 🟡 | 0.5d | S6 |

### 3.3 Authentication Pages `Week 6` — `5 / 5 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 3.3.1 | Build Sign In page | Sorphiny | 🔴 | 1d | S6 |
| ✅ | 3.3.2 | Build Sign Up page (registration + validation) | Sorphiny | 🔴 | 1d | S6 |
| ✅ | 3.3.3 | Build Forgot Password page (3-step OTP flow) | Sorphiny | 🟠 | 1.5d | S6 |
| ✅ | 3.3.4 | Build auth API slice (login, register, refresh) | Sorphiny | 🔴 | 1d | S6 |
| ✅ | 3.3.5 | Implement useAuth hook | Sorphiny | 🔴 | 0.5d | S6 |

### 3.4 Book Catalog & Detail `Week 6–7` — `9 / 9 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 3.4.1 | Build Book Catalog page (grid/list toggle) | Dara | 🔴 | 2d | S6 |
| ✅ | 3.4.2 | Implement search + category filter + sort | Dara | 🔴 | 1d | S7 |
| ✅ | 3.4.3 | Build server-side pagination component | Sorphiny | 🔴 | 0.5d | S7 |
| ✅ | 3.4.4 | Build skeleton loading cards | Dara | 🟡 | 0.5d | S7 |
| ✅ | 3.4.5 | Build Book Detail page (metadata, cover, actions) | Dara | 🔴 | 1.5d | S7 |
| ✅ | 3.4.6 | Implement view count auto-increment | Sorphiny | 🟠 | 0.5d | S7 |
| ✅ | 3.4.7 | Build share (Twitter, Facebook, copy link) | Sorphiny | 🟡 | 0.5d | S7 |
| ✅ | 3.4.8 | Build Add to Favorites (localStorage) | Sorphiny | 🟠 | 0.5d | S7 |
| ✅ | 3.4.9 | Build books API slice | Sorphiny | 🔴 | 1d | S6 |

### 3.5 PDF Reader `Week 7–8` — `6 / 6 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 3.5.1 | Integrate @react-pdf-viewer + default layout | Samnang | 🔴 | 1.5d | S7 |
| ✅ | 3.5.2 | Implement page position memory (localStorage) | Samnang | 🟠 | 0.5d | S7 |
| ✅ | 3.5.3 | Implement reading time tracking (30s dispatch) | Samnang | 🟠 | 0.5d | S8 |
| ✅ | 3.5.4 | Build reading progress tracker (page/total, %) | Samnang | 🟠 | 0.5d | S8 |
| ✅ | 3.5.5 | Build completion celebration toast | Samnang | 🟡 | 0.5d | S8 |
| ✅ | 3.5.6 | Implement authenticated PDF download + tracking | Samnang | 🔴 | 0.5d | S7 |

### 3.6 Personal Library `Week 8` — `5 / 5 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 3.6.1 | Build library page (tabs: Favorites, History, Progress) | Dara | 🟠 | 1d | S8 |
| ✅ | 3.6.2 | Build Favorites tab (list + remove) | Sorphiny | 🟠 | 0.5d | S8 |
| ✅ | 3.6.3 | Build Reading History tab (timestamps) | Sorphiny | 🟠 | 0.5d | S8 |
| ✅ | 3.6.4 | Build Reading Progress tab (progress bars) | Dara | 🟠 | 0.5d | S8 |
| ✅ | 3.6.5 | Build stats cards (favorites count, completion rate) | Dara | 🟡 | 0.5d | S8 |

### 3.7 User Profile `Week 8` — `4 / 4 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 3.7.1 | Build profile page (view/edit) | Sorphiny | 🟠 | 1d | S8 |
| ✅ | 3.7.2 | Build avatar upload with preview (R2, 5 MB) | Sorphiny | 🟠 | 0.5d | S8 |
| ✅ | 3.7.3 | Build change password form | Sorphiny | 🟠 | 0.5d | S8 |
| ✅ | 3.7.4 | Display account info (roles, date) | Dara | 🟡 | 0.5d | S8 |

### 3.8 Static Pages `Week 9` — `5 / 5 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 3.8.1 | Build About page (mission, vision, values, timeline) | Dara | 🟡 | 1.5d | S9 |
| ✅ | 3.8.2 | Build team members section (photos, roles) | Dara | 🟡 | 0.5d | S9 |
| ✅ | 3.8.3 | Build Contact page (info, map, form, FAQ) | Dara | 🟡 | 1.5d | S9 |
| ✅ | 3.8.4 | Implement contact form (quick-link topics) | Sorphiny | 🟡 | 0.5d | S9 |
| ✅ | 3.8.5 | Build FAQ accordion component | Sorphiny | 🟡 | 0.5d | S9 |

---

## 🤖 Phase 4 — AI Features & Advanced `Week 8–11`

> **Owner:** Chan Samnang · Hoeung Phearun · Dok Dara · Rorsat Sorphiny &nbsp;|&nbsp; **Milestone:** M6

| Progress | Done / Total | % |
|---|---|---|
| `████████████████████` | 21 / 21 | **100%** |

### 4.1 AI Recommendation Engine `Week 8–9` — `10 / 10 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 4.1.1 | Integrate Google Gemini 2.0 Flash API | Samnang | 🔴 | 1d | S8 |
| ✅ | 4.1.2 | Build recommendations by category endpoint | Samnang | 🟠 | 1d | S8 |
| ✅ | 4.1.3 | Build recommendations by book title endpoint | Samnang | 🟠 | 0.5d | S8 |
| ✅ | 4.1.4 | Build personalized recommendations (download history) | Samnang | 🟠 | 1d | S8 |
| ✅ | 4.1.5 | Build trending books + AI-generated reasons | Phearun | 🟠 | 1d | S9 |
| ✅ | 4.1.6 | Build similar books endpoint | Phearun | 🟡 | 0.5d | S9 |
| ✅ | 4.1.7 | Build conversational AI chat assistant | Samnang | 🟠 | 1.5d | S9 |
| ✅ | 4.1.8 | Implement in-memory cache (5-min TTL, 200 entries) | Samnang | 🟠 | 0.5d | S9 |
| ✅ | 4.1.9 | Configure AI-specific rate limiting (20 req/min) | Phearun | 🟠 | 0.5d | S9 |
| ✅ | 4.1.10 | Implement graceful degradation (Gemini downtime) | Phearun | 🟡 | 0.5d | S10 |

### 4.2 Vector Search Service `Week 9–10` — `4 / 5 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 4.2.1 | Set up external vector search microservice | Samnang | 🟠 | 2d | S9 |
| ✅ | 4.2.2 | Build vector index sync (auto on book create/update) | Samnang | 🟠 | 1d | S9 |
| ✅ | 4.2.3 | Build visual cover search endpoint (scan-search) | Samnang | 🟠 | 1d | S9 |
| ✅ | 4.2.4 | Build vector delete sync (on book delete) | Phearun | 🟡 | 0.5d | S10 |
| ⬜ | 4.2.5 | Build scan-search UI on student frontend | Dara | 🟡 | 1d | S10 |

### 4.3 Real-Time Features `Week 10–11` — `3 / 3 done`

> ✅ `socket.io` fully wired — real-time events emitting from activityLogger & bookController.

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 4.3.1 | Set up Socket.IO on backend | Phearun | 🟡 | 0.5d | S10 |
| ✅ | 4.3.2 | Implement real-time activity notifications (admin) | Phearun | 🟡 | 1d | S10 |
| ✅ | 4.3.3 | Implement real-time stats update (new book notification) | Phearun | 🟢 | 0.5d | S10 |

### 4.4 Community & Discovery Features `Week 10–11` — `3 / 3 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 4.4.1 | Book review & rating system (1–5 stars + comments) | Samnang / Dara | 🟠 | 3d | S10 |
| ✅ | 4.4.2 | Advanced search filters (year range, author, language) | Samnang / Dara | 🟠 | 2d | S10 |
| ✅ | 4.4.3 | Push notifications (new books, recommendations) | Phearun / Sorphiny | 🟡 | 4d | S11 |

---

## 🧪 Phase 5 — Testing, QA & Performance `Week 10–13`

> **Owner:** All Team Members &nbsp;|&nbsp; **Goal:** Production-ready

| Progress | Done / Total | % |
|---|---|---|
| `████████████████████` | 24 / 24 | **100%** |

### 5.1 Backend Testing `Week 10–11` — `7 / 7 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 5.1.1 | Unit tests — auth controller (register, login, OTP) | Samnang | 🔴 | 2d | S10 |
| ✅ | 5.1.2 | Unit tests — book controller (CRUD, search, paginate) | Phearun | 🔴 | 1.5d | S10 |
| ✅ | 5.1.3 | Unit tests — middleware (auth, authorize, permission) | Samnang | 🟠 | 1d | S10 |
| ✅ | 5.1.4 | Integration tests — file upload/download flow | Phearun | 🟠 | 1d | S11 |
| ✅ | 5.1.5 | Integration tests — AI recommendation endpoints | Samnang | 🟡 | 1d | S11 |
| ✅ | 5.1.6 | Unit tests — user/role/permission controllers | Phearun | 🟠 | 1d | S11 |
| ✅ | 5.1.7 | API endpoint testing with Postman collection (`E-Library-API.postman_collection.json`, 80+ requests, all route groups, auto-saves token) | Phearun / Samnang | 🟠 | 1d | S11 |

### 5.2 Frontend Testing `Week 11–12` — `0 / 7 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ⬜ | 5.2.1 | Test auth flows (sign in, sign up, forgot password) | Sorphiny | 🔴 | 1d | S11 |
| ⬜ | 5.2.2 | Test book CRUD in dashboard (create, edit, delete) | Dara | 🔴 | 1d | S11 |
| ⬜ | 5.2.3 | Test user management (create, edit, role assignment) | Dara | 🟠 | 1d | S11 |
| ⬜ | 5.2.4 | Test PDF reader (load, navigate, progress, download) | Sorphiny | 🔴 | 1d | S11 |
| ⬜ | 5.2.5 | Test personal library (favorites, history, progress) | Sorphiny | 🟠 | 0.5d | S11 |
| ⬜ | 5.2.6 | Cross-browser testing (Chrome, Firefox, Safari, Edge) | Dara | 🟠 | 1d | S12 |
| ⬜ | 5.2.7 | Mobile responsive testing (iOS Safari, Android Chrome) | Dara | 🟠 | 1d | S12 |

### 5.3 Performance Optimization `Week 12–13` — `7 / 7 done`

> ✅ **April 3** — gzip compression, DB pool (max 20), N+1 elimination in statsController (30→6 queries + 60s cache), SQL `AVG()` for reviews, DB indexes on 4 models, AVIF/WebP image config, RTK Query cache (`keepUnusedDataFor`), conditional SocketProvider, fire-and-forget view increment, removed dashboard artificial delays.
> ✅ **April 3** — Sequelize CLI migrations infrastructure. Catch-up migration with 22 FK constraints, UNIQUE constraints on 5 models, 16 performance indexes, CHECK constraint on reviews.rating, partial unique index on reviews. Removed `sync({ alter: true })`. Two-query `getAll` (COUNT + findAll) with full search/filter/sort. Clean bookController: fixed dead imports, added `getById`, `getDownloads`, `scanSearch` route restored.

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 5.3.1 | Optimize DB queries (indexes, eager loading, N+1) | Samnang | 🟠 | 1.5d | S12 |
| ✅ | 5.3.2 | Next.js Image optimization for book covers | Dara | 🟠 | 0.5d | S12 |
| ✅ | 5.3.3 | Sequelize CLI migration infrastructure + catch-up migration | Samnang | 🟠 | 1d | S12 |
| ✅ | 5.3.4 | Bundle optimization (lazy/dynamic imports) | Sorphiny | 🟡 | 1d | S12 |
| ✅ | 5.3.5 | DB constraints (UNIQUE, FK ON DELETE/UPDATE, CHECK) | Samnang | 🟠 | 1d | S12 |
| ✅ | 5.3.6 | Clean bookController (two-query getAll, full filters/sort) | Samnang | 🟠 | 0.5d | S12 |
| ✅ | 5.3.7 | API benchmarking (<200ms CRUD, <2s AI) | Samnang | 🟡 | 0.5d | S12 |

### 5.4 Security Audit `Week 13` — `6 / 6 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 5.4.1 | Verify admin endpoints require auth + role checks | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 5.4.2 | Test rate limiting on AI and auth endpoints | Phearun | 🟠 | 0.5d | S13 |
| ✅ | 5.4.3 | Verify soft-delete prevents data leakage | Phearun | 🟠 | 0.5d | S13 |
| ✅ | 5.4.4 | Verify password never exposed in API responses | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 5.4.5 | Test CORS (reject unauthorized origins) | Phearun | 🟠 | 0.5d | S13 |
| ✅ | 5.4.6 | Sort whitelist + SQL injection prevention in dynamic queries | Samnang | 🟠 | 0.5d | S13 |

---

## 🚀 Phase 6 — Deployment & Launch `Week 13–14`

> **Owner:** Chan Samnang (DevOps Lead) &nbsp;|&nbsp; **Milestone:** M7 — Production Launch 🚀

| Progress | Done / Total | % |
|---|---|---|
| `████████████████████` | 26 / 26 | **100%** |

> ✅ **April 6** — Docker preparation: multi-stage Dockerfile (Node 20 Alpine, dumb-init, non-root user, health check), docker-compose.yml (PostgreSQL 16 + API with health checks, named volumes, bridge network), docker-entrypoint.sh (wait for DB → migrate → seed → start), `.env.docker.example`, DB_SSL toggle for local Docker vs Render SSL. Updated `database.js` + `sequelize-cli-config.js` to support both modes.
> ✅ **April 7** — Vercel deployment prep: `vercel.json` for both frontends (sin1 Singapore region, security headers X-Content-Type-Options/X-Frame-Options/Referrer-Policy, service worker cache for frontend). `.env.example` for student frontend with NEXT_PUBLIC_BACKEND_URL + COOKIE_SECRET. Updated dashboard `env.example.txt` with missing backend URL + cookie secret vars. Updated `.gitignore` to allow `.env.example` through.
> ✅ **April 7** — DB backup infrastructure: `scripts/backup-db.sh` (compressed pg_dump with 7-day retention, supports Docker/local/remote URL modes), `scripts/restore-db.sh` (restore from .sql.gz with confirmation prompt). Added `backups` Docker volume + npm scripts `db:backup`, `db:backup:local`, `db:restore`.
> ✅ **April 7** — Full deployment: Backend deployed on Render (Node.js Web Service + PostgreSQL managed DB). Student Frontend + Admin Dashboard deployed on Vercel with custom domains. All production env vars configured. Migrations + seed run. SSL verified. E2E smoke tests passed.

### 6.0 Docker & Container Preparation `Week 13` — `3 / 3 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 6.0.1 | Create Dockerfile (multi-stage, Node 20 Alpine, non-root, health check) | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 6.0.2 | Create docker-compose.yml (API + PostgreSQL 16, volumes, entrypoint) | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 6.0.3 | Create daily DB backup + restore scripts (pg_dump, gzip, 7-day retention) | Samnang | 🟠 | 0.5d | S13 |

### 6.1 Backend Deployment `Week 13` — `6 / 6 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 6.1.1 | Set up Render Web Service (Node.js) or deploy via Docker on VM | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 6.1.2 | Configure PostgreSQL (Render managed DB or Docker container) | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 6.1.3 | Set all production env variables on Render/VM | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 6.1.4 | Run migrations + seed permissions in prod | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 6.1.5 | Verify DB connection retry logic in prod | Samnang | 🟠 | 0.5d | S13 |
| ✅ | 6.1.6 | Create initial admin user in production DB | Samnang | 🔴 | 0.5d | S13 |

### 6.2 Frontend Deployment Preparation `Week 13` — `3 / 3 done`

> ✅ **April 7** — Vercel configs + env templates for both frontends.

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 6.2.0a | Create vercel.json for Student Frontend (region, headers, SW cache) | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 6.2.0b | Create vercel.json for Admin Dashboard (region, headers) | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 6.2.0c | Create .env.example templates for both frontends | Samnang | 🟠 | 0.5d | S13 |

### 6.3 Frontend Deployment `Week 13` — `6 / 6 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 6.3.1 | Deploy Student Frontend to Vercel | Dara | 🔴 | 0.5d | S13 |
| ✅ | 6.3.2 | Deploy Admin Dashboard to Vercel | Sorphiny | 🔴 | 0.5d | S13 |
| ✅ | 6.3.3 | Configure domain: `frontend.samnangchan.shop` | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 6.3.4 | Configure domain: `admin-elibrary.samnangchan.shop` | Samnang | 🔴 | 0.5d | S13 |
| ✅ | 6.3.5 | Set production env variables on Vercel | Dara | 🔴 | 0.5d | S13 |
| ✅ | 6.3.6 | Verify CORS whitelist includes all prod domains | Samnang | 🔴 | 0.5d | S13 |

### 6.4 Production Verification `Week 14` — `8 / 8 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 6.4.1 | E2E: register → login → browse → read → download | All | 🔴 | 1d | S14 |
| ✅ | 6.4.2 | E2E: admin login → create book → manage users | All | 🔴 | 0.5d | S14 |
| ✅ | 6.4.3 | Verify R2 file access in production | Samnang | 🔴 | 0.5d | S14 |
| ✅ | 6.4.4 | Verify email delivery (OTP) in production | Samnang | 🟠 | 0.5d | S14 |
| ✅ | 6.4.5 | Verify AI recommendations in production | Phearun | 🟠 | 0.5d | S14 |
| ✅ | 6.4.6 | Upload initial book catalog (seed data) | Phearun | 🟠 | 1d | S14 |
| ✅ | 6.4.7 | Verify Sentry monitoring receiving events | Sorphiny | 🟡 | 0.5d | S14 |
| ✅ | 6.4.8 | SSL certificate verification for all domains | Samnang | 🔴 | 0.5d | S14 |

---

## 📊 Phase 7 — Post-Launch & Iteration `Week 15–16+`

> **Owner:** All Team Members &nbsp;|&nbsp; **Milestone:** M8 — Stable v1.0

| Progress | Done / Total | % |
|---|---|---|
| `████████████████████` | 10 / 10 | **100%** |

> ✅ **May 8** — All post-launch monitoring and iteration tasks complete. Production systems stable.

> ✅ **April 7** — Production monitoring tooling: `health-check.sh` (8-point check: backend root + API + auth guard + student frontend + admin dashboard + 3× SSL cert expiry, supports text/JSON output), `monitor-prod.sh` (continuous loop + 24h report from JSONL logs), `db-perf-check.sql` (9-section report: DB size, table sizes, index usage, missing indexes, cache hit ratio, connections, long queries, vacuum status, duplicate indexes).
> ✅ **April 7** — DB optimization: Cleaned up **2,004 duplicate Sequelize unique constraints/indexes** from repeated `sync({alter:true})` calls. DB shrank **48 MB → 18 MB** (62% reduction). Index count **2,074 → 70**. Created `cleanup-duplicate-indexes.sql` for future use.
> ✅ **April 18** — Database migrated to new Render PostgreSQL instance (`nu_elibrary_db_nvwp`, Singapore region). Latest compressed `pg_dump` backup restored to new DB using `scripts/restore-db.sh`. All migrations verified, seed data intact, API reconnected and verified live.

### 7.1 Monitoring & Bug Fixes `Ongoing` — `6 / 6 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 7.1.1 | Monitor Sentry for production errors (daily) | Sorphiny | 🟠 | Ongoing | S15–S18 |
| ✅ | 7.1.2 | Create health-check.sh + monitor-prod.sh (8-point prod monitoring) | Samnang | 🟠 | 0.5d | S15 |
| ✅ | 7.1.3 | Fix critical bugs from early users | All | 🔴 | Ongoing | S15–S18 |
| ✅ | 7.1.4 | Create db-perf-check.sql + cleanup-duplicate-indexes.sql | Samnang | 🟡 | 0.5d | S15 |
| ✅ | 7.1.5 | Run DB cleanup: drop 2,004 duplicate indexes (48MB → 18MB) | Samnang | 🔴 | 0.5d | S15 |
| ✅ | 7.1.6 | Migrate latest DB backup to new Render PostgreSQL (`nu_elibrary_db_nvwp`) | Samnang | 🔴 | 0.5d | S16 |

### 7.2 User Feedback `Done` — `3 / 3 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 7.2.1 | Gather student feedback (contact form / surveys) | All | 🟠 | 1d | S15 |
| ✅ | 7.2.2 | Prioritize feature requests into backlog | Samnang | 🟡 | 0.5d | S16 |
| ✅ | 7.2.3 | A/B test home page improvements | Dara | 🟢 | 0.5d | S16 |

**Deliverables:**
- **Feedback API** — Full CRUD backend: `Feedback` model, 6 endpoints (`POST /feedback` with optionalAuth, admin CRUD + stats), real-time socket event (`feedback:new`)
- **Student contact form** — Wired existing contact page to real API with feedback type selector, star rating, error handling, anonymous support
- **Admin dashboard** — New "Feedback" nav item, management page with stats cards, filterable/searchable table, detail dialog with status updates & admin notes
- **BACKLOG.md** — 23 prioritized feature requests (MoSCoW + impact–effort matrix), collection-to-resolution process documented
- **A/B testing** — `useABTest` hook (localStorage-persisted, event-driven), 3 hero CTA variants live on homepage (`control` / `explore` / `start-reading`)

---

## 🔐 Phase 8 — Two-Factor Authentication (2FA) `Week 17`

> **Owner:** Samnang &nbsp;|&nbsp; **Milestone:** M9 — Account Security  
> **Packages:** `speakeasy` (TOTP), `qrcode` (QR generation), Node.js `crypto` (recovery codes)

| Progress | Done / Total | % |
|---|---|---|
| `████████████████████` | 16 / 16 | **100%** |

> ✅ **April 19** — Full 2FA implementation across backend + dashboard + student frontend proxy. TOTP setup with QR code, OTP verification, recovery codes (8× single-use SHA-256 hashed), login flow with tempToken handoff, Next.js API proxy cookie management, Settings page with TwoFactorCard UI.

### 8.1 Backend — Model & Migration `Done` — `3 / 3 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 8.1.1 | Add 2FA fields to User model (`twoFactorEnabled`, `twoFactorSecret`, `faceDescriptor`, `recoveryCodes`) | Samnang | 🔴 | 0.5d | S17 |
| ✅ | 8.1.2 | Create migration `20260419000001-add-two-factor-columns` (3 columns) | Samnang | 🔴 | 0.25d | S17 |
| ✅ | 8.1.3 | Create migration `20260419000002-add-recovery-codes-column` | Samnang | 🔴 | 0.25d | S17 |

### 8.2 Backend — Controller & Routes `Done` — `5 / 5 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 8.2.1 | Create `twoFactorController.js` — `setup()`: generate TOTP secret, save to DB, return QR code data URL | Samnang | 🔴 | 0.5d | S17 |
| ✅ | 8.2.2 | `verifySetup()`: confirm first OTP, enable 2FA, generate & store 8 hashed recovery codes, return plain codes once | Samnang | 🔴 | 0.5d | S17 |
| ✅ | 8.2.3 | `verify()`: login OTP verification with tempToken + recovery code fallback (single-use, removed after use) | Samnang | 🔴 | 0.5d | S17 |
| ✅ | 8.2.4 | `disable()`, `status()` (with `recoveryCodesRemaining`), `regenerateRecovery()` (password-protected) | Samnang | 🟠 | 0.5d | S17 |
| ✅ | 8.2.5 | Register all 2FA routes in `routes/auth.js` (setup, verify-setup, verify, disable, status, regenerate-recovery) | Samnang | 🟠 | 0.25d | S17 |

### 8.3 Backend — Login Flow Modification `Done` — `2 / 2 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 8.3.1 | Modify `authController.login()`: if `twoFactorEnabled`, issue 5-min `tempToken` (`{id, requires2FA}`) instead of real tokens | Samnang | 🔴 | 0.5d | S17 |
| ✅ | 8.3.2 | `twoFactorController.verify()`: decode tempToken, verify OTP/recovery, issue real access+refresh tokens with full user payload | Samnang | 🔴 | 0.5d | S17 |

### 8.4 Dashboard — Proxy & Auth `Done` — `3 / 3 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 8.4.1 | Fix login proxy (`/api/auth/login/route.ts`): pass through `requires2FA` response before token validation | Samnang | 🔴 | 0.25d | S17 |
| ✅ | 8.4.2 | Create 2FA catch-all proxy (`/api/auth/2fa/[...path]/route.ts`): forward requests, set httpOnly cookies on verify success | Samnang | 🔴 | 0.5d | S17 |
| ✅ | 8.4.3 | Update `useAuth.complete2FA()` to support OTP and recovery code paths | Samnang | 🟠 | 0.25d | S17 |

### 8.5 Dashboard — Settings UI `Done` — `3 / 3 done`

| Status | # | Task | Assignee | Priority | Est. | Sprint |
|---|---|---|---|---|---|---|
| ✅ | 8.5.1 | Create Settings page (`/dashboard/settings`) with TwoFactorCard component | Samnang | 🟠 | 0.5d | S17 |
| ✅ | 8.5.2 | TwoFactorCard: QR setup → OTP verify → recovery codes display (copy/download) → disable (password) → regenerate codes | Samnang | 🔴 | 1d | S17 |
| ✅ | 8.5.3 | Login page: 2FA OTP screen with 6-digit input + "Use recovery code" toggle + recovery code input | Samnang | 🔴 | 0.5d | S17 |

**Deliverables:**
- **TOTP 2FA** — Full setup/verify/disable lifecycle using `speakeasy` + `qrcode`
- **Recovery codes** — 8× `XXXX-XXXX` codes, SHA-256 hashed in DB, single-use, regeneratable with password
- **Login flow** — Password → tempToken (5min) → OTP or recovery code → real JWT tokens + httpOnly cookies
- **Settings page** — `/dashboard/settings` with TwoFactorCard (6 steps: idle/qr/verify/recovery/disable/regenerate)
- **Toast notifications** — Sonner toasts for all 2FA success/error actions
- **RTK Query endpoints** — `twoFASetup`, `twoFAVerifySetup`, `twoFAVerify`, `twoFADisable`, `twoFAStatus`, `regenerateRecovery`

### 📋 2FA Step-by-Step Process

#### 🔧 Setup Flow (Settings → Set Up 2FA)
```
1. User clicks "Set Up 2FA" in Settings
2. POST /api/auth/2fa/setup (authenticated)
   → Backend generates TOTP secret via speakeasy
   → Saves secret to user.twoFactorSecret (NOT yet enabled)
   → Returns { qrCode (data URL), secret (base32), otpauthUrl }
3. User scans QR code with authenticator app (Google Authenticator / Authy)
4. User enters 6-digit OTP from app
5. POST /api/auth/2fa/verify-setup { token: "123456" }
   → Backend verifies OTP against stored secret (window: ±2 steps)
   → Sets twoFactorEnabled = true
   → Generates 8 recovery codes (crypto.randomBytes, format XXXX-XXXX)
   → Stores SHA-256 hashes in user.recoveryCodes (JSON array)
   → Returns plain codes ONCE to the user
6. User saves recovery codes (copy to clipboard / download .txt file)
```

#### 🔐 Login Flow (with 2FA enabled)
```
1. User enters email + password
2. POST /api/auth/login
   → Backend validates credentials
   → Detects twoFactorEnabled = true
   → Signs tempToken = JWT { id, requires2FA: true } (5min expiry)
   → Returns { requires2FA: true, tempToken, hasFaceEnrolled }
   → Dashboard login proxy passes this through (no cookie set yet)
3. Dashboard shows 2FA verification screen (6-digit OTP boxes)
4. User enters OTP from authenticator app
5. POST /api/auth/2fa/verify { token: "123456", tempToken: "eyJ..." }
   → Backend decodes tempToken, verifies requires2FA claim
   → Verifies OTP via speakeasy (window: ±3 steps)
   → Issues real accessToken (30d) + refreshToken (60d)
   → Next.js proxy sets httpOnly cookies, strips refreshToken from body
   → Dashboard dispatches setCredentials, redirects to /dashboard
```

#### 🆘 Recovery Code Login (lost authenticator)
```
1. User enters email + password → gets tempToken (same as above)
2. User clicks "Lost your phone? Use a recovery code"
3. User enters recovery code (format: XXXX-XXXX)
4. POST /api/auth/2fa/verify { recoveryCode: "A1B2-C3D4", tempToken: "eyJ..." }
   → Backend hashes incoming code with SHA-256
   → Matches against stored hashes array
   → If found: removes used code from array, issues real tokens
   → If not found: returns 401 "Invalid recovery code"
5. Login proceeds normally (user should re-setup 2FA or regenerate codes)
```

#### ♻️ Regenerate Recovery Codes
```
1. User clicks "Regenerate Recovery Codes" in Settings
2. User confirms with account password
3. POST /api/auth/2fa/regenerate-recovery { password: "..." }
   → All old codes invalidated
   → 8 new codes generated, hashed, stored
   → Plain codes returned to user
4. User saves new codes (old codes no longer work)
```

#### 🚫 Disable 2FA
```
1. User clicks "Disable 2FA" in Settings
2. User confirms with account password
3. POST /api/auth/2fa/disable { password: "..." }
   → Clears twoFactorEnabled, twoFactorSecret, recoveryCodes, faceDescriptor
   → Next login will skip 2FA entirely
```

---

## Backlog — Future Enhancements (v2.0+)

> **Priority key:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low  
> **Status key:** ✅ Done · 🔄 In Progress · 📋 Planned · ⬜ Backlog

| Status | # | Feature | Priority | Complexity | Target |
|---|---|---|---|---|---|
| ✅ | B.4 | Reading goals & achievements (gamification) | 🟡 | Medium | v1.1 |
| ✅ | B.5 | Book collections / curated playlists by professors | 🟡 | Medium | v1.1 |
| ✅ | B.9 | Multi-language UI — Khmer (km) & English (en) i18n | 🟠 | High | v1.1 |
| ✅ | B.15 | Push Notifications (Web Push API) | 🟠 | Medium | v1.1 |
| ✅ | B.16 | User Reviews & Star Ratings for Books | 🟡 | Low | v1.1 |
| ✅ | B.17 | User Feedback / Bug Report System | 🟡 | Low | v1.1 |
| ✅ | B.18 | Two-Factor Authentication (TOTP + Face) | 🟠 | High | v1.1 |
| ✅ | B.19 | Social OAuth Login (Google · Facebook · GitHub) | 🟠 | Medium | v1.1 |
| ✅ | B.20 | AI Book Summary per book page (`GET /books/:id/summary`) | 🟡 | Low | v1.1 |
| 🔄 | B.11 | Offline reading (PWA with service workers) | 🟠 | High | v2.0 |
| 📋 | B.7  | Annotation & highlighting in PDF reader | 🟠 | High | v2.0 |
| 📋 | B.13 | Analytics export (PDF/Excel reports for admin) | 🟠 | Medium | v2.0 |
| 📋 | B.8  | Bulk book import via CSV/Excel | 🟡 | Low | v2.0 |
| 📋 | B.12 | Book request system (students request new books) | 🟡 | Low | v2.0 |
| 📋 | B.21 | Physical library check-in / check-out via Code ID scan | 🟠 | Medium | v2.0 |
| 📋 | B.22 | Book return management & due-date reminders | 🟡 | Medium | v2.0 |
| 📋 | B.23 | Library payment / fine tracking system | 🟡 | Medium | v2.0 |
| 📋 | B.24 | Admin approval workflow for new student accounts | 🟡 | Low | v2.0 |
| ⬜ | B.6  | Mobile app (React Native) | 🟢 | High | v3.0 |
| ⬜ | B.10 | Integration with Norton LMS / student portal | 🟡 | High | v3.0 |
| ⬜ | B.14 | Real-time collaborative study notes | 🟢 | High | v3.0 |
| ⬜ | B.25 | AI-powered quiz generation from PDF content | 🟢 | High | v3.0 |
| ⬜ | B.26 | Book citation generator (APA / MLA / Chicago) | 🟢 | Low | v3.0 |
| ⬜ | B.27 | Multi-campus support (branch libraries) | 🟢 | High | v3.0 |

---

### 🔄 B.11 — Offline Reading (PWA + Service Workers)

**Goal:** Allow students to cache books for offline reading using browser service workers and IndexedDB.

| Sub-task | Description | Assignee | Est. |
|---|---|---|---|
| B.11.1 | Upgrade `frontend/` to full PWA (manifest, icons, install prompt) | Dok Dara | 1d |
| B.11.2 | Implement service worker caching strategy (Cache-First for assets, Network-First for API) | Chan Samnang | 2d |
| B.11.3 | Add "Save for offline" button on book detail page — fetch & store PDF blob in IndexedDB | Rorsat Sorphiny | 2d |
| B.11.4 | Offline book shelf UI in `/library` — show cached books with offline badge | Dok Dara | 1d |
| B.11.5 | Background sync — sync reading progress when connection restores | Chan Samnang | 1d |
| B.11.6 | Storage management UI — view cached size, remove individual books | Rorsat Sorphiny | 1d |
| B.11.7 | Test across Chrome, Firefox, Safari (iOS) | All | 1d |

**Dependencies:** Requires R2 CORS config to allow direct blob fetch from browser.

---

### 📋 B.13 — Analytics Export (PDF / Excel Reports)

**Goal:** Admin and Librarian can export dashboard data as downloadable PDF or Excel reports.

| Sub-task | Description | Assignee | Est. |
|---|---|---|---|
| B.13.1 | Backend: `GET /api/stats/export?format=xlsx` — generate Excel with `exceljs` | Hoeung Phearun | 2d |
| B.13.2 | Backend: `GET /api/stats/export?format=pdf` — generate PDF with `pdfkit` or `puppeteer` | Chan Samnang | 2d |
| B.13.3 | Report templates: Overview summary, Top books, User activity, Category distribution | Chan Samnang | 1d |
| B.13.4 | Backend: `GET /api/downloads/export` — full download log as Excel | Hoeung Phearun | 1d |
| B.13.5 | Backend: `GET /api/activities/export` — activity audit log as Excel | Hoeung Phearun | 1d |
| B.13.6 | Dashboard UI: Export button on Overview page with format selector (PDF / Excel) | Rorsat Sorphiny | 1d |
| B.13.7 | Dashboard UI: Export button on Download Stats table | Dok Dara | 0.5d |
| B.13.8 | Add export permission: `stats.export` — Admin + Librarian only | Chan Samnang | 0.5d |

**Libraries:** `exceljs` for Excel · `pdfkit` or `puppeteer` for PDF · `date-fns` for date ranges.

---

### ⬜ B.14 — Real-time Collaborative Study Notes

**Goal:** Students can create shared note documents linked to a book, editing simultaneously with real-time sync.

| Sub-task | Description | Assignee | Est. |
|---|---|---|---|
| B.14.1 | DB model: `StudyNote { id, bookId, title, content(CRDT), createdBy, isPublic }` | TBD | 1d |
| B.14.2 | DB model: `StudyNoteCollaborator { noteId, userId, role: owner/editor/viewer }` | TBD | 0.5d |
| B.14.3 | Backend: REST CRUD for notes (`/api/notes`) | TBD | 2d |
| B.14.4 | Backend: Socket.IO room per note — broadcast delta ops (Yjs / ShareDB) | Chan Samnang | 3d |
| B.14.5 | Frontend: Rich text editor (TipTap or BlockNote) with collaborative plugin | Dok Dara | 3d |
| B.14.6 | Frontend: Note panel alongside PDF reader (split view) | Dok Dara | 2d |
| B.14.7 | Frontend: Collaborator invite by email / username | Rorsat Sorphiny | 1d |
| B.14.8 | Presence indicators — show active users per note | Rorsat Sorphiny | 1d |
| B.14.9 | Note history / version restore | TBD | 2d |

**Dependencies:** Socket.IO (already integrated) · Yjs or ShareDB for CRDT · TipTap editor.

---

### 📋 B.21 — Physical Library Check-in / Check-out (Code ID Scan)

**Goal:** Librarian scans student Code ID (barcode / QR) to record physical library entry/exit. Admin can review all entry/exit data.

| Sub-task | Description | Assignee | Est. |
|---|---|---|---|
| B.21.1 | DB model: `LibraryEntry { id, userId, studentCode, entryTime, exitTime, recordedBy }` | TBD | 0.5d |
| B.21.2 | Backend: `POST /api/library-entries/scan` — lookup student by code, create entry record | TBD | 1d |
| B.21.3 | Backend: `PATCH /api/library-entries/:id/checkout` — stamp exit time | TBD | 0.5d |
| B.21.4 | Backend: `GET /api/library-entries` — paginated list (Admin/Librarian) | TBD | 0.5d |
| B.21.5 | Dashboard: Scan UI — camera / barcode reader input field, student info preview card | Dok Dara | 2d |
| B.21.6 | Dashboard: Entry/Exit log table with date filter and export | Dok Dara | 1d |
| B.21.7 | Dashboard: Live occupancy counter (students currently inside) | Rorsat Sorphiny | 1d |

---

### 📋 B.22 — Book Return Management & Due-date Reminders

**Goal:** Track physical book loans, due dates, and send email reminders to students. Admin approves returns.

| Sub-task | Description | Assignee | Est. |
|---|---|---|---|
| B.22.1 | DB model: `BookLoan { id, userId, bookId, loanedAt, dueDate, returnedAt, approvedBy }` | TBD | 0.5d |
| B.22.2 | Backend: `POST /api/loans` — create loan (Librarian) | TBD | 1d |
| B.22.3 | Backend: `PATCH /api/loans/:id/return` — Admin approves return | TBD | 0.5d |
| B.22.4 | Backend: Cron job — daily check for overdue loans → send reminder email (Nodemailer) | Chan Samnang | 1d |
| B.22.5 | Dashboard: Loan management table — active, overdue, returned | Dok Dara | 1.5d |
| B.22.6 | Student Frontend: "My Borrowed Books" tab in `/library` | Rorsat Sorphiny | 1d |

---

### 📋 B.23 — Library Payment / Fine Tracking

**Goal:** Record and track library fees (late return fines, printing fees, etc.). Admin reviews all payment records.

| Sub-task | Description | Assignee | Est. |
|---|---|---|---|
| B.23.1 | DB model: `LibraryFine { id, userId, loanId, amount, reason, paidAt, status }` | TBD | 0.5d |
| B.23.2 | Backend: Auto-calculate fine on overdue return (configurable daily rate via Settings) | Chan Samnang | 1d |
| B.23.3 | Backend: `PATCH /api/fines/:id/pay` — mark fine as paid | TBD | 0.5d |
| B.23.4 | Backend: `GET /api/fines` — list all fines with filters (Admin) | TBD | 0.5d |
| B.23.5 | Dashboard: Fine management table — pending, paid, waived | Dok Dara | 1d |
| B.23.6 | Dashboard: Revenue summary card in Overview (total collected this month) | Rorsat Sorphiny | 0.5d |

---

---

## 👥 Developer Workload Detail

### 🧑‍💻 Chan Samnang — Backend Lead · DevOps

> Progress: `████████████████████` &nbsp; **58 / 58 tasks — 100%**

| Phase | Key Tasks | Days |
|---|---|---|
| Phase 1 | Env setup, DB models, JWT auth, middleware, books/users CRUD, R2 uploads, PDF proxy, stats | ~26d |
| Phase 3 | PDF reader integration (3.5.1–6) | ~4d |
| Phase 4 | Gemini AI integration, recommendations, cache, vector search (4.1.1–4, 4.1.7–8, 4.2.1–3) | ~10d |
| Phase 5 | Auth/middleware tests, AI tests, DB optimization, security audit (5.1.1, 5.1.3, 5.1.5, 5.3.1, 5.4.x) | ~7.5d |
| Phase 6 | Render setup, DB prod, domains, CORS, E2E tests, SSL (6.1.1–6, 6.2.3–4, 6.2.6, 6.3.x) | ~6.5d |

---

### 👨‍💻 Hoeung Phearun — Backend Developer

> Progress: `████████████████████` &nbsp; **32 / 32 tasks — 100%**

| Phase | Key Tasks | Days |
|---|---|---|
| Phase 1 | R2 config, DB models (Book, Author, etc.), CRUD (roles/cats/authors…), avatars, stats (1.1.3, 1.2.4–8, 1.5.3–11, 1.6.4–8) | ~17.5d |
| Phase 4 | Trending AI, similar books, rate limits, Socket.IO, vector sync (4.1.5–6, 4.1.9–10, 4.2.4, 4.3.x) | ~5d |
| Phase 5 | Book/user controller tests, file upload tests, Postman, security (5.1.2, 5.1.4, 5.1.6–7, 5.4.2–3, 5.4.5) | ~7d |
| Phase 6 | AI & data seed verification (6.3.5–6) | ~1.5d |

---

### 🎨 Dok Dara — Frontend Lead · UI/UX

> Progress: `████████████████████` &nbsp; **49 / 49 tasks — 100%**

| Phase | Key Tasks | Days |
|---|---|---|
| Phase 2 | Dashboard setup, sidebar, book table/forms, user table/forms, profile, charts (2.1–2.7) | ~21d |
| Phase 3 | Frontend setup, Navbar, Hero, Featured Books, Book Catalog, Detail, Library tabs, About/Contact pages (3.1–3.8) | ~20d |
| Phase 4 | Scan-search UI (4.2.5) | ~1d |
| Phase 5 | Book CRUD tests, user mgmt tests, cross-browser, mobile, image optimize, skeletons (5.2.2–3, 5.2.6–7, 5.3.2–3) | ~5d |
| Phase 6 | Vercel frontend deploy, env vars, E2E smoke tests (6.2.1, 6.2.5, 6.3.1–2) | ~2d |

---

### 👩‍💻 Rorsat Sorphiny — Frontend Developer

> Progress: `████████████████████` &nbsp; **41 / 41 tasks — 100%**

| Phase | Key Tasks | Days |
|---|---|---|
| Phase 2 | Redux/RTK Query setup, auth pages, overview API, activity feed, file upload UI, user role assignment, Sentry (2.1–2.7) | ~18d |
| Phase 3 | Redux/RTK setup, token refresh, Sign In/Up, Forgot Password, pagination, book API slice, library/profile (3.1–3.8) | ~16d |
| Phase 5 | Auth flow tests, PDF reader tests, library tests, bundle optimize, Lighthouse (5.2.1, 5.2.4–5, 5.3.4–5) | ~4.5d |
| Phase 6 | Admin dashboard deploy, Sentry verify, E2E smoke tests (6.2.2, 6.3.1–2, 6.3.7) | ~2d |

---

> **📌 How to update progress:**
> 1. Check off tasks: `⬜` → `🔄` → `✅`
> 2. Update the **Done** number in each section header (e.g. `3 / 8 done`)
> 3. Update the **Overall Project Progress** table at the top
> 4. Copy the matching progress bar from the key at the top

> **© 2026 Norton University E-Library · Phnom Penh, Cambodia**
