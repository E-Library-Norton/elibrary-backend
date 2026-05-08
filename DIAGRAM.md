# 📊 Norton E-Library — Architecture & Design Diagrams

> **Version:** 1.2  
> **Created:** April 2, 2026  
> **Last Updated:** May 8, 2026  
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
        int id PK
        string firstName
        string lastName
        string email UK
        string username UK
        string studentId UK
        string password
        string phone
        string avatarUrl
        string resetOtp
        datetime otpExpiry
        boolean isActive
        datetime deletedAt
    }

    Role {
        int id PK
        string name UK
        string description
    }

    Permission {
        int id PK
        string name UK
        string description
    }

    Book {
        int id PK
        string title
        string isbn UK
        text description
        string language
        int publicationYear
        int pages
        string edition
        string coverUrl
        string pdfUrl
        int viewCount
        int downloadCount
        boolean isPublished
        datetime deletedAt
    }

    Author {
        int id PK
        string name
        string bio
    }

    Editor {
        int id PK
        string name
        string bio
    }

    Publisher {
        int id PK
        string name
        string address
        string website
    }

    Category {
        int id PK
        string name UK
        string description
    }

    Department {
        int id PK
        string name UK
        string description
    }

    MaterialType {
        int id PK
        string name UK
        string description
    }

    Download {
        int id PK
        int userId FK
        int bookId FK
        datetime downloadedAt
        string ipAddress
    }

    Activity {
        int id PK
        int userId FK
        string action
        string entity
        int entityId
        json details
        string ipAddress
        datetime createdAt
    }

    Settings {
        int id PK
        string key UK
        text value
    }

    %% Junction Tables
    UsersRoles {
        int userId FK
        int roleId FK
    }

    RolesPermissions {
        int roleId FK
        int permissionId FK
    }

    UsersPermissions {
        int userId FK
        int permissionId FK
    }

    BookAuthor {
        int bookId FK
        int authorId FK
    }

    BookEditor {
        int bookId FK
        int editorId FK
    }

    PublishersBooks {
        int publisherId FK
        int bookId FK
    }

    %% Relationships
    User ||--o{ UsersRoles : "has"
    Role ||--o{ UsersRoles : "assigned to"
    Role ||--o{ RolesPermissions : "grants"
    Permission ||--o{ RolesPermissions : "granted by"
    User ||--o{ UsersPermissions : "has direct"
    Permission ||--o{ UsersPermissions : "assigned to"

    Book ||--o{ BookAuthor : "written by"
    Author ||--o{ BookAuthor : "writes"
    Book ||--o{ BookEditor : "edited by"
    Editor ||--o{ BookEditor : "edits"
    Book ||--o{ PublishersBooks : "published by"
    Publisher ||--o{ PublishersBooks : "publishes"

    Book }o--|| Category : "belongs to"
    Book }o--|| Department : "belongs to"
    Book }o--|| MaterialType : "classified as"

    User ||--o{ Download : "downloads"
    Book ||--o{ Download : "downloaded"
    User ||--o{ Activity : "performs"
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
    C->>F: Enter email + password
    F->>A: POST /api/auth/login
    A->>DB: Find user by email/username/studentId
    DB-->>A: User record
    A->>A: bcrypt.compare(password, hash)
    A->>A: Generate accessToken (15min)
    A->>A: Generate refreshToken (7d)
    A-->>F: { accessToken, refreshToken, user }
    F->>F: Store tokens (Redux + localStorage)
    F-->>C: Redirect to dashboard/home

    Note over C,DB: 🔑 Authenticated Request
    C->>F: Action (e.g., fetch books)
    F->>A: GET /api/books<br/>Authorization: Bearer {accessToken}
    A->>A: Verify JWT (authenticate middleware)
    A->>DB: Fetch user + roles + permissions
    A-->>F: { data: books[] }

    Note over C,DB: ♻️ Token Refresh (auto, on 401)
    F->>A: Request fails with 401
    F->>F: RTK Query baseQueryWithReauth
    F->>A: POST /api/auth/refresh-token<br/>{ refreshToken }
    A->>A: Verify refreshToken
    A->>A: Generate new accessToken (15min)
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

    subgraph Roles["Roles (examples)"]
        direction LR
        SA["superadmin<br/>(all permissions)"]
        AD["admin<br/>(manage books, users)"]
        LB["librarian<br/>(manage books)"]
        US["user<br/>(read only)"]
    end

    subgraph Permissions["Permissions (examples)"]
        direction LR
        P1["manage_books"]
        P2["manage_users"]
        P3["manage_roles"]
        P4["view_statistics"]
        P5["manage_settings"]
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
    F->>A: POST /api/upload/single<br/>multipart/form-data<br/>(file + folder param)
    A->>M: Parse file (memory storage)
    M->>M: Validate MIME type<br/>PDF: application/pdf (50MB)<br/>Image: image/* (5MB)
    M-->>A: file buffer ready
    A->>R2: PutObjectCommand<br/>Key: {folder}/{timestamp}-{name}
    R2-->>A: { Key, ETag }
    A-->>F: { url, key, message }
    F->>F: Store URL in book form state

    Note over C,R2: 📥 Download Flow (PDF)
    C->>F: Click "Read" or "Download"
    F->>A: GET /api/books/:id/download<br/>Authorization: Bearer {token}
    A->>A: Authenticate user
    A->>R2: GetObjectCommand(pdfUrl key)
    R2-->>A: Presigned URL (1hr expiry)
    A-->>F: Redirect / stream PDF
    A->>A: Record download in DB
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
    API --> UPL["/upload"]
    API --> STAT["/statistics"]
    API --> ACT["/activities"]
    API --> AI["/ai"]
    API --> SET["/settings"]
    API --> DL["/download"]

    AUTH --> A1["POST /register"]
    AUTH --> A2["POST /login"]
    AUTH --> A3["POST /refresh-token"]
    AUTH --> A4["GET /profile"]
    AUTH --> A5["PATCH /profile"]
    AUTH --> A6["POST /change-password"]
    AUTH --> A7["POST /forgot-password"]
    AUTH --> A8["POST /verify-otp"]
    AUTH --> A9["POST /reset-password"]

    BOOKS --> B1["GET / (list + search)"]
    BOOKS --> B2["GET /:id"]
    BOOKS --> B3["POST / (create)"]
    BOOKS --> B4["PUT /:id (update)"]
    BOOKS --> B5["DELETE /:id (soft)"]
    BOOKS --> B6["GET /:id/cover"]
    BOOKS --> B7["GET /:id/download"]

    AI --> AI1["POST /recommend/category"]
    AI --> AI2["POST /recommend/title"]
    AI --> AI3["POST /recommend/personal"]
    AI --> AI4["GET /trending"]
    AI --> AI5["POST /similar"]
    AI --> AI6["POST /chat"]

    UPL --> U1["POST /single"]
    UPL --> U2["POST /multiple"]
    UPL --> U3["DELETE /"]
    UPL --> U4["GET /presigned-url"]

    style API fill:#3b82f6,color:#fff
    style AUTH fill:#ef4444,color:#fff
    style BOOKS fill:#10b981,color:#fff
    style AI fill:#8b5cf6,color:#fff
    style UPL fill:#f97316,color:#fff
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
    D->>API: POST /api/upload/single<br/>(cover image)
    API->>R2: Upload cover → covers/{file}
    R2-->>API: coverUrl
    API-->>D: { url: coverUrl }
    
    D->>API: POST /api/upload/single<br/>(PDF file)
    API->>R2: Upload PDF → pdfs/{file}
    R2-->>API: pdfUrl
    API-->>D: { url: pdfUrl }
    
    D->>API: POST /api/books<br/>{ title, isbn, coverUrl, pdfUrl,<br/>authorIds[], categoryId, ... }
    API->>DB: Book.create(data)
    API->>DB: BookAuthor.bulkCreate(...)
    API->>DB: Activity.create({ action: 'CREATE' })
    DB-->>API: Book record
    API-->>D: { book }
    D-->>A: ✅ Success toast + redirect to list

    Note over A,R2: 📖 Student Reads Book
    A->>D: Click book → Read
    D->>API: GET /api/books/:id
    API->>DB: Book.findByPk (eager load authors, category)
    API->>DB: Book.increment('viewCount')
    DB-->>API: Book with associations
    API-->>D: { book }
    D->>API: GET /api/proxy/pdf?url={pdfUrl}
    API->>R2: GetObject (follow redirect)
    R2-->>API: PDF binary stream
    API-->>D: PDF stream (piped)
    D-->>A: PDF renders in @react-pdf-viewer
```

---

> **📌 Rendering Tips:**  
> - **VS Code:** Install the "Markdown Preview Mermaid Support" extension  
> - **GitHub:** Mermaid diagrams render natively in `.md` files  
> - **Online:** Paste diagrams at [mermaid.live](https://mermaid.live)

> **© 2026 Norton University E-Library · Phnom Penh, Cambodia**
