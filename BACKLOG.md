# 📋 Feature Request Backlog — Norton E-Library

> **Last updated:** 2026-08-02 (current-code audit)
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
| F-001 | **Reading history & progress** | Server-backed page progress, completion state, resume position, and Reading/Completed library tabs | 3d | 🔥 High | ✅ Done (July 2026) |
| F-002 | **Favorites + page bookmarks** | Favorites/history are saved per user in the browser; PDF page bookmarks sync to the account | 2d | 🔥 High | 🔄 Partial — favorites are local-only |
| F-003 | **Push notification preferences** | Web Push subscribe/unsubscribe exists; per-notification-type preferences are not implemented | 1d | 🔥 High | 🔄 Partial |

## 🟠 P1 — Should Have

| # | Feature | Description | Effort | Impact | Status |
|---|---------|-------------|--------|--------|--------|
| F-004 | **Reading lists / collections** | Curated lists by department (e.g., "CS Semester 1 Must-Reads"), shared via link | 3d | ⚡ Medium–High | 📋 Planned |
| F-005 | **Advanced book search filters** | Backend supports year, department, material type, language, and author filters; the student catalog currently exposes search, category, and sorting | 2d | ⚡ Medium–High | 🔄 Partial |
| F-006 | **Dark mode PDF reader** | Invert colors / sepia mode for comfortable night-time reading in the PDF viewer | 2d | ⚡ Medium–High | 📋 Planned |
| F-007 | **Book request form** | Students can request books the library doesn't have yet; admin sees request queue | 2d | ⚡ Medium | 📋 Planned |
| F-008 | **Download for offline reading** | Authenticated PDF download and tracking are live; watermarking/offline shelf support remain open | 3d | ⚡ Medium | 🔄 Partial |
| F-009 | **Email digest — weekly new books** | Automated weekly email with newly added books matching student's department | 2d | ⚡ Medium | 📋 Planned |
| F-010 | **Dashboard — feedback analytics** | Feedback statistics, filtering, status updates, resolver details, and admin notes | 2d | ⚡ Medium | ✅ Done |
| F-020 | **Social login (Google / Facebook / GitHub)** | OAuth2 social providers alongside email/password — Google, Facebook, GitHub | 3d | ⚡ Medium–High | ✅ Done (v1.1) |

## 🟡 P2 — Could Have

| # | Feature | Description | Effort | Impact | Status |
|---|---------|-------------|--------|--------|--------|
| F-011 | **Study groups / discussion threads** | Per-book discussion board for students to share notes and ask questions | 5d | 💡 Medium | 💭 Idea |
| F-012 | **Annotation & highlights** | Select PDF text, highlight it, and create/edit/delete color-coded personal notes synced to the account | 5d | 💡 Medium | ✅ Done (July 2026) |
| F-013 | **Gamification — reading streaks** | Track daily reading streaks, badges for milestones (10 books, 100 hours, etc.) | 3d | 💡 Low–Med | 💭 Idea |
| F-014 | **AI chatbot for book Q&A** | Backend chat and per-book summary endpoints exist; a complete student chat experience is still open | 5d | 💡 Medium | 🔄 Partial |
| F-015 | **Multi-language UI** | Khmer (ភាសាខ្មែរ) toggle for the student frontend interface | 4d | 💡 Medium | 💭 Idea |
| F-016 | **QR code book sharing** | Generate a QR code and social/copy links for a stable book URL | 1d | 💡 Low | ✅ Done |
| F-017 | **Related books carousel** | Show related books from the same category on the book detail page | 2d | 💡 Low–Med | ✅ Done (category-based) |
| F-018 | **Reading time estimates** | Display estimated reading time on book cards based on page count | 0.5d | 💡 Low | 💭 Idea |
| F-024 | **Citation generator** | Generate, copy, and download APA, MLA, Chicago, and IEEE citations | 1d | 💡 Medium | ✅ Done (July 2026) |

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
| 2026-08-02 | Audited the backlog against the current repositories. Marked database-backed reading progress, PDF bookmarks/notes/highlights, citations, QR sharing, related books, and feedback management accurately; clarified browser-only favorites/history and partially implemented notification/search/download/chat work. |
| 2026-07-28 | Added PostgreSQL-backed reading progress, page bookmarks, reading notes/highlights, My Library Reading/Completed tabs, and citation actions. |
| 2026-05-13 | OAuth, 2FA, reviews, feedback, and push subscription work entered the implemented baseline. |
| 2026-04-01 | Initial backlog created from team brainstorming and early feedback. |
