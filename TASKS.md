# Norton E-Library — Current Task Tracker

> **Version:** 2.0
> **Last code audit:** August 2, 2026
> **Status basis:** A task is marked implemented only when supporting code is present in the local repositories. Production state was not externally verified.

## Status legend

| Status | Meaning |
|---|---|
| ✅ | Implemented in the repository |
| 🔄 | Partially implemented or split between local/server behavior |
| ⬜ | Not found in the repository |
| ⚠️ | Implemented but needs correctness/security follow-up |

## 1. Backend API

### Runtime and operations

| Status | Task | Evidence |
|---|---|---|
| ✅ | Express API and Socket.IO server | `src/index.js`, `src/utils/socket.js` |
| ⚠️ | Reproducible Express installation | `express` is imported but absent from root `package.json`/lockfile dependencies |
| ✅ | PostgreSQL/Sequelize connection with retry | `src/config/database.js`, `src/index.js` |
| ✅ | Versioned Sequelize migrations | `src/migrations/` through July 28, 2026 |
| ✅ | Docker development/deployment assets | `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh` |
| ✅ | Backup and restore scripts | `scripts/backup-db.sh`, `scripts/restore-db.sh` |
| ✅ | Health/monitoring scripts | `scripts/health-check.sh`, `scripts/monitor-prod.sh` |
| ⬜ | Automated backend test suite | No project-owned `test`/`spec` files found |

### Authentication and authorization

| Status | Task | Evidence |
|---|---|---|
| ✅ | Register, login, refresh, logout, profile, avatar, password change | `/api/auth/*` |
| ✅ | Email OTP password reset | check email, send OTP, verify OTP, reset password routes |
| ✅ | JWT roles and direct/role permissions | users/roles/permissions models, middleware, and routes |
| ✅ | Google, Facebook, and GitHub OAuth | Passport strategies and callback routes |
| ✅ | TOTP 2FA and recovery codes | setup, verify, disable, status, regenerate routes |
| ✅ | Face descriptor enrollment/verification API | `/api/auth/2fa/face/*` |
| ✅ | Admin 2FA login/settings UI | admin auth proxy, login page, settings components |
| 🔄 | Student 2FA UI | Backend supports it; student proxy/UI was not found |

### Catalog and media

| Status | Task | Evidence |
|---|---|---|
| ✅ | Book CRUD, soft delete, pagination, search, filters, sort | `bookController.js`, `/api/books` |
| ✅ | Category, author, editor, department, material type CRUD protection | Public reads and permission-protected mutations |
| ⚠️ | Publisher CRUD protection | Publisher mutation routes currently have no auth/permission middleware |
| ✅ | R2 covers, PDFs, avatars, video, and audio | Upload and download controllers/utilities |
| ✅ | Authenticated PDF download tracking | `downloads` model and download routes |
| ✅ | Public PDF stream and cover access | `/api/books/:id/stream`, `/cover` |
| ✅ | Signed PDF/video/audio URL endpoints | `/pdf-url`, `/video-url`, `/audio-url` |
| ✅ | View, download, and share counters | Book controller/model fields |
| ✅ | Visual cover-search API and vector sync | `/api/books/scan-search`, vector service utility |
| ⬜ | Student scan-search UI | No cover scan/upload search UI found |

### Reading features

| Status | Task | Evidence |
|---|---|---|
| ✅ | `reading_progress`, `bookmarks`, `reading_notes` migration | `20260728000001-create-reading-features.js` |
| ✅ | Account-scoped reading progress GET/PUT | `/api/books/:bookId/reading-progress` |
| ✅ | Account-scoped page bookmark list/create/delete | `/api/books/:bookId/bookmarks` |
| ✅ | Account-scoped reading note list/create/update/delete | `/api/books/:bookId/notes` |
| ✅ | Reading/Completed library aggregation | `/api/library/reading-progress` |
| ✅ | Positive page/range/uniqueness checks | Migration and validation middleware |
| ✅ | PDF reader progress debounce and final flush | Student `PdfReader.tsx` |
| ✅ | PDF selection, highlights, notes, and bookmark navigation | Student reading components |
| ✅ | Citation generation after completion | APA, MLA, Chicago, IEEE; copy/download |
| ⬜ | Automated reading ownership/E2E tests | No test files found |

### Reviews, feedback, AI, and notifications

| Status | Task | Evidence |
|---|---|---|
| ✅ | Review create/read/update/delete and statistics | review routes/controller/model |
| ✅ | Anonymous/authenticated feedback plus admin workflow | feedback routes/controller/model |
| ✅ | AI recommendations, trending, similar, personalized, chat | `/api/ai/recommendations/*` |
| ✅ | Per-book Gemini summary | `/api/books/:id/summary` |
| ✅ | Web Push VAPID key, subscribe, unsubscribe | `/api/push/*` |
| 🔄 | Notification-type preferences | Subscription lifecycle exists; category preferences do not |
| ✅ | Socket.IO admin and broadcast events | activity/book/review/feedback emitters |

## 2. Admin dashboard

| Status | Task | Current route or module |
|---|---|---|
| ✅ | Login, forgot/reset password, token refresh, logout | `src/app/(auth)`, `src/app/api/auth` |
| ✅ | TOTP/recovery-code login and settings | 2FA catch-all proxy and auth/settings UI |
| ✅ | Dashboard analytics | `/dashboard/overview` and parallel chart routes |
| ✅ | Book CRUD, details, and reader | `/dashboard/books/*` |
| ✅ | Categories, departments, material types, publishers, authors, editors | Catalog sub-routes and service modules |
| ✅ | User CRUD, roles, and permissions | `/dashboard/users/*` |
| ✅ | Download administration | `/dashboard/downloads` |
| ✅ | Review administration | `/dashboard/reviews` |
| ✅ | Feedback workflow | `/dashboard/feedback` |
| ✅ | Profile and settings | `/dashboard/profile`, `/dashboard/settings` |
| ✅ | Audit logs | `/dashboard/audit-logs` |
| ✅ | Realtime notification state | Socket client and notification slice |
| ⬜ | Automated admin tests | No project-owned test/spec files found |
| ⚠️ | Remove unused placeholder documentation/config | Clerk/billing/sample content remains under `src/config` and `src/constants` |

## 3. Student frontend

| Status | Task | Current route or module |
|---|---|---|
| ✅ | Home page, statistics, featured books/video/audio | `/` and `components/home` |
| ✅ | Searchable/sortable/paginated book catalog | `/books` |
| 🔄 | Full advanced filter UI | Backend supports more filters than the current search/category/sort UI |
| ✅ | Book details, reviews, AI summary, related books | `/books/[id]` |
| ✅ | QR/social/copy sharing and share counter | Book detail share UI and proxy |
| ✅ | Public author directory and detail pages | `/authors`, `/authors/[authorId]` |
| ✅ | Video and audio catalog pages | `/videos`, `/audios` |
| ✅ | PDF reader and authenticated download | `/books/[id]/read` |
| ✅ | Server-backed progress/bookmarks/notes | `readingApi.ts` and Next.js proxy routes |
| ✅ | Reading and Completed library tabs | `/library` |
| 🔄 | Favorites and recent history | Implemented per user in browser `localStorage`, not synced to PostgreSQL |
| ✅ | Profile, avatar, and password management | `/profile` |
| ✅ | Email/password auth, reset flow, OAuth callback | `/auth/*` |
| ✅ | Reviews and feedback submission | Review and feedback API slices/routes |
| ✅ | Web Push UI and subscription proxies | Push notification component/routes |
| ✅ | SEO metadata, robots, sitemap, Open Graph, schema | app routes and SEO helpers |
| ⬜ | Automated student tests | No project-owned test/spec files found |

## 4. Database

### Current tables

| Group | Tables |
|---|---|
| Users/RBAC | `users`, `roles`, `permissions`, `users_roles`, `roles_permissions`, `users_permissions` |
| Catalog | `books`, `categories`, `publishers`, `departments`, `material_types`, `authors`, `editors` |
| Catalog relations | `books_authors`, `books_editors`, `publishers_books` |
| User/book activity | `downloads`, `reviews`, `bookmarks`, `reading_progress`, `reading_notes` |
| System | `activities`, `settings`, `feedbacks`, `push_subscriptions` |

Total: **25 application tables**.

### Database follow-up

| Status | Task |
|---|---|
| ✅ | Foreign keys and performance constraints/indexes in versioned migrations |
| ✅ | Category, department, and material type required for books |
| ✅ | Reading progress uniqueness and page/progress checks |
| ⬜ | Clean-database migration test in CI |
| ⬜ | Scheduled restore drill with recorded result |

## 5. Highest-priority open tasks

| Priority | ID | Task |
|---|---|---|
| P0 | SEC-01 | Add auth and book permission middleware to publisher mutations |
| P0 | DEP-01 | Declare Express in backend dependencies, refresh the lockfile, and verify a clean checkout |
| P0 | SEC-02 | Replace any usable secret in example environment files with placeholders and rotate it if necessary |
| P0 | ENV-01 | Complete environment templates for password reset, DB SSL, and Web Push variables |
| P0 | QA-01 | Add backend unit/integration test runner and CI |
| P0 | QA-02 | Add auth/RBAC/2FA and reading ownership tests |
| P1 | QA-03 | Add admin and student build/lint/E2E CI jobs |
| P1 | LIB-01 | Decide and implement cross-device favorites/history persistence |
| P1 | CAT-01 | Expose backend department/type/year/language/author filters in the student catalog |
| P1 | AUTH-01 | Add student 2FA UI if student accounts are expected to enable 2FA |
| P1 | SEARCH-01 | Add student visual cover scan-search UI |
| P2 | OPS-01 | Add structured liveness/readiness endpoints and alerting |
| P2 | CLEAN-01 | Remove unused admin starter-template/Clerk/billing content |

## 6. Validation commands

### Backend

```bash
cd elibrary-backend
npm install
npm run db:migrate:status
npm run db:migrate
npm start
```

### Admin dashboard

```bash
cd elibrary-admin
npm install
npm run build
```

### Student frontend

```bash
cd elibrary-frontend
npm install
npm run lint
npm run build
```

These commands validate installation/buildability only. Feature completion also
requires API, authorization, ownership, responsive, and browser checks described
in [PLAN.md](PLAN.md).

## 7. Documentation synchronization

| Status | Document |
|---|---|
| ✅ | `README.md` reflects current backend/database operations |
| ✅ | `PRD.md` describes the current three-application system |
| ✅ | `DIAGRAM.md` includes the current 25-table ERD and reading relationships |
| ✅ | `PLAN.md` uses current repository status and priorities |
| ✅ | `BACKLOG.md` distinguishes delivered, partial, and future features |
| ✅ | `docs/READING_FEATURES.md` documents the current reading implementation |
| ✅ | `../elibrary-frontend/README.md` lists current pages, proxies, and state ownership |
