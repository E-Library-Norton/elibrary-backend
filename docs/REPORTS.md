# Admin Reports and Analytics

The reports module is mounted at `/api/admin/reports` and uses the existing JWT, RBAC, activity, books, users, downloads, reading, reviews, and feedback data.

## Deploy

1. Install dependencies with `npm ci`.
2. Run `npm run db:migrate` to create the reporting permissions and missing report indexes.
3. Sign out and back in so the Admin access token contains the newly assigned permissions.
4. Assign `reports.view` plus the required report-specific permissions to Librarian roles from the Admin permissions UI.
5. Deploy the backend, then deploy the Admin application.

The migration automatically grants all reporting permissions to the `admin` role. It intentionally grants nothing to `librarian`; Librarian access remains explicit.

## Endpoints

`GET /api/admin/reports/:type` accepts `page`, `limit`, `period`, `startDate`, `endDate`, `search`, `status`, `sortBy`, `sortOrder`, and supported entity filters.

Supported types: `overview`, `users`, `logins`, `books`, `book-views`, `downloads`, `reading-progress`, `reviews`, `feedback`, `authors`, `categories`, `departments`, and `activities`.

Exports:

- `POST /api/admin/reports/:type/export/pdf`
- `POST /api/admin/reports/:type/export/excel`

Exports are limited to 5,000 filtered rows and 10 requests per 10 minutes per client. Excel cells are protected against formula injection, and sensitive security fields are excluded.

## Data coverage

Login reports use recorded `activities` login actions. Book-view reports use the lifetime aggregate on `books.views`. The API returns coverage metadata rather than fabricating unique-viewer or historical-view data that is not stored.

PDF exports bundle Kantumruy Pro for readable Khmer text. Set `REPORT_FONT_PATH` to an alternative full Unicode `.ttf`, `.otf`, or supported webfont when custom institutional typography is required.

## Example

```json
{
  "success": true,
  "message": "downloads report retrieved successfully",
  "data": {
    "summary": {
      "totalDownloads": 112,
      "uniqueBooks": 96,
      "uniqueUsers": 20
    },
    "charts": {
      "trend": [{ "label": "2026-08-02", "value": 8 }]
    },
    "records": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 112,
      "totalPages": 6
    },
    "filters": {
      "period": "this_month",
      "startDate": "2026-08-01",
      "endDate": "2026-08-31"
    },
    "meta": { "timeZone": "Asia/Phnom_Penh" }
  }
}
```
