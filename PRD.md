# Norton E-Library — Product Requirements Document

> **Version:** 2.0
> **Last updated:** August 2, 2026
> **Status:** Current implementation baseline
> **Scope:** `elibrary-backend`, `elibrary-admin`, and `elibrary-frontend`

## Table of contents

1. [Product overview](#1-product-overview)
2. [Applications and stack](#2-applications-and-stack)
3. [Users and authorization](#3-users-and-authorization)
4. [Student frontend requirements](#4-student-frontend-requirements)
5. [Admin dashboard requirements](#5-admin-dashboard-requirements)
6. [Backend requirements](#6-backend-requirements)
7. [Database model](#7-database-model)
8. [API surface](#8-api-surface)
9. [Authentication and state](#9-authentication-and-state)
10. [Media, AI, and realtime services](#10-media-ai-and-realtime-services)
11. [Non-functional requirements](#11-non-functional-requirements)
12. [Environment and deployment](#12-environment-and-deployment)
13. [Known limitations and next requirements](#13-known-limitations-and-next-requirements)
14. [Acceptance criteria](#14-acceptance-criteria)

## 1. Product overview

Norton E-Library is a three-application digital library platform for students,
librarians, and administrators. It manages digital books and academic media,
supports secure reading and downloads, tracks account-scoped reading activity,
and provides catalog administration, analytics, reviews, feedback, AI features,
and notifications.

### Product goals

- Give students responsive, searchable access to PDF, video, and audio material.
- Preserve reading progress, completion, page bookmarks, and personal notes
  across signed-in sessions.
- Give librarians/admins controlled catalog and user-management workflows.
- Enforce granular roles and permissions at the API boundary.
- Keep large media in Cloudflare R2 rather than PostgreSQL.
- Maintain database evolution through migrations and recoverable backups.
- Provide useful discovery through authors, categories, related books, ratings,
  AI summaries/recommendations, and sharing.

### Out of current scope

- Physical loans, reservations, returns, fines, and entry/exit scanning.
- Native iOS/Android applications.
- Cross-device favorites and recent-history synchronization.
- Collaborative multi-user notes.
- Full offline PDF shelf and background sync.

## 2. Applications and stack

| Application | Directory | Stack | Default local port |
|---|---|---|---|
| Backend API | `elibrary-backend` | Node.js, Express, Sequelize 6, PostgreSQL, Socket.IO | 5005 |
| Admin dashboard | `elibrary-admin` | Next.js 16.2, React 19.2, TypeScript, Tailwind CSS 4, Redux Toolkit | 3001 |
| Student frontend | `elibrary-frontend` | Next.js 16.2, React 19.2, TypeScript, Tailwind CSS 4, Redux Toolkit | 3000 |

### Backend integrations

| Service | Purpose |
|---|---|
| Cloudflare R2 | Covers, PDFs, avatars, video, and audio |
| Google Gemini 2.0 Flash | Recommendations, chat, trend explanations, and book summaries |
| Gmail SMTP/Nodemailer | Password-reset OTP email |
| Passport | Google, Facebook, and GitHub OAuth |
| Web Push | Browser push subscriptions and broadcasts |
| Socket.IO | Admin activity and public book/review/feedback events |
| Vector search service | Cover indexing and image-based book matching |

## 3. Users and authorization

### Student/user

- Register and sign in with email/password credentials.
- Sign in using email, username, or student ID.
- Use Google, Facebook, or GitHub OAuth when configured.
- Browse/read books and media; authenticated users can download secured media.
- Maintain profile/avatar/password.
- Save local favorites/history and server-backed reading data.
- Create and manage their own reviews, bookmarks, and reading notes.
- Submit authenticated or anonymous feedback.

### Librarian

- Receives only the roles/permissions assigned by an administrator.
- Common catalog permissions are `books.view`, `books.create`, `books.update`,
  `books.delete`, and `books.download`.
- Can manage book metadata when the corresponding permission is present.

### Administrator

- Manages users, roles, permissions, catalog, reviews, feedback, settings, and
  audit data according to route middleware.
- Can use the admin 2FA setup/login/recovery workflow.

### Seeded permission names

```text
users.view          users.create          users.update          users.delete
roles.view          roles.create          roles.update          roles.delete
permissions.view    permissions.create    permissions.update    permissions.delete
permissions.assign
books.view          books.create          books.update          books.delete
books.download
```

## 4. Student frontend requirements

### Public routes

| Route | Requirement |
|---|---|
| `/` | Hero/search, featured books, featured video/audio, public statistics, categories, testimonials, and calls to action |
| `/books` | Search, category filter, sorting, pagination, grid/list presentation |
| `/books/[id]` | Full metadata, ratings/reviews, media actions, AI summary, related books, citations, share UI |
| `/books/[id]/read` | PDF reader with progress, completion, bookmarks, text selection, highlights, and notes |
| `/authors` | Author directory |
| `/authors/[authorId]` | Author profile and books |
| `/videos` | Video-capable catalog materials |
| `/audios` | Audio-capable catalog materials |
| `/about` | Project information |
| `/contact` | Contact, FAQ, and feedback form |

### Account routes

| Route | Requirement |
|---|---|
| `/library` | Favorites, Reading, Completed, and History tabs; reading cards show counts and resume page |
| `/profile` | Update profile, avatar, and password; list personal reviews |
| `/auth/signin` | Password and social sign-in |
| `/auth/signup` | Student registration |
| `/auth/forgot-password` | Email and OTP request/verification flow |
| `/auth/reset-password` | Reset-token password update |
| `/auth/callback` | OAuth token handoff to secure cookies |

### Reading behavior

- The reader obtains the real page count from PDF.js.
- An explicit `?page=` parameter takes priority over server progress and then
  the local fallback.
- Progress writes are debounced and pending changes flush on visibility loss or
  unmount.
- Each account has at most one progress record per book and one bookmark per
  book/page.
- Notes store selected text, optional note text, page, and one of five colors:
  yellow, green, blue, pink, or purple.
- Completed books expose APA, MLA, Chicago, and IEEE citation generation with
  clipboard and text-file output.

### Persistence boundary

| Data | Persistence |
|---|---|
| Reading progress/completion | PostgreSQL through `/api/books/:id/reading-progress` |
| Page bookmarks | PostgreSQL through `/api/books/:id/bookmarks` |
| Reading notes/highlights | PostgreSQL through `/api/books/:id/notes` |
| Reading/Completed library | PostgreSQL aggregation through `/api/library/reading-progress` |
| Favorites | Per-user browser `localStorage` |
| Recently viewed history | Per-user browser `localStorage` |
| Reading time and fallback progress | Redux state persisted per user in `localStorage` |

## 5. Admin dashboard requirements

| Route | Requirement |
|---|---|
| `/dashboard/overview` | Summary statistics and chart panels |
| `/dashboard/books` | Searchable/paginated book CRUD table |
| `/dashboard/books/[bookId]` | Book detail |
| `/dashboard/books/[bookId]/read` | Admin PDF reader |
| `/dashboard/books/categories` | Category CRUD |
| `/dashboard/books/departments` | Department CRUD |
| `/dashboard/books/material-types` | Material type CRUD |
| `/dashboard/books/publishers` | Publisher CRUD |
| `/dashboard/books/authors` | Author CRUD and details |
| `/dashboard/books/editors` | Editor CRUD |
| `/dashboard/users` | User CRUD and activation state |
| `/dashboard/users/roles` | Role CRUD and permission assignment |
| `/dashboard/users/permissions` | Permission CRUD and role assignment |
| `/dashboard/downloads` | Download records and statistics |
| `/dashboard/reviews` | Review search, filtering, statistics, and moderation |
| `/dashboard/feedback` | Feedback statistics, detail, status, resolver, and admin notes |
| `/dashboard/settings` | System settings UI and 2FA management |
| `/dashboard/profile` | Admin/librarian profile and password management |
| `/dashboard/audit-logs` | Administrative activity log |

The dashboard must support responsive navigation, loading/empty/error states,
theme switching, toast feedback, protected routing, and HTTP-only token cookies.
The access token may also exist only in Redux memory for direct protected API
calls; the refresh token must remain cookie-only.

## 6. Backend requirements

### API conventions

- REST API base path: `/api`.
- JSON responses use `{ success, message?, data? }` or
  `{ success: false, error: { code, message, details } }`.
- List endpoints use server-side pagination where supported.
- Authentication uses `Authorization: Bearer <accessToken>` at Express.
- `authenticateStream` also accepts a query token for compatible download
  navigation, while Next.js proxies prefer cookie-to-header forwarding.
- All per-user reading operations take the user ID from the verified token.

### Catalog requirements

- Books require title, category, department, and material type.
- Search covers English/Khmer title, ISBN, year, and author name.
- Backend filters include category, publisher, department, material type,
  publication year/range, language, author, active state, video, and audio.
- Sort is restricted to an allowlist, with stable ID tie-breaking.
- Book detail includes category, publisher, department, material type, authors,
  editors, additional publishers, average rating, and review count.
- Create/update can accept cover, PDF, video, and audio multipart files.
- Deletion is soft for books and users; review deletion is soft.

### Ownership and integrity

- Users can update/delete only their own reviews unless privileged by controller
  policy.
- Reading progress, bookmarks, and notes are always filtered by both user and
  book; a client cannot provide another user ID.
- Foreign keys cascade user/book reading data on deletion.
- Unique and check constraints enforce valid reading state.

## 7. Database model

The current schema contains **25 application tables**.

### Users and RBAC

| Table | Purpose |
|---|---|
| `users` | Credentials, OAuth identity, student/profile data, status, 2FA secrets/descriptors/recovery codes, timestamps |
| `roles` | Named roles |
| `permissions` | Named granular permissions |
| `users_roles` | User-to-role many-to-many mapping |
| `roles_permissions` | Role-to-permission mapping |
| `users_permissions` | Direct user permission mapping |

### Catalog

| Table | Purpose |
|---|---|
| `books` | Titles, ISBN/year/description, cover/PDF/media URLs, page/counter/language fields, classifications, status, timestamps |
| `categories` | English/Khmer category metadata |
| `publishers` | English/Khmer publisher and contact metadata |
| `departments` | Department code and English/Khmer metadata |
| `material_types` | Book/thesis/journal/etc. classification |
| `authors` | English/Khmer author metadata |
| `editors` | English/Khmer editor metadata |
| `books_authors` | Book-author mapping with primary-author flag |
| `books_editors` | Book-editor mapping |
| `publishers_books` | Additional book-publisher mapping |

### User/book activity

| Table | Purpose | Key rule |
|---|---|---|
| `downloads` | Authenticated download records | User and book foreign keys |
| `reviews` | Rating/comment with soft delete | Rating 1–5; one active review per user/book via DB index |
| `reading_progress` | Current/total page, percentage, last-read/completed timestamps | Unique user/book; valid page and 0–100 range checks |
| `bookmarks` | Named page bookmark | Unique user/book/page; positive page |
| `reading_notes` | Selected text, personal note, color, page | Positive page; account ownership |

### System

| Table | Purpose |
|---|---|
| `activities` | Actor/action/target audit events with JSON metadata |
| `settings` | Typed key/value configuration |
| `feedbacks` | Anonymous/account feedback, status, admin notes, resolver/timestamps |
| `push_subscriptions` | Unique browser endpoint and encryption keys |

The complete column-level ERD and relationship paths are maintained in
[DIAGRAM.md](DIAGRAM.md).

## 8. API surface

### Authentication: `/api/auth`

```text
POST /register                 POST /login
POST /refresh                  POST /logout
GET  /me                       GET  /profile
PATCH /profile                 GET|POST /avatar
PUT  /change-password
POST /check-reset-email        POST /forgot-password
POST /verify-otp               POST /reset-password

POST /2fa/setup                POST /2fa/verify-setup
POST /2fa/verify               POST /2fa/disable
GET  /2fa/status               POST /2fa/regenerate-recovery
POST /2fa/face/enroll          POST /2fa/face/verify

GET /google                    GET /google/callback
GET /facebook                  GET /facebook/callback
GET /github                    GET /github/callback
```

### Users and RBAC

```text
/api/users              list/get/create/update/delete, avatar, roles, permissions
/api/roles              CRUD and role permission assignment
/api/permissions        CRUD and permission role assignment
```

### Books and reading

```text
GET    /api/books
POST   /api/books
GET    /api/books/:id
PUT    /api/books/:id
DELETE /api/books/:id
POST   /api/books/scan-search
GET    /api/books/:id/summary
POST   /api/books/:id/share
GET    /api/books/:id/cover
GET    /api/books/:id/pdf-url
GET    /api/books/:id/video-url
GET    /api/books/:id/audio-url
GET    /api/books/:id/stream
GET    /api/books/:id/download
GET    /api/books/:id/downloads

GET|PUT    /api/books/:bookId/reading-progress
GET|POST   /api/books/:bookId/bookmarks
DELETE     /api/books/:bookId/bookmarks/:bookmarkId
GET|POST   /api/books/:bookId/notes
PATCH|DELETE /api/books/:bookId/notes/:noteId
GET        /api/library/reading-progress

GET|POST   /api/books/:bookId/reviews
```

### Other route groups

| Prefix | Current responsibility |
|---|---|
| `/api/categories` | Public reads; permission-protected mutations |
| `/api/authors` | Public reads; permission-protected mutations |
| `/api/editors` | Public reads; permission-protected mutations |
| `/api/publishers` | Public reads and currently unprotected mutations; protection is a P0 requirement |
| `/api/material-types` | Public reads; permission-protected mutations |
| `/api/departments` | Public reads; permission-protected mutations |
| `/api/uploads` | Authenticated single/multiple upload and delete |
| `/api/downloads` | Current-user downloads and protected admin lists/stats |
| `/api/stats` | Protected overview and public popular/recent/public stats |
| `/api/settings` | Authenticated read and permission-protected batch update |
| `/api/activities` | Admin-only audit listing |
| `/api/reviews` | Public testimonials, own reviews, protected admin list/stats, owner/admin mutation |
| `/api/feedback` | Optional-auth create, public testimonials, protected admin workflow |
| `/api/push` | Public VAPID key and authenticated subscribe/unsubscribe |
| `/api/ai/recommendations` | General, trending, similar, personalized, and chat recommendations |

## 9. Authentication and state

### Token lifecycle

- Access token default lifetime: 30 days.
- Refresh token default lifetime: 60 days.
- When 2FA is enabled, password login returns a short-lived temporary token;
  OTP or recovery verification exchanges it for real tokens.
- Admin and student Next.js auth routes encrypt tokens into HTTP-only cookies.
- Admin also returns the access token into Redux memory for direct Express calls;
  the refresh token is not returned to browser JavaScript.
- Student browser API calls primarily use same-origin Next.js proxies, which
  decrypt the access cookie server-side and attach the Bearer token.

### Password and reset behavior

- Passwords must be 8–20 characters and contain upper/lowercase letters, a
  number, and a special character.
- User creation currently hashes with bcrypt cost 12; password updates use cost
  10. This difference should be standardized during security hardening.
- Reset OTP/session tokens are signed using `FORGOT_PASSWORD_SECRET` combined
  with the current password hash, invalidating reset tokens after password change.

## 10. Media, AI, and realtime services

### Media

- Accepted cover/avatar types: JPEG, PNG, WebP.
- Accepted PDFs: `application/pdf`.
- Accepted video: MP4, MPEG, QuickTime, AVI, WebM.
- Accepted audio: MP3/MPEG, WAV, OGG, AAC, WebM.
- Avatar endpoints enforce 5 MB.
- Book upload middleware currently uses one global 500 MB Multer limit even
  though constants define intended image/PDF/video/audio limits. Per-field size
  enforcement is a required hardening task.

### AI

- Gemini endpoint: `gemini-2.0-flash:generateContent`.
- Recommendations are grounded in catalog records when possible.
- The API includes category/title/current-user modes, trending, similar,
  personalized, chat, and per-book summaries.
- Recommendation calls use an in-memory cache and AI-specific rate limiter.
- The vector integration synchronizes book covers on create/update/delete and
  supports cover-image search at `/api/books/scan-search`.

### Realtime and notifications

- Socket clients may join the `admin` room based on handshake metadata.
- Backend utilities emit admin-only activity events and public book/review/
  feedback notifications.
- Web Push stores a unique endpoint plus `p256dh`/`auth` keys.
- Subscribe/unsubscribe exists; fine-grained notification preferences do not.

## 11. Non-functional requirements

### Security

- Helmet headers and explicit CORS origin allowlist.
- Parameterized Sequelize access and sort allowlists.
- Auth and login rate limits; AI-specific rate limit.
- MIME validation before media upload.
- Password, 2FA secret, face descriptor, and recovery codes excluded from user
  JSON responses.
- All mutation routes must require an explicit auth/permission policy.
- No real credentials may be stored in tracked example files or documentation.

### Reliability and integrity

- Five database connection attempts with three-second delays at startup.
- Global error response shape and 404 handling.
- Explicit migrations; no `sequelize.sync({ alter: true })`.
- Foreign keys, uniqueness checks, rating/page/progress constraints, and indexes.
- Backup files must be stored securely outside the repository and restore-tested.

### Performance

- Book list uses separate count and paginated data queries.
- Eager-loaded catalog associations and SQL rating subqueries prevent N+1 reads.
- Sort fields are allowlisted and page size is capped at 100.
- Compression is enabled.
- Reading library uses one joined progress query plus grouped bookmark/note counts.
- RTK Query caching and debounced progress writes reduce repeated requests.

### Accessibility and responsive behavior

- All primary pages must support mobile and desktop layouts.
- Interactive controls need visible focus, accessible names, and keyboard access.
- English/Khmer metadata fields are supported; a full translated UI is not yet
  guaranteed.

## 12. Environment and deployment

### Backend variables used by code

```text
PORT                    NODE_ENV
DATABASE_URL            DB_SSL
ACCESS_TOKEN_SECRET     ACCESS_TOKEN_EXPIRES_IN
REFRESH_TOKEN_SECRET    REFRESH_TOKEN_EXPIRES_IN
FORGOT_PASSWORD_SECRET
R2_ENDPOINT             R2_ACCESS_KEY
R2_SECRET_KEY           R2_BUCKET             R2_PUBLIC_URL
EMAIL_HOST              EMAIL_PORT            EMAIL_SECURE
EMAIL_USER              EMAIL_PASS
GOOGLE_AI_API_KEY       VECTOR_SEARCH_SERVICE_URL
BACKEND_URL             FRONTEND_URL
GOOGLE_CLIENT_ID        GOOGLE_CLIENT_SECRET
FACEBOOK_APP_ID         FACEBOOK_APP_SECRET
GITHUB_CLIENT_ID        GITHUB_CLIENT_SECRET
VAPID_PUBLIC_KEY        VAPID_PRIVATE_KEY      VAPID_EMAIL
```

### Frontend variables

| Application | Variables |
|---|---|
| Student | `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SITE_URL`, `COOKIE_SECRET` |
| Admin | `NEXT_PUBLIC_BACKEND_URL`, `COOKIE_SECRET`, optional Sentry variables |

`NEXT_PUBLIC_BACKEND_URL` includes `/api` for both Next.js applications.
`COOKIE_SECRET` is server-only even though it is used in a frontend repository.

### Local commands

```bash
# Backend
cd elibrary-backend
npm install
npm run db:migrate
npm run dev

# Admin
cd elibrary-admin
npm install
npm run dev

# Student
cd elibrary-frontend
npm install
npm run dev
```

Deployment ordering for schema-dependent changes is: backup, backend code,
migration, endpoint verification, then admin/student deployments.

## 13. Known limitations and next requirements

1. No project-owned automated unit, integration, or E2E test files are present.
2. `express` is imported by the backend but missing from the root dependency
   manifest/lockfile declaration, so clean installation is not reproducible.
3. Publisher mutations need the same permission protection as other metadata.
4. Environment examples need a secret/variable audit.
5. Student advanced catalog filters expose only part of the backend capability.
6. Favorites and recent history do not sync across browsers/devices.
7. Student 2FA UI/proxies were not found, though backend/admin support exists.
8. Visual cover search has a backend endpoint but no student upload UI.
9. File-size limits need true per-field enforcement.
10. The settings update route references `manage.users`, which is not in the
   current permission seed and must be aligned with the RBAC model.
11. External production availability and monitoring health require a separate
    live-environment verification.

## 14. Acceptance criteria

### Student

- An anonymous visitor can browse catalog/author/media pages and stream a PDF.
- A signed-in user can resume reading on another session, bookmark a page, add
  and edit a note, complete a book, and generate a citation.
- Two different users cannot access each other’s reading records.
- Favorites/history behavior is clearly presented as local until sync ships.

### Admin

- Unauthenticated users cannot enter dashboard operations.
- Each protected mutation fails without the correct permission.
- Catalog, user/RBAC, reviews, feedback, downloads, and audit pages handle
  loading, empty, error, and success states.
- 2FA OTP and recovery-code login work without exposing refresh tokens.

### Backend/database

- All migrations apply to an empty supported PostgreSQL database.
- The schema matches the 25-table ERD.
- API errors use the documented response shape.
- Backups can be inspected and restored before destructive production work.
- Auth, ownership, migration, and critical UI paths pass automated tests once
  the P0 test work is completed.

## Related documents

- [README.md](README.md) — backend/database operations
- [DIAGRAM.md](DIAGRAM.md) — architecture and ER diagrams
- [PLAN.md](PLAN.md) — delivery priorities and release workflow
- [TASKS.md](TASKS.md) — verified implementation tracker
- [BACKLOG.md](BACKLOG.md) — product requests
- [docs/READING_FEATURES.md](docs/READING_FEATURES.md) — reading feature details
- `../elibrary-frontend/README.md` — student application setup/routes/proxies
