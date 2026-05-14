# 📊 Norton E-Library — Architecture & Design Diagrams

> **Version:** 2.0  
> **Created:** April 2, 2026  
> **Last Updated:** May 13, 2026  
> **Based on:** [PRD.md](PRD.md) · [PLAN.md](PLAN.md)  
> **Rendering:** [Mermaid](https://mermaid.js.org) — use GitHub, VS Code Mermaid Preview, or any Mermaid-compatible viewer.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Deployment Architecture](#2-deployment-architecture)
3. [Entity-Relationship Diagram](#3-entity-relationship-diagram)
4. [Authentication — Token Flow](#4-authentication--token-flow)
5. [Password Reset — OTP Flow](#5-password-reset--otp-flow)
6. [RBAC Authorization Flow](#6-rbac-authorization-flow)
7. [File Upload & Storage Flow](#7-file-upload--storage-flow)
8. [PDF Reading Flow](#8-pdf-reading-flow)
9. [AI Recommendation Flow](#9-ai-recommendation-flow)
10. [API Route Structure](#10-api-route-structure)
11. [Admin Dashboard — Page Structure](#11-admin-dashboard--page-structure)
12. [Student Frontend — Page Structure](#12-student-frontend--page-structure)
13. [Redux State Architecture](#13-redux-state-architecture)
14. [Sprint & Phase Timeline](#14-sprint--phase-timeline)
15. [Data Flow — Book CRUD](#15-data-flow--book-crud)
16. [Two-Factor Authentication Flow](#16-two-factor-authentication-flow)
17. [Reviews & Feedback Flow](#17-reviews--feedback-flow)
18. [Use Case Diagram](#18-use-case-diagram)
19. [DFD Level 0 — Context Diagram](#19-dfd-level-0--context-diagram)

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph Clients["🌐 Client Applications"]
        SF["📱 Student Frontend<br/>(Next.js 16 · React 19)<br/>frontend.samnangchan.shop"]
        AD["🖥️ Admin Dashboard<br/>(Next.js 16 · React 19)<br/>admin-elibrary.samnangchan.shop"]
    end

    subgraph Hosting["☁️ Hosting"]
        V1["Vercel<br/>Student Frontend"]
        V2["Vercel<br/>Admin Dashboard"]
        R["Render<br/>Backend API"]
    end

    subgraph Backend["⚙️ Backend API (Node.js + Express)"]
        API["REST API Server<br/>Express.js"]
        MW["Middleware Stack<br/>Auth · CORS · Rate Limit · Helmet"]
        CTRL["Controllers<br/>Auth · Books · Users · AI · Files"]
        SVC["Services<br/>R2 · Gemini · Nodemailer · Socket.IO"]
        ORM["Sequelize ORM<br/>Models · Associations"]
    end

    subgraph Data["💾 Data Layer"]
        PG[("PostgreSQL<br/>Render Managed DB")]
        R2["☁️ Cloudflare R2<br/>PDFs · Covers · Avatars"]
    end

    subgraph External["🔌 External Services"]
        GM["🤖 Google Gemini 2.0 Flash<br/>AI Recommendations"]
        NM["📧 Gmail SMTP<br/>Nodemailer (OTP emails)"]
        VS["🔍 Vector Search<br/>Microservice"]
        SE["🐛 Sentry<br/>Error Monitoring"]
    end

    SF --> V1
    AD --> V2
    V1 -- "HTTPS REST" --> R
    V2 -- "HTTPS REST" --> R
    R --> API
    API --> MW --> CTRL --> SVC
    CTRL --> ORM
    ORM --> PG
    SVC --> R2
    SVC --> GM
    SVC --> NM
    SVC --> VS
    SF -.-> SE
    AD -.-> SE

    style SF fill:#3b82f6,stroke:#1d4ed8,color:#fff
    style AD fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style API fill:#10b981,stroke:#059669,color:#fff
    style PG fill:#f59e0b,stroke:#d97706,color:#fff
    style R2 fill:#06b6d4,stroke:#0891b2,color:#fff
    style GM fill:#ef4444,stroke:#dc2626,color:#fff
```

---

## 2. Deployment Architecture

```mermaid
graph LR
    subgraph Internet["🌐 Internet"]
        U1["👩‍🎓 Students"]
        U2["👨‍💼 Admins"]
    end

    subgraph DNS["🌍 DNS (samnangchan.shop)"]
        D1["frontend.samnangchan.shop"]
        D2["admin-elibrary.samnangchan.shop"]
        D3["API endpoint on Render"]
    end

    subgraph Vercel["▲ Vercel"]
        VF["Student Frontend<br/>Next.js SSR/SSG<br/>Edge Network CDN"]
        VA["Admin Dashboard<br/>Next.js SSR/SSG<br/>Edge Network CDN"]
    end

    subgraph Render["🟣 Render"]
        RS["Web Service<br/>Node.js + Express<br/>Auto-scaling"]
        RPG[("PostgreSQL<br/>nu_elibrary_db_nvwp<br/>Render Managed DB<br/>Daily Backups")]
    end

    subgraph Cloudflare["☁️ Cloudflare"]
        CR2["R2 Object Storage<br/>S3-compatible API<br/>PDFs · Covers · Avatars"]
    end

    subgraph Google["🔵 Google Cloud"]
        GEM["Gemini 2.0 Flash<br/>AI API"]
        SMTP["Gmail SMTP<br/>OTP Emails"]
    end

    U1 --> D1 --> VF
    U2 --> D2 --> VA
    VF -- "API Calls" --> D3
    VA -- "API Calls" --> D3
    D3 --> RS
    RS --> RPG
    RS --> CR2
    RS --> GEM
    RS --> SMTP

    style VF fill:#000,stroke:#fff,color:#fff
    style VA fill:#000,stroke:#fff,color:#fff
    style RS fill:#7c3aed,stroke:#5b21b6,color:#fff
    style RPG fill:#f59e0b,stroke:#d97706,color:#fff
    style CR2 fill:#f97316,stroke:#ea580c,color:#fff
    style GEM fill:#4285f4,stroke:#1a73e8,color:#fff
```

---

## 3. Entity-Relationship Diagram

```mermaid
erDiagram
    User {
        bigint id PK
        string avatar
        string username UK
        string email UK
        string password
        string student_id UK
        string first_name
        string last_name
        boolean is_active
        boolean is_deleted
        datetime created_at
        datetime updated_at
    }

    Role {
        bigint id PK
        string name UK
        string description
    }

    Permission {
        bigint id PK
        string name UK
        string description
    }

    Book {
        bigint id PK
        string title
        string title_kh
        string isbn UK
        text description
        int publication_year
        int pages
        string cover_url
        string pdf_url
        int views
        int downloads
        int publisher_id FK
        int category_id FK
        int department_id FK
        int type_id FK
        boolean is_active
        boolean is_deleted
        datetime created_at
        datetime updated_at
    }

    Author {
        bigint id PK
        string name
        string name_kh
        text biography
        string website
    }

    Editor {
        bigint id PK
        string name
        string name_kh
        text biography
        string website
    }

    Publisher {
        int id PK
        string name
        string name_kh
        text address
        string contact_email
    }

    Category {
        int id PK
        string name UK
        string name_kh
        text description
    }

    Department {
        int id PK
        string code UK
        string name
        string name_kh
        text description
    }

    MaterialType {
        int id PK
        string name UK
        string name_kh
        text description
    }

    Download {
        bigint id PK
        bigint user_id FK
        bigint book_id FK
        datetime downloaded_at
        string ip_address
    }

    Review {
        bigint id PK
        bigint book_id FK
        bigint user_id FK
        int rating
        text comment
        boolean is_deleted
        datetime created_at
        datetime updated_at
    }

    Activity {
        bigint id PK
        bigint user_id FK
        string action
        bigint target_id
        string target_name
        string target_type
        json metadata
        datetime created_at
    }

    Setting {
        string key PK
        text value
        string group
        string type
        datetime created_at
        datetime updated_at
    }

    Feedback {
        bigint id PK
        bigint user_id FK
        enum type
        string subject
        text message
        string name
        string email
        int rating
        datetime created_at
        datetime updated_at
    }

    PushSubscription {
        bigint id PK
        bigint user_id FK
        text endpoint UK
        json keys
        datetime created_at
        datetime updated_at
    }

    %% Junction Tables
    UsersRoles {
        bigint user_id FK
        bigint role_id FK
    }

    RolesPermissions {
        bigint role_id FK
        bigint permission_id FK
    }

    UsersPermissions {
        bigint user_id FK
        bigint permission_id FK
    }

    BooksAuthors {
        bigint book_id FK
        bigint author_id FK
        boolean is_primary_author
    }

    BooksEditors {
        bigint book_id FK
        bigint editor_id FK
    }

    PublishersBooks {
        bigint publisher_id FK
        bigint book_id FK
    }

    %% Relationships
    User ||--o{ UsersRoles : "has"
    Role ||--o{ UsersRoles : "assigned to"
    Role ||--o{ RolesPermissions : "grants"
    Permission ||--o{ RolesPermissions : "granted by"
    User ||--o{ UsersPermissions : "has direct"
    Permission ||--o{ UsersPermissions : "assigned to"

    Book ||--o{ BooksAuthors : "written by"
    Author ||--o{ BooksAuthors : "writes"
    Book ||--o{ BooksEditors : "edited by"
    Editor ||--o{ BooksEditors : "edits"
    Book ||--o{ PublishersBooks : "published by"
    Publisher ||--o{ PublishersBooks : "publishes"

    Book }o--|| Category : "belongs to"
    Book }o--|| Department : "belongs to"
    Book }o--|| MaterialType : "classified as"

    User ||--o{ Download : "downloads"
    Book ||--o{ Download : "downloaded in"

    User ||--o{ Review : "writes"
    Book ||--o{ Review : "reviewed in"

    User ||--o{ Activity : "performs"
    User ||--o{ Feedback : "submits"
    User ||--o{ PushSubscription : "subscribes"
```

---

## 4. Authentication — Token Flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Client (Browser)
    participant F as Frontend (Next.js)
    participant A as Backend API
    participant DB as PostgreSQL

    Note over C,DB: 🔐 Login Flow
    C->>F: Enter email / username / studentId + password
    F->>A: POST /api/auth/login
    A->>DB: Find user by email / username / studentId
    DB-->>A: User record
    A->>A: bcrypt.compare(password, hash)
    A->>A: Generate accessToken (30d)
    A->>A: Generate refreshToken (60d)
    A-->>F: { accessToken, refreshToken, user }
    F->>F: Store tokens (Redux + localStorage)
    F-->>C: Redirect to dashboard / home

    Note over C,DB: 🔑 Authenticated Request
    C->>F: Action (e.g., fetch books)
    F->>A: GET /api/books<br/>Authorization: Bearer {accessToken}
    A->>A: Verify JWT (authenticate middleware)
    A->>DB: Load user + roles + permissions
    A-->>F: { data: books[] }

    Note over C,DB: ♻️ Token Refresh (auto, on 401)
    F->>A: Request fails with 401
    F->>F: RTK Query baseQueryWithReauth
    F->>A: POST /api/auth/refresh<br/>{ refreshToken }
    A->>A: Verify refreshToken
    A->>A: Generate new accessToken (30d)
    A-->>F: { accessToken (new) }
    F->>F: Update stored token
    F->>A: Retry original request with new token
    A-->>F: { data: ... } ✅
```

---

## 5. Password Reset — OTP Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant F as Frontend
    participant A as Backend API
    participant DB as PostgreSQL
    participant E as Gmail SMTP

    Note over U,E: Step 1 — Request OTP
    U->>F: Click "Forgot Password"
    F->>A: POST /api/auth/forgot-password<br/>{ email }
    A->>DB: Find user by email
    DB-->>A: User found
    A->>A: Generate 6-digit OTP
    A->>A: Hash OTP + set expiry (10min)
    A->>DB: Save resetOtp, otpExpiry
    A->>E: Send OTP email (HTML template)
    E-->>U: 📧 Email with OTP code
    A-->>F: { message: "OTP sent" }

    Note over U,E: Step 2 — Verify OTP
    U->>F: Enter 6-digit OTP
    F->>A: POST /api/auth/verify-otp<br/>{ email, otp }
    A->>DB: Get user resetOtp + otpExpiry
    A->>A: Compare OTP + check not expired
    A->>A: Generate resetToken (temporary)
    A->>DB: Clear resetOtp, otpExpiry
    A-->>F: { resetToken }

    Note over U,E: Step 3 — Reset Password
    U->>F: Enter new password (2x)
    F->>A: POST /api/auth/reset-password<br/>{ resetToken, newPassword }
    A->>A: Verify resetToken
    A->>A: bcrypt.hash(newPassword)
    A->>DB: Update password
    A-->>F: { message: "Password reset successful" }
    F-->>U: Redirect to login ✅
```

---

## 6. RBAC Authorization Flow

```mermaid
flowchart TD
    REQ["📨 Incoming Request"] --> AUTH{"authenticate<br/>middleware"}
    
    AUTH -- "No token" --> R401["❌ 401 Unauthorized"]
    AUTH -- "Invalid/expired" --> R401
    AUTH -- "Valid JWT" --> LOAD["Load user + roles<br/>+ permissions from DB"]
    
    LOAD --> ROLE{"authorize(...roles)<br/>middleware"}
    
    ROLE -- "Role not in list" --> R403A["❌ 403 Forbidden<br/>'Insufficient role'"]
    ROLE -- "Role matches" --> PERM{"requirePermission(name)<br/>middleware"}
    
    PERM -- "Permission not found<br/>in roles or direct" --> R403B["❌ 403 Forbidden<br/>'Missing permission'"]
    PERM -- "Permission granted" --> CTRL["✅ Controller<br/>executes action"]
    
    CTRL --> RES["📤 Response"]

    subgraph Roles["Predefined Roles"]
        direction LR
        AD["admin<br/>(full access)"]
        LB["librarian<br/>(manage books)"]
        US["user<br/>(read only)"]
    end

    subgraph Permissions["Seeded Permissions"]
        direction LR
        P1["books.view / books.create<br/>books.update / books.delete / books.download"]
        P2["users.view / users.create<br/>users.update / users.delete"]
        P3["roles.view / roles.create<br/>roles.update / roles.delete"]
        P4["permissions.view / permissions.assign"]
    end

    style REQ fill:#3b82f6,color:#fff
    style R401 fill:#ef4444,color:#fff
    style R403A fill:#ef4444,color:#fff
    style R403B fill:#ef4444,color:#fff
    style CTRL fill:#10b981,color:#fff
```

---

## 7. File Upload & Storage Flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant F as Frontend
    participant A as Backend API
    participant M as Multer Middleware
    participant R2 as Cloudflare R2

    Note over C,R2: 📤 Upload Flow (Book PDF + Cover)
    C->>F: Select files in form
    F->>A: POST /api/uploads/single<br/>multipart/form-data<br/>(file + folder param)
    A->>M: Parse file (memory storage)
    M->>M: Validate MIME type<br/>PDF: application/pdf (10MB)<br/>Image: JPEG/PNG/WebP (5MB)
    M-->>A: file buffer ready
    A->>R2: PutObjectCommand<br/>Key: {folder}/{timestamp}-{name}
    R2-->>A: { Key, ETag }
    A-->>F: { url, key, message }
    F->>F: Store URL in book form state

    Note over C,R2: 📥 Download Flow (PDF)
    C->>F: Click "Read" or "Download"
    F->>A: GET /api/books/:id/download<br/>Authorization: Bearer {token} or ?token=
    A->>A: authenticateStream middleware
    A->>R2: GetObject → stream PDF
    R2-->>A: PDF binary stream
    A->>A: Record download in DB
    A-->>F: Streamed PDF (piped response)
    F-->>C: PDF opens in reader / downloads
```

---

## 8. PDF Reading Flow

```mermaid
flowchart TD
    START["📖 User opens book"] --> LOAD["Fetch book metadata<br/>GET /api/books/:id"]
    LOAD --> CHECK{"Has saved<br/>reading position?<br/>(localStorage)"}
    
    CHECK -- "Yes" --> RESUME["Resume at saved page"]
    CHECK -- "No" --> PAGE1["Start at page 1"]
    
    RESUME --> RENDER["Render PDF<br/>@react-pdf-viewer"]
    PAGE1 --> RENDER
    
    RENDER --> READING["📖 User is reading"]
    
    READING --> TRACK["⏱️ Track reading time<br/>(dispatch every 30s)"]
    READING --> NAV["Navigate pages"]
    READING --> SAVE["💾 Auto-save position<br/>to localStorage"]
    
    NAV --> PROGRESS["Update progress bar<br/>Page X / Total · XX%"]
    
    PROGRESS --> DONE{"Reached<br/>last page?"}
    DONE -- "No" --> READING
    DONE -- "Yes" --> CELEBRATE["🎉 Completion toast!<br/>'Congratulations!'"]
    
    READING --> DL["📥 Download PDF<br/>(auth required)"]
    DL --> RECORD["Record download<br/>in database"]

    style START fill:#3b82f6,color:#fff
    style CELEBRATE fill:#10b981,color:#fff
    style RECORD fill:#f59e0b,color:#fff
```

---

## 9. AI Recommendation Flow

```mermaid
flowchart TD
    REQ["🤖 AI Request<br/>(category / title / personal)"] --> RL{"Rate Limit Check<br/>20 req/min per user"}
    
    RL -- "Exceeded" --> R429["❌ 429 Too Many Requests"]
    RL -- "OK" --> CACHE{"In-memory cache?<br/>(5-min TTL, 200 entries)"}
    
    CACHE -- "HIT" --> CACHED["Return cached result ⚡"]
    CACHE -- "MISS" --> BUILD["Build prompt with<br/>book catalog context"]
    
    BUILD --> GEMINI["🔵 Google Gemini 2.0 Flash<br/>Generate recommendations"]
    
    GEMINI -- "Success" --> PARSE["Parse AI response<br/>(JSON array of books)"]
    GEMINI -- "Error / Timeout" --> FALLBACK["🔄 Graceful degradation<br/>Return popular books by views"]
    
    PARSE --> MATCH["Match AI titles → DB books<br/>Sequelize fuzzy search"]
    MATCH --> STORE["Store in cache<br/>(key: request hash)"]
    STORE --> RESPOND["📤 Return recommendations<br/>{ books[], reasoning }"]
    
    FALLBACK --> RESPOND

    style REQ fill:#8b5cf6,color:#fff
    style GEMINI fill:#4285f4,color:#fff
    style CACHED fill:#10b981,color:#fff
    style FALLBACK fill:#f59e0b,color:#fff
    style R429 fill:#ef4444,color:#fff
```

---

## 10. API Route Structure

```mermaid
graph LR
    API["/api"] --> AUTH["/auth"]
    API --> BOOKS["/books"]
    API --> USERS["/users"]
    API --> ROLES["/roles"]
    API --> PERMS["/permissions"]
    API --> CAT["/categories"]
    API --> DEPT["/departments"]
    API --> MT["/material-types"]
    API --> PUB["/publishers"]
    API --> AUT["/authors"]
    API --> EDT["/editors"]
    API --> UPL["/uploads"]
    API --> STAT["/stats"]
    API --> ACT["/activities"]
    API --> AI["/ai/recommendations"]
    API --> SET["/settings"]
    API --> DL["/downloads"]
    API --> REV["/reviews"]
    API --> PUSH["/push"]
    API --> FB["/feedback"]

    AUTH --> A1["POST /register"]
    AUTH --> A2["POST /login"]
    AUTH --> A3["POST /refresh"]
    AUTH --> A4["POST /logout"]
    AUTH --> A5["GET /me  ·  GET /profile"]
    AUTH --> A6["PATCH /profile"]
    AUTH --> A7["POST /avatar  ·  GET /avatar"]
    AUTH --> A8["PUT /change-password"]
    AUTH --> A9["POST /forgot-password"]
    AUTH --> A10["POST /verify-otp"]
    AUTH --> A11["POST /reset-password"]
    AUTH --> A12["POST /2fa/setup  ·  /2fa/verify<br/>/2fa/disable  ·  /2fa/status"]
    AUTH --> A13["GET /google  ·  GET /facebook<br/>GET /github  (OAuth)"]

    BOOKS --> B1["GET / (list + search + filter)"]
    BOOKS --> B2["GET /:id  ·  GET /:id/summary"]
    BOOKS --> B3["POST / (create)"]
    BOOKS --> B4["PUT /:id (update)"]
    BOOKS --> B5["DELETE /:id (soft-delete)"]
    BOOKS --> B6["GET /:id/cover"]
    BOOKS --> B7["GET /:id/stream (public PDF proxy)"]
    BOOKS --> B8["GET /:id/pdf-url  ·  /video-url  ·  /audio-url"]
    BOOKS --> B9["GET /:id/download (auth + record)"]
    BOOKS --> B10["POST /scan-search (AI cover scan)"]
    BOOKS --> B11["GET /:bookId/reviews  ·  POST /:bookId/reviews"]

    AI --> AI1["GET / (by category or bookTitle or userId)"]
    AI --> AI2["GET /trending"]
    AI --> AI3["GET /similar/:bookId"]
    AI --> AI4["POST /personalized"]
    AI --> AI5["POST /chat"]

    UPL --> U1["POST /single"]
    UPL --> U2["POST /multiple"]
    UPL --> U3["DELETE /delete"]

    style API fill:#3b82f6,color:#fff
    style AUTH fill:#ef4444,color:#fff
    style BOOKS fill:#10b981,color:#fff
    style AI fill:#8b5cf6,color:#fff
    style UPL fill:#f97316,color:#fff
    style REV fill:#06b6d4,color:#fff
    style FB fill:#f59e0b,color:#fff
```

---

## 11. Admin Dashboard — Page Structure

```mermaid
graph TD
    ROOT["🖥️ Admin Dashboard<br/>admin-elibrary.samnangchan.shop"] --> LOGIN["/login<br/>Authentication"]
    ROOT --> DASH["/(dashboard)"]

    DASH --> OV["/overview<br/>📊 Stats · Charts · Activity"]
    DASH --> BK["/books<br/>📚 Book Management"]
    DASH --> US["/users<br/>👥 User Management"]
    DASH --> PR["/profile<br/>👤 My Profile"]
    DASH --> BL["/billing<br/>💳 Billing (placeholder)"]

    BK --> BK_LIST["Book List<br/>TanStack Table · Search · Filter"]
    BK --> BK_NEW["/books/new<br/>Create Book Form"]
    BK --> BK_EDIT["/books/:id/edit<br/>Edit Book Form"]
    BK --> CAT_M["/books/categories<br/>Category Manager"]
    BK --> DEPT_M["/books/departments<br/>Department Manager"]
    BK --> MT_M["/books/material-types<br/>Material Type Manager"]
    BK --> PUB_M["/books/publishers<br/>Publisher Manager"]
    BK --> AUT_M["/books/authors<br/>Author Manager"]
    BK --> EDT_M["/books/editors<br/>Editor Manager"]

    US --> US_LIST["User List<br/>Table · Search"]
    US --> US_NEW["/users/new<br/>Create User"]
    US --> US_EDIT["/users/:id/edit<br/>Edit User + Roles"]
    US --> ROLE_M["/users/roles<br/>Role Manager"]
    US --> PERM_M["/users/permissions<br/>Permission Manager"]

    OV --> OV_CARDS["Stat Cards<br/>Books · Theses · Members"]
    OV --> OV_CHART["Charts<br/>Upload Trends · Categories"]
    OV --> OV_ACT["Recent Activities<br/>Feed + Time Filter"]

    style ROOT fill:#8b5cf6,color:#fff
    style LOGIN fill:#ef4444,color:#fff
    style OV fill:#3b82f6,color:#fff
    style BK fill:#10b981,color:#fff
    style US fill:#f59e0b,color:#fff
```

---

## 12. Student Frontend — Page Structure

```mermaid
graph TD
    ROOT["📱 Student Frontend<br/>frontend.samnangchan.shop"] --> HOME["/<br/>🏠 Home Page"]
    ROOT --> AUTH_G["/auth"]
    ROOT --> BOOKS_G["/books"]
    ROOT --> LIB["/library<br/>📚 Personal Library"]
    ROOT --> PROF["/profile<br/>👤 Profile"]
    ROOT --> ABOUT["/about<br/>ℹ️ About"]
    ROOT --> CONTACT["/contact<br/>📧 Contact"]

    HOME --> HERO["Hero Section<br/>Search · Book Marquee"]
    HOME --> FEAT["Featured Books<br/>Top 15 · Rank Badges"]
    HOME --> STATS["Statistics<br/>Animated Counters"]
    HOME --> CATS["Categories<br/>Browse by Subject"]
    HOME --> TEST["Testimonials<br/>Carousel"]
    HOME --> CTA["CTA Section"]

    AUTH_G --> SIGNIN["/auth/signin"]
    AUTH_G --> SIGNUP["/auth/signup"]
    AUTH_G --> FORGOT["/auth/forgot-password<br/>3-Step OTP Flow"]

    BOOKS_G --> CATALOG["/books<br/>Catalog · Grid/List"]
    BOOKS_G --> DETAIL["/books/:id<br/>Book Detail"]
    BOOKS_G --> READER["/books/:id/read<br/>📖 PDF Reader"]

    LIB --> FAV["⭐ Favorites Tab"]
    LIB --> HIST["📜 History Tab"]
    LIB --> PROG["📊 Progress Tab"]

    PROF --> P_VIEW["View Profile"]
    PROF --> P_EDIT["Edit Profile + Avatar"]
    PROF --> P_PASS["Change Password"]

    style ROOT fill:#3b82f6,color:#fff
    style HOME fill:#10b981,color:#fff
    style AUTH_G fill:#ef4444,color:#fff
    style BOOKS_G fill:#8b5cf6,color:#fff
    style LIB fill:#f59e0b,color:#fff
    style READER fill:#06b6d4,color:#fff
```

---

## 13. Redux State Architecture

```mermaid
graph TD
    STORE["🏬 Redux Store"] --> AUTH_S["auth slice"]
    STORE --> THEME["theme slice"]
    STORE --> API_SLICE["RTK Query API slice"]

    AUTH_S --> AS1["user: User | null"]
    AUTH_S --> AS2["accessToken: string"]
    AUTH_S --> AS3["refreshToken: string"]
    AUTH_S --> AS4["isAuthenticated: boolean"]

    API_SLICE --> AQ_AUTH["authApi<br/>login · register · refresh<br/>profile · changePassword"]
    API_SLICE --> AQ_BOOKS["booksApi<br/>getBooks · getBook · createBook<br/>updateBook · deleteBook · search"]
    API_SLICE --> AQ_USERS["usersApi<br/>getUsers · getUser · createUser<br/>updateUser · deleteUser · assignRole"]
    API_SLICE --> AQ_ROLES["rolesApi<br/>getRoles · createRole<br/>assignPermissions"]
    API_SLICE --> AQ_CATS["categoriesApi / departmentsApi<br/>materialTypesApi / publishersApi<br/>authorsApi / editorsApi"]
    API_SLICE --> AQ_STATS["overviewApi<br/>getStats · getActivities<br/>getTrends"]
    API_SLICE --> AQ_UPLOAD["uploadApi<br/>uploadSingle · uploadMultiple<br/>deleteFile · getPresignedUrl"]
    API_SLICE --> AQ_AI["aiApi<br/>getRecommendations · getTrending<br/>getSimilar · chat"]

    subgraph BaseQuery["baseQueryWithReauth"]
        BQ1["fetchBaseQuery({ baseUrl })"]
        BQ2["On 401 → POST /refresh-token"]
        BQ3["Retry with new token"]
        BQ4["On fail → logout + redirect"]
    end

    API_SLICE -.-> BaseQuery

    style STORE fill:#8b5cf6,color:#fff
    style AUTH_S fill:#ef4444,color:#fff
    style API_SLICE fill:#3b82f6,color:#fff
```

---

## 14. Sprint & Phase Timeline

```mermaid
gantt
    title Norton E-Library — 16-Week Sprint Plan
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Phase 1: Backend
    S1 - Environment + Models       :p1s1, 2026-04-07, 7d
    S2 - Auth + Middleware           :p1s2, after p1s1, 7d
    S3 - CRUD Endpoints              :p1s3, after p1s2, 7d
    S4 - Files + Stats               :p1s4, after p1s3, 7d
    M1 - DB Ready                    :milestone, m1, 2026-04-13, 0d
    M2 - Auth Complete               :milestone, m2, 2026-04-20, 0d
    M3 - Backend MVP                 :milestone, m3, 2026-05-04, 0d

    section Phase 2: Admin Dashboard
    S3 - Setup + Layout (parallel)   :p2s3, 2026-04-21, 7d
    S4 - Auth + Overview             :p2s4, after p2s3, 7d
    S5 - Book Management             :p2s5, after p2s4, 7d
    S6 - User Mgmt + Profile         :p2s6, after p2s5, 7d
    M4 - Dashboard MVP               :milestone, m4, 2026-05-18, 0d

    section Phase 3: Student Frontend
    S5 - Setup + Home (parallel)     :p3s5, 2026-05-05, 7d
    S6 - Auth + Catalog              :p3s6, after p3s5, 7d
    S7 - Book Detail + PDF Reader    :p3s7, after p3s6, 7d
    S8 - Library + Profile           :p3s8, after p3s7, 7d
    S9 - Static Pages                :p3s9, after p3s8, 7d
    M5 - Frontend MVP                :milestone, m5, 2026-06-08, 0d

    section Phase 4: AI Features
    S8 - Gemini Integration (overlap):p4s8, 2026-05-26, 7d
    S9 - Vector Search               :p4s9, after p4s8, 7d
    S10 - Real-time Features         :p4s10, after p4s9, 7d
    M6 - AI Complete                 :milestone, m6, 2026-06-22, 0d

    section Phase 5: Testing & QA
    S10 - Backend Testing (overlap)  :p5s10, 2026-06-15, 7d
    S11 - Frontend Testing           :p5s11, after p5s10, 7d
    S12 - Performance + Lighthouse   :p5s12, after p5s11, 7d
    S13 - Security Audit             :p5s13, after p5s12, 7d

    section Phase 6: Deployment
    S13 - Deploy (overlap)           :p6s13, 2026-07-06, 7d
    S14 - Production Verification    :p6s14, after p6s13, 7d
    M7 - Production Launch 🚀       :milestone, m7, 2026-07-20, 0d

    section Phase 7: Post-Launch
    S15 - Monitor + Bug Fix          :p7s15, after p6s14, 7d
    S16 - Feedback + Iterate         :p7s16, after p7s15, 7d
    M8 - Stable v1.0                 :milestone, m8, 2026-08-03, 0d
```

---

## 15. Data Flow — Book CRUD

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin
    participant D as Dashboard (Next.js)
    participant API as Backend API
    participant DB as PostgreSQL
    participant R2 as Cloudflare R2

    Note over A,R2: 📚 Create New Book
    A->>D: Fill book form<br/>(title, ISBN, authors, category,<br/>description, cover, PDF)
    D->>API: POST /api/uploads/single<br/>(cover image, folder: books/covers)
    API->>R2: Upload cover → books/covers/{file}
    R2-->>API: coverUrl
    API-->>D: { url: coverUrl }
    
    D->>API: POST /api/uploads/single<br/>(PDF file, folder: books/pdfs)
    API->>R2: Upload PDF → books/pdfs/{file}
    R2-->>API: pdfUrl
    API-->>D: { url: pdfUrl }
    
    D->>API: POST /api/books<br/>{ title, isbn, cover_url, pdf_url,<br/>authorIds[], categoryId, departmentId, typeId, ... }
    API->>DB: Book.create(data)
    API->>DB: BooksAuthors.bulkCreate(...)
    API->>DB: Activity.create({ action: 'created', target_type: 'book' })
    DB-->>API: Book record
    API-->>D: { success: true, data: { book } }
    D-->>A: ✅ Success toast + redirect to list

    Note over A,R2: 📖 Student Reads Book
    A->>D: Click book → Read
    D->>API: GET /api/books/:id
    API->>DB: Book.findByPk (eager-load authors, category, publisher, etc.)
    API->>DB: Book.increment('views')
    DB-->>API: Book with associations
    API-->>D: { success: true, data: { book } }
    D->>API: GET /api/books/:id/stream (public PDF proxy)
    API->>R2: GetObject → stream PDF binary
    R2-->>API: PDF binary stream
    API-->>D: PDF stream (piped, Content-Type: application/pdf)
    D-->>A: PDF renders in @react-pdf-viewer
```

---

## 16. Two-Factor Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant F as Frontend
    participant A as Backend API
    participant DB as PostgreSQL
    participant AUTH as Authenticator App

    Note over U,AUTH: 🔐 2FA Setup (TOTP)
    U->>F: Enable 2FA in settings
    F->>A: POST /api/auth/2fa/setup
    A->>A: Generate TOTP secret
    A->>DB: Save encrypted secret (pending)
    A-->>F: { qrCodeUrl, secret }
    F-->>U: Show QR code

    U->>AUTH: Scan QR code
    AUTH-->>U: Shows 6-digit TOTP code

    U->>F: Enter TOTP code to verify
    F->>A: POST /api/auth/2fa/verify-setup<br/>{ token }
    A->>A: Verify TOTP code
    A->>DB: Mark 2FA as enabled
    A-->>F: { message: "2FA enabled", recoveryCodes }
    F-->>U: ✅ 2FA active

    Note over U,AUTH: 🔑 Login with 2FA
    U->>F: Login (email + password)
    F->>A: POST /api/auth/login
    A->>A: Verify password ✅
    A->>A: 2FA enabled? → issue tempToken (5min)
    A-->>F: { requires2FA: true, tempToken }
    F-->>U: Show 2FA code input

    U->>AUTH: Read current TOTP code
    U->>F: Enter 6-digit code
    F->>A: POST /api/auth/2fa/verify<br/>{ tempToken, token }
    A->>A: Verify TOTP against secret
    A->>A: Generate accessToken (30d) + refreshToken (60d)
    A-->>F: { accessToken, refreshToken, user }
    F-->>U: ✅ Logged in

    Note over U,AUTH: 🔓 Disable 2FA
    U->>F: Disable 2FA
    F->>A: POST /api/auth/2fa/disable<br/>{ token } (Bearer)
    A->>A: Verify TOTP + clear secret
    A->>DB: Set 2FA disabled
    A-->>F: { message: "2FA disabled" }
```

---

## 17. Reviews & Feedback Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant F as Frontend
    participant A as Backend API
    participant DB as PostgreSQL

    Note over U,DB: ⭐ Book Review
    U->>F: Open book detail page
    F->>A: GET /api/books/:bookId/reviews
    A->>DB: Review.findAll (not deleted, with user info)
    DB-->>A: Reviews with avg rating
    A-->>F: { reviews[], averageRating, reviewCount }
    F-->>U: Show rating + reviews

    U->>F: Submit rating (1–5) + comment
    F->>A: POST /api/books/:bookId/reviews<br/>Bearer {accessToken}<br/>{ rating, comment }
    A->>A: Authenticate user
    A->>DB: Check existing review (partial unique index)
    A->>DB: Review.create({ bookId, userId, rating, comment })
    DB-->>A: Review record
    A-->>F: { success: true, data: { review } }
    F-->>U: ✅ Review posted

    Note over U,DB: 📬 User Feedback
    U->>F: Submit feedback (contact form)
    F->>A: POST /api/feedback<br/>{ type, subject, message, name?, email? }
    A->>DB: Feedback.create(data)
    DB-->>A: Feedback record
    A-->>F: { success: true, message: "Feedback submitted" }
    F-->>U: ✅ Thank you message
```

---

---

## 18. Use Case Diagram

> តួអង្គ (Actors): **Student / User**, **Librarian**, **Admin**  
> Use-case ខាងក្រោមបង្ហាញពីសិទ្ធិ និងសកម្មភាពរបស់តួអង្គនីមួយៗក្នុងប្រព័ន្ធបណ្ណាល័យ Norton E-Library។

```mermaid
flowchart LR
    STU(["👩‍🎓 Student / User"])
    LIB(["📚 Librarian"])
    ADM(["👨‍💼 Admin"])

    subgraph AUTH_UC["🔐 Authentication"]
        UC1["Register / Sign Up"]
        UC2["Login (email · username · studentId)"]
        UC3["Forgot Password (OTP via Email)"]
        UC4["Change Password"]
        UC5["OAuth Login (Google · Facebook · GitHub)"]
        UC6["Two-Factor Authentication (TOTP)"]
    end

    subgraph BOOK_UC["📖 Book Access"]
        UC7["Browse & Search Books"]
        UC8["Filter by Category / Department / Type"]
        UC9["View Book Detail & Metadata"]
        UC10["Read PDF Online"]
        UC11["Download PDF (authenticated)"]
        UC12["Add to Favorites"]
        UC13["View Personal Library & History"]
        UC14["Track Reading Progress"]
        UC15["Get AI Book Recommendations"]
        UC16["Visual Book Cover Scan Search"]
    end

    subgraph SOCIAL_UC["💬 Social & Feedback"]
        UC17["Submit Book Review & Rating"]
        UC18["Submit Feedback / Bug Report"]
        UC19["Subscribe to Push Notifications"]
        UC20["Share Book Link"]
    end

    subgraph PROFILE_UC["👤 Profile"]
        UC21["View / Edit Profile"]
        UC22["Upload Avatar"]
        UC23["View Roles & Permissions"]
    end

    subgraph LIB_UC["🗂️ Library Management (Librarian)"]
        UC24["Create / Edit / Delete Books"]
        UC25["Upload Book Cover & PDF to R2"]
        UC26["Manage Categories · Departments · Material Types"]
        UC27["Manage Authors · Editors · Publishers"]
        UC28["View Download Statistics"]
        UC29["View Activity Log"]
        UC30["Manage Feedback"]
        UC31["Scan Student Code ID (Check-in / Check-out)"]  
    end

    subgraph ADMIN_UC["⚙️ Administration (Admin Only)"]
        UC32["Manage Users (CRUD + Roles + Permissions)"]
        UC33["Manage Roles & Permissions"]
        UC34["View Full Dashboard Analytics"]
        UC35["Configure System Settings"]
        UC36["Approve Students into Library System"]
        UC37["Review Staff Activity & Work"]
        UC38["Review Book Return Approvals"]
        UC39["Review Library Payment Records"]
        UC40["Review Student Check-in / Check-out Data"]
    end

    %% Student associations
    STU --- UC1 & UC2 & UC3 & UC4 & UC5 & UC6
    STU --- UC7 & UC8 & UC9 & UC10 & UC11 & UC12 & UC13 & UC14 & UC15 & UC16
    STU --- UC17 & UC18 & UC19 & UC20
    STU --- UC21 & UC22 & UC23

    %% Librarian extends Student + adds Library Mgmt
    LIB --- UC1 & UC2 & UC4 & UC6
    LIB --- UC7 & UC9 & UC10 & UC11
    LIB --- UC21 & UC22
    LIB --- UC24 & UC25 & UC26 & UC27 & UC28 & UC29 & UC30 & UC31

    %% Admin extends Librarian + adds Administration
    ADM --- UC1 & UC2 & UC4 & UC6
    ADM --- UC7 & UC9 & UC10 & UC11
    ADM --- UC21 & UC22
    ADM --- UC24 & UC25 & UC26 & UC27 & UC28 & UC29 & UC30 & UC31
    ADM --- UC32 & UC33 & UC34 & UC35 & UC36 & UC37 & UC38 & UC39 & UC40

    style STU fill:#3b82f6,stroke:#1d4ed8,color:#fff
    style LIB fill:#10b981,stroke:#059669,color:#fff
    style ADM fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style AUTH_UC fill:#fef9c3,stroke:#ca8a04
    style BOOK_UC fill:#dcfce7,stroke:#16a34a
    style SOCIAL_UC fill:#e0f2fe,stroke:#0284c7
    style PROFILE_UC fill:#fce7f3,stroke:#be185d
    style LIB_UC fill:#fff7ed,stroke:#c2410c
    style ADMIN_UC fill:#f3e8ff,stroke:#7c3aed
```

### ពន្យល់ Use Case តាមតួអង្គ (Actor Descriptions)

| Actor | ភាសាខ្មែរ | Use Cases |
|---|---|---|
| **Student / User** | និស្សិត / អ្នកប្រើប្រាស់ | UC1–UC23 — ចូលប្រើ, អាន, ទាញយក, ស្វែងរក, សម្គាល់ប្រវត្តិ, Review |
| **Librarian** | បណ្ណារក្ស | UC1–UC4, UC6–UC11, UC21–UC31 — គ្រប់គ្រងសៀវភៅ, CategMap, Upload, Scan Code ID |
| **Admin** | អ្នកគ្រប់គ្រង | UC1–UC4, UC6–UC11, UC21–UC40 — គ្រប់ UC ទាំងអស់ + Users + Roles + Analytics + Approve |

---

## 19. DFD Level 0 — Context Diagram

> DFD Level 0 (Context Diagram) បង្ហាញពីប្រព័ន្ធ Norton E-Library ជាដំណើរការ (Process) តែមួយ  
> ជាមួយនឹងតួអង្គខាងក្រៅ (External Entities) ទាំងអស់ ដែលបញ្ជូន និងទទួលទិន្នន័យ។

```mermaid
flowchart TB
    subgraph EXT_USERS["👥 External Actors"]
        STU(["👩‍🎓 Student / User"])
        LIB(["📚 Librarian"])
        ADM(["👨‍💼 Admin"])
    end

    subgraph EXT_SVC["🔌 External Services"]
        R2(["☁️ Cloudflare R2\nFile Storage"])
        GEMINI(["🤖 Google Gemini AI\nRecommendations & Chat"])
        SMTP(["📧 Gmail SMTP\nOTP Emails"])
        VS(["🔍 Vector Search\nMicroservice"])
        SENTRY(["🐛 Sentry\nError Monitoring"])
        OAUTH(["🔑 OAuth Providers\nGoogle · Facebook · GitHub"])
    end

    SYSTEM["⚙️ Norton E-Library System\n\n• Authentication & RBAC\n• Book Management\n• PDF Streaming\n• AI Recommendations\n• Reviews & Feedback\n• Push Notifications\n• Activity Logging\n• Statistics & Analytics\n• Check-in / Check-out (Code ID)"]

    %% Student flows
    STU -- "Register · Login · Search · Read\nDownload · Review · Feedback\nProfile · Favorites · OTP" --> SYSTEM
    SYSTEM -- "Books · PDF · Recommendations\nAuth Tokens · Notifications\nReading History · Stats" --> STU

    %% Librarian flows
    LIB -- "Book CRUD · File Upload\nCategory / Author / Publisher Mgmt\nScan Student Code ID" --> SYSTEM
    SYSTEM -- "Dashboard Stats · Activity Log\nDownload Reports · Feedback Data\nCheck-in / Check-out Records" --> LIB

    %% Admin flows
    ADM -- "User Mgmt · Role & Permission Mgmt\nSystem Settings · Approve Students\nReview Returns · Review Payments\nReview Staff Activity" --> SYSTEM
    SYSTEM -- "Full Analytics · User Reports\nPayment Records · Staff Logs\nStudent Entry / Exit Data" --> ADM

    %% External service flows
    SYSTEM -- "PutObject (cover / pdf / avatar)" --> R2
    R2 -- "Presigned URLs · PDF Stream" --> SYSTEM

    SYSTEM -- "Book catalog context + prompt" --> GEMINI
    GEMINI -- "Ranked recommendations · Chat reply" --> SYSTEM

    SYSTEM -- "OTP HTML email" --> SMTP
    SMTP -- "Delivery status" --> SYSTEM

    SYSTEM -- "Index cover vector on book create/update" --> VS
    VS -- "Matched books + similarity score" --> SYSTEM

    SYSTEM -- "Errors & exceptions" --> SENTRY
    OAUTH -- "OAuth token + user profile" --> SYSTEM
    SYSTEM -- "OAuth redirect URL" --> OAUTH

    style SYSTEM fill:#1e293b,stroke:#3b82f6,color:#fff,font-size:13px
    style STU fill:#3b82f6,stroke:#1d4ed8,color:#fff
    style LIB fill:#10b981,stroke:#059669,color:#fff
    style ADM fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style R2 fill:#f97316,stroke:#ea580c,color:#fff
    style GEMINI fill:#4285f4,stroke:#1a73e8,color:#fff
    style SMTP fill:#ef4444,stroke:#dc2626,color:#fff
    style VS fill:#06b6d4,stroke:#0891b2,color:#fff
    style SENTRY fill:#362d59,stroke:#6c5fc7,color:#fff
    style OAUTH fill:#f59e0b,stroke:#d97706,color:#fff
```

### ពន្យល់ DFD Level 0 — Data Flows

| Flow | From | To | Data |
|---|---|---|---|
| ចូលប្រព័ន្ធ (Login) | Student / Librarian / Admin | System | Credentials, Token refresh |
| ស្វែងរក & អានសៀវភៅ | Student | System | Search query, Book ID |
| ទទួលសៀវភៅ | System | Student | Book metadata, PDF stream, Cover URL |
| គ្រប់គ្រងសៀវភៅ (CRUD) | Librarian / Admin | System | Book data, File uploads |
| ចូល / ចេញបណ្ណាល័យ (Process 14) | Librarian (Scan) | System | Student Code ID, Timestamp |
| យល់ព្រមនិស្សិត (Process 10) | Admin | System | Student approval decision |
| ពិនិត្យការសងសៀវភៅ (Process 11) | Admin | System | Return confirmation |
| ពិនិត្យការបង់លុយ (Process 12) | Admin | System | Payment record review |
| ពិនិត្យទិន្នន័យចូល/ចេញ (Process 13) | Admin | System | Check-in/out log query |
| រក្សាទុកឯកសារ | System | Cloudflare R2 | PDF, Cover image, Avatar |
| AI Recommendations | System | Google Gemini | Book catalog → ranked list |
| OTP Email | System | Gmail SMTP | 6-digit OTP for password reset |
| Vector Search | System | Vector Microservice | Cover image embed → matches |

---

> **📌 Rendering Tips:**  
> - **VS Code:** Install the "Markdown Preview Mermaid Support" extension  
> - **GitHub:** Mermaid diagrams render natively in `.md` files  
> - **Online:** Paste diagrams at [mermaid.live](https://mermaid.live)

> **© 2026 Norton University E-Library · Phnom Penh, Cambodia**
