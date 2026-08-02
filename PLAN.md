# Norton E-Library — Current Delivery Plan

> **Version:** 2.0
> **Last updated:** August 2, 2026
> **Source of truth:** Current code in `elibrary-backend`, `elibrary-admin`, and `elibrary-frontend`
> **Product definition:** [PRD.md](PRD.md)
> **Architecture:** [DIAGRAM.md](DIAGRAM.md)
> **Work status:** [TASKS.md](TASKS.md) and [BACKLOG.md](BACKLOG.md)

## 1. Purpose

This plan describes the system that exists now and the work needed to harden
it. It replaces the original week-by-week launch plan, which no longer covered
the current reading, citation, OAuth, 2FA, review, feedback, media, and realtime
features.

External production availability was not checked during this documentation
audit. “Implemented” below means the required code is present in the local
repositories; it does not by itself prove a successful production deployment.

## 2. Repository baseline

| Application | Directory | Current role |
|---|---|---|
| Backend API | `elibrary-backend` | Express/Sequelize REST API, PostgreSQL, R2, Socket.IO, Gemini, email, Web Push |
| Admin dashboard | `elibrary-admin` | Next.js dashboard for catalog, users/RBAC, reviews, feedback, downloads, settings, and audit logs |
| Student frontend | `elibrary-frontend` | Next.js public catalog, media pages, account/profile, PDF reader, library, reviews, feedback, and push UI |

## 3. Current implementation status

| Workstream | Status | Evidence in the repositories |
|---|---|---|
| Authentication and RBAC | Implemented | JWT access/refresh, password reset, roles, permissions, protected admin routes |
| OAuth | Implemented | Google, Facebook, and GitHub backend routes plus student callback flow |
| Two-factor authentication | Implemented for backend/admin | TOTP, recovery codes, face descriptor endpoints, admin login/settings proxy and UI |
| Catalog management | Implemented | Books, categories, departments, material types, publishers, authors, editors, media, soft deletion |
| Student catalog | Implemented | Search, category filter, sorting, pagination, detail pages, authors, related books |
| Digital media | Implemented | PDF streaming/download, signed video/audio URLs, covers and avatars through R2 |
| Reading state | Implemented | PostgreSQL progress, completion, page bookmarks, highlights, notes, and My Library aggregation |
| Local personal state | Implemented | Per-user browser favorites, recent history, and reading-time fallback |
| Reviews and feedback | Implemented | Public/user/admin review flows and anonymous/authenticated feedback management |
| AI | Implemented at API level | Gemini recommendations, trending, similar, personalized, chat, and book summaries |
| Realtime and notifications | Implemented | Socket.IO admin/broadcast events and Web Push subscribe/unsubscribe |
| Database migrations | Implemented | Sequelize migrations through `20260728000001-create-reading-features.js` |
| Automated tests | Not implemented | No project-owned unit/integration/E2E test or spec files are present |

## 4. Delivered architecture

### 4.1 Backend

- CommonJS Node.js application starting from `src/index.js`.
- API mounted at `/api`; a root health message is available at `/`.
- PostgreSQL accessed through Sequelize models and versioned migrations.
- 25 application tables, including three account-scoped reading tables.
- JWT authentication with role- and permission-based authorization.
- Cloudflare R2 uploads and signed/streamed media access.
- Google Gemini 2.0 Flash calls for recommendations and summaries.
- Socket.IO events, Web Push, Gmail SMTP, and optional vector-search service.
- Docker, backup/restore, migration, health, and monitoring scripts.

### 4.2 Admin dashboard

- Next.js 16 application running on port 3001 in development.
- Dashboard overview, catalog metadata CRUD, book CRUD/read pages, user/RBAC
  management, downloads, reviews, feedback, settings, profile, and audit logs.
- Same-origin auth/media proxy routes with HTTP-only cookie handling.
- Admin 2FA login and settings experience.
- Redux Toolkit services, TanStack tables, forms, charts, Socket.IO notices,
  themes, command navigation, and Sentry dependency.

### 4.3 Student frontend

- Next.js 16 application running on port 3000 in development.
- Home, book catalog/detail/reader, authors, videos, audios, library, profile,
  about, contact, and authentication routes.
- Same-origin API proxies protect access/refresh tokens in HTTP-only cookies.
- Server-backed reading progress, page bookmarks, notes/highlights, Reading and
  Completed tabs, and citation generation.
- Browser-backed favorites, recent history, reading time, and progress fallback.
- Reviews, feedback, OAuth, QR/social sharing, SEO routes, Socket.IO, and Web Push.

## 5. Immediate work plan

### P0 — Security and correctness

| ID | Task | Acceptance criteria |
|---|---|---|
| P0-00 | Restore Express dependency declaration | A clean checkout installs Express from `package.json`/`package-lock.json` and starts without relying on an extraneous local module |
| P0-01 | Protect publisher mutations | `POST`, `PUT`, and `DELETE /api/publishers` require authentication and the same book permissions used by other metadata routes |
| P0-02 | Sanitize environment examples | Example files contain placeholders only; rotate any example value that has ever been used as a real secret |
| P0-03 | Complete backend environment template | Document/add `FORGOT_PASSWORD_SECRET`, `DB_SSL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_EMAIL` where required |
| P0-04 | Add automated auth/RBAC coverage | Register/login/refresh/reset, protected route, role permission, 2FA, and ownership-isolation tests run in CI |
| P0-05 | Add reading ownership tests | Two users cannot read, edit, or delete each other’s progress, bookmarks, or notes |
| P0-06 | Validate migration on a clean database | Every migration applies in order and produces the schema documented in `DIAGRAM.md` |

### P1 — Product consistency

| ID | Task | Acceptance criteria |
|---|---|---|
| P1-01 | Sync favorites to accounts | Favorites are available on another browser after sign-in; local data migrates safely |
| P1-02 | Decide recent-history persistence | Either add a server history table/API or clearly keep history browser-only |
| P1-03 | Expose full catalog filters | Student catalog supports department, material type, year, language, and author filters already accepted by the backend |
| P1-04 | Complete student 2FA experience | If student 2FA is in scope, add the proxy/UI for OTP and recovery-code login and profile settings |
| P1-05 | Build visual scan-search UI | Student UI uploads a cover image to `/api/books/scan-search` and displays ranked matches |
| P1-06 | Add reading-feature E2E tests | Reader progress debounce/flush, bookmarks, notes, completion, library tabs, and citations are covered |

### P2 — Operations and maintainability

| ID | Task | Acceptance criteria |
|---|---|---|
| P2-01 | Add API contract generation | Route and payload documentation can be generated or checked against code |
| P2-02 | Add structured health endpoints | Liveness and readiness distinguish API process health from database/R2 dependencies |
| P2-03 | Add restore drill | A documented backup restores into an empty database and passes schema/data checks |
| P2-04 | Consolidate stale/dead UI configuration | Placeholder Clerk/billing documentation and unused mock content are removed from admin code |
| P2-05 | Add frontend accessibility checks | Keyboard, focus, labels, contrast, reduced motion, and PDF reader controls are tested |

## 6. Release workflow

1. Create a branch for one bounded change.
2. Update the Sequelize model and add a migration for every schema change.
3. Update backend validation, controller/service, route, and authorization.
4. Update same-origin Next.js proxy handlers before browser-facing API calls.
5. Update RTK Query/service types and UI states.
6. Run lint/build/tests in each affected repository.
7. Run `npm run db:migrate:status` and apply migrations in a safe environment.
8. Verify ownership and permission boundaries with at least two user accounts.
9. Update `PRD.md`, `DIAGRAM.md`, `TASKS.md`, the relevant README, and any
   feature-specific document.
10. Deploy backend/migrations before frontend code that depends on new APIs.

## 7. Verification matrix

| Area | Minimum verification |
|---|---|
| Backend | Start succeeds, database connects, root/API info respond, affected endpoint happy/error paths pass |
| Database | Migration up/down reviewed; keys, nullability, indexes, checks, and cascading behavior verified |
| Admin | `npm run build`; role/permission access; loading, empty, validation, error, and success states |
| Student | `npm run lint` and `npm run build`; desktop/mobile; authenticated and anonymous flows |
| Reading | Resume position, completion, bookmark uniqueness, note ownership, fallback behavior, citation output |
| Media | Cover, PDF stream/download, video, audio, avatar, invalid MIME type, and maximum size |
| Auth | Password login, refresh, logout, OAuth callback, OTP reset, 2FA OTP/recovery, expired/invalid tokens |
| Operations | Backup created, backup inspected, restore rehearsed, migrations current, logs contain no secrets |

## 8. Definition of done

A task is complete only when:

- implementation and authorization match the intended users;
- database changes have reversible migrations and required indexes/constraints;
- automated tests exist for new behavior, or the missing coverage is explicitly
  recorded as technical debt;
- lint/build/test commands pass for affected applications;
- empty/loading/error/success states work;
- responsive and keyboard behavior have been checked for UI changes;
- environment and deployment changes are documented without real credentials;
- documentation reflects the implemented route, schema, and persistence model.

## 9. Risks

| Risk | Current concern | Mitigation |
|---|---|---|
| Missing automated tests | Regressions can reach production unnoticed | Prioritize P0 test harness and CI |
| Incomplete dependency manifest | A clean install currently omits Express | Declare Express, refresh the lockfile, and verify from a clean checkout |
| Inconsistent route protection | Publisher mutation routes currently differ from other metadata routes | Standardize auth/permission middleware and test every mutation group |
| Split local/server library state | Favorites/history and reading progress behave differently across devices | Make persistence explicit and add migration/sync rules |
| Secret handling | Example configuration can be copied into real deployments | Use placeholders, secret managers, rotation, and scanning |
| External service failure | R2, Gemini, email, Web Push, vector search, and managed DB are dependencies | Timeouts, fallbacks, health signals, and operational alerts |
| Documentation drift | Three repositories evolve independently | Update documents in the same change as routes/schema/features |

## 10. Documentation map

| File | Purpose |
|---|---|
| [README.md](README.md) | Backend setup, scripts, backup, restore, and database operations |
| [PRD.md](PRD.md) | Current product and technical requirements |
| [DIAGRAM.md](DIAGRAM.md) | Architecture, data, and interaction diagrams |
| [TASKS.md](TASKS.md) | Verified current implementation and open work |
| [BACKLOG.md](BACKLOG.md) | Prioritized product requests |
| [docs/READING_FEATURES.md](docs/READING_FEATURES.md) | Reading progress/bookmark/note implementation and deployment |
| `../elibrary-frontend/README.md` | Student frontend setup, routes, proxies, and state ownership |
