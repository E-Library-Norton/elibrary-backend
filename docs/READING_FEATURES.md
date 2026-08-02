# Reading Progress, Bookmarks, and Notes

> Last updated: August 2, 2026

This feature adds authenticated, per-user PDF reading state without changing
the existing JWT, PDF streaming/download, or Cloudflare R2 flows.

## 1. Apply the database migration

From `elibrary-backend`:

```bash
npm run db:migrate:status
npm run db:migrate
```

Migration `20260728000001-create-reading-features.js` creates:

- `reading_progress` with a unique `(user_id, book_id)` index
- `bookmarks` with a unique `(user_id, book_id, page_number)` index
- `reading_notes`

All three tables use cascading foreign keys to `users` and `books`. The
migration also adds database checks for positive page values, a valid
current-page/total-pages relationship, and a 0–100 progress range.

Rollback only this migration when needed:

```bash
npm run db:migrate:undo
```

## 2. Backend API

All endpoints require `Authorization: Bearer <JWT>`. Controllers always take
the user ID from the verified token; a client-supplied user ID is never trusted.

```text
GET    /api/books/:bookId/reading-progress
PUT    /api/books/:bookId/reading-progress

GET    /api/books/:bookId/bookmarks
POST   /api/books/:bookId/bookmarks
DELETE /api/books/:bookId/bookmarks/:bookmarkId

GET    /api/books/:bookId/notes
POST   /api/books/:bookId/notes
PATCH  /api/books/:bookId/notes/:noteId
DELETE /api/books/:bookId/notes/:noteId

GET    /api/library/reading-progress
```

Example progress update:

```json
{
  "currentPage": 10,
  "totalPages": 100
}
```

Example bookmark:

```json
{
  "pageNumber": 20,
  "title": "Important formula"
}
```

Example reading note:

```json
{
  "pageNumber": 20,
  "selectedText": "The selected PDF text",
  "noteText": "My explanation",
  "highlightColor": "yellow"
}
```

Supported highlight colors are `yellow`, `green`, `blue`, `pink`, and
`purple`.

## 3. Frontend integration

The student frontend includes same-origin Next.js route handlers for every
endpoint. They decrypt the existing HTTP-only access-token cookie on the server
and forward the JWT to Express. Browser code does not receive the JWT for these
reading requests.

RTK Query endpoints are in:

```text
store/api/readingApi.ts
```

Reusable UI is in:

```text
components/reading/
```

`components/pdf-reader/PdfReader.tsx`:

- reads the real page count from PDF.js
- restores an explicit `?page=` first, then server progress, then the local
  fallback
- writes progress after a 900 ms debounce
- flushes pending progress when the tab becomes hidden or the reader unmounts
- keeps the existing `/api/books/:id/stream` R2 proxy
- supports page bookmarks, bookmark navigation, and deletion
- detects PDF text selection and exposes Add Note, Copy, and Highlight actions
- supports note creation, editing, deletion, colors, and page navigation
- retains local Redux progress as a resilience fallback

The reader URL accepts:

```text
/books/:bookId/read?page=20&from=/library
```

`page` opens the requested PDF page. `from` preserves catalog-return navigation.

## 4. My Library

`GET /api/library/reading-progress` loads progress rows with their book,
category, authors, and publisher. Bookmark and note counts are grouped in two
additional queries, avoiding N+1 queries.

The Reading and Completed tabs display:

- cover and title
- page and total page count
- completion percentage and progress bar
- last-read date
- bookmark and note counts
- Continue Reading at the saved page

Completed books also unlock a **Generate Citation** action. Citation metadata
comes from Book, Authors, and Publisher relations and supports:

- APA 7
- MLA 9
- Chicago
- IEEE
- Copy to clipboard
- Download as a `.txt` file

ISBN is displayed as supporting metadata and is included in the downloaded
citation file without being incorrectly inserted into styles that do not
normally require it.

Local progress is used only if the server request fails, so users do not lose
their previous browser-only reading state during deployment.

Favorites and recently viewed history remain per-user browser state in
`librarySlice.ts`; they are separate from server-backed page bookmarks and
reading progress.

## 5. Deployment order

1. Back up the target database.
2. Deploy the backend code.
3. Run `npm run db:migrate` against the target PostgreSQL database.
4. Confirm the new endpoints return authenticated `200` responses.
5. Deploy the student frontend.
6. Open a PDF, change pages, wait one second, and confirm the book appears in
   My Library.
7. Test a bookmark and a note with two different user accounts to confirm
   ownership isolation.

No new environment variables are required specifically for these reading
features.
