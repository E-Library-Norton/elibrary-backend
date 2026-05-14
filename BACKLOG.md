# 📋 Feature Request Backlog — Norton E-Library

> **Last updated:** 2026-05-13 (Sprint 19)
> **Source:** Student feedback (contact form), admin observations, stakeholder meetings
> **Prioritization:** MoSCoW (Must / Should / Could / Won't) × Impact–Effort matrix

---

## Priority Legend

| Tag | Meaning |
|-----|---------|
| 🔴 P0 | **Must Have** — Critical for next release |
| 🟠 P1 | **Should Have** — High value, plan for next 2 sprints |
| 🟡 P2 | **Could Have** — Nice to have, schedule when capacity allows |
| 🟢 P3 | **Won't Have (now)** — Parking lot / future consideration |

---

## 🔴 P0 — Must Have

| # | Feature | Description | Effort | Impact | Status |
|---|---------|-------------|--------|--------|--------|
| F-001 | **Reading history & progress** | Track pages read per book, show progress bar on library page, resume where left off | 3d | 🔥 High | ✅ Done (v1.0) |
| F-002 | **Bookmark / favorites list** | Let students save books to a personal “My Library” collection for quick access | 2d | 🔥 High | ✅ Done (v1.0) |
| F-003 | **Push notification preferences** | Allow students to opt-in/out of specific notification types (new books, reminders) | 1d | 🔥 High | ✅ Done (v1.0) |

## 🟠 P1 — Should Have

| # | Feature | Description | Effort | Impact | Status |
|---|---------|-------------|--------|--------|--------|
| F-004 | **Reading lists / collections** | Curated lists by department (e.g., "CS Semester 1 Must-Reads"), shared via link | 3d | ⚡ Medium–High | 📋 Planned |
| F-005 | **Advanced book search filters** | Filter by year, department, material type, language, rating range on library page | 2d | ⚡ Medium–High | 📋 Planned |
| F-006 | **Dark mode PDF reader** | Invert colors / sepia mode for comfortable night-time reading in the PDF viewer | 2d | ⚡ Medium–High | 📋 Planned |
| F-007 | **Book request form** | Students can request books the library doesn't have yet; admin sees request queue | 2d | ⚡ Medium | 📋 Planned |
| F-008 | **Download for offline reading** | Allow PDF download (with watermark) for verified students, track download count | 3d | ⚡ Medium | 📋 Planned |
| F-009 | **Email digest — weekly new books** | Automated weekly email with newly added books matching student's department | 2d | ⚡ Medium | 📋 Planned |
| F-010 | **Dashboard — feedback analytics** | Charts for feedback trends over time, avg rating, response time metrics | 2d | ⚡ Medium | 📋 Planned |
| F-020 | **Social login (Google / Facebook / GitHub)** | OAuth2 social providers alongside email/password — Google, Facebook, GitHub | 3d | ⚡ Medium–High | ✅ Done (v1.1) |

## 🟡 P2 — Could Have

| # | Feature | Description | Effort | Impact | Status |
|---|---------|-------------|--------|--------|--------|
| F-011 | **Study groups / discussion threads** | Per-book discussion board for students to share notes and ask questions | 5d | 💡 Medium | 💭 Idea |
| F-012 | **Annotation & highlights** | Highlight text and add personal notes while reading PDFs, synced to account | 5d | 💡 Medium | 💭 Idea |
| F-013 | **Gamification — reading streaks** | Track daily reading streaks, badges for milestones (10 books, 100 hours, etc.) | 3d | 💡 Low–Med | 💭 Idea |
| F-014 | **AI chatbot for book Q&A** | Chat with a book's content — ask questions, get summaries per chapter | 5d | 💡 Medium | 💭 Idea |
| F-015 | **Multi-language UI** | Khmer (ភាសាខ្មែរ) toggle for the student frontend interface | 4d | 💡 Medium | 💭 Idea |
| F-016 | **QR code book sharing** | Generate QR code for any book page — scan to open on mobile | 1d | 💡 Low | 💭 Idea |
| F-017 | **Related books carousel** | Show "Students also read…" section below each book using AI similarity | 2d | 💡 Low–Med | 💭 Idea |
| F-018 | **Reading time estimates** | Display estimated reading time on book cards based on page count | 0.5d | 💡 Low | 💭 Idea |

## 🟢 P3 — Won't Have (Now)

| # | Feature | Description | Reason |
|---|---------|-------------|--------|
| F-019 | **Audio books / TTS** | Text-to-speech for PDFs using browser Speech API | Low demand, complex |
| F-021 | **Mobile app (React Native)** | Native iOS/Android app with offline sync | Scope too large, PWA sufficient |
| F-022 | **Physical book reservation** | Reserve physical library books through the app | Requires hardware integration |
| F-023 | **Plagiarism checker** | Upload paper to check against book database | Third-party API cost |

---

## 📊 Impact–Effort Matrix

```
         HIGH IMPACT
              │
    F-001 ●   │   ● F-012
    F-002 ●   │   ● F-011
    F-003 ●   │   ● F-014
              │
  ──── LOW EFFORT ────┼──── HIGH EFFORT ────
              │
    F-018 ●   │   ● F-021
    F-016 ●   │   ● F-023
              │
         LOW IMPACT
```

---

## 🔄 Process

1. **Collect** — Student feedback flows in via the Contact/Feedback form and is visible in the admin dashboard under **Feedback** section
2. **Triage** — Admin reviews new feedback weekly, tags feature requests as `type: feature` and updates status
3. **Prioritize** — Product owner scores each request using MoSCoW + Impact/Effort and adds to this backlog
4. **Schedule** — P0 items are pulled into the next sprint, P1 into the sprint after
5. **Communicate** — When a feature ships, feedback entries that requested it are marked `resolved` with a note

---

## 📝 Changelog

| Date | Change |
|------|--------|
| 2026-05-13 | Updated DIAGRAM.md to v2.0: ERD reflects Review, Feedback, PushSubscription models; API route structure updated to match actual routes (`/uploads`, `/stats`, `/downloads`, `/ai/recommendations`); auth token expiry corrected to 30d/60d; RBAC roles & permissions updated to match seeded data; 2FA and Reviews/Feedback flow diagrams added. F-020 social login moved from Won't Have → Done (v1.1) — OAuth for Google, Facebook, GitHub fully implemented. |
| 2026-05-08 | Project reaches 100% completion (237/237 tasks). Stable v1.1 in production. Phase 7 monitoring confirmed green — Sentry error rate nominal, DB stable at 18 MB / 70 indexes, all critical user-reported bugs resolved. All developer workloads at 100%. Backlog reprioritized for v2.0 sprint planning. |
| 2026-04-19 | Postman collection shipped (`E-Library-API.postman_collection.json`, 80+ requests). `aiRecommendations` route mount bug fixed. Token security reviewed (deferred). Task 5.1.7 ✅. |
| 2026-04-18 | Updated F-001, F-002, F-003 to Done — shipped in v1.0 (personal library + push notifications). DB migrated to new Render instance (`nu_elibrary_db_nvwp`). |
| 2026-04-07 | Feedback system shipped (B.15 ✅), A/B test hero CTA live (B.19 ✅), backlog reprioritized after first 2 weeks of real student usage. |
| 2026-04-01 | Initial backlog created with 23 feature ideas from team brainstorm and early feedback |
