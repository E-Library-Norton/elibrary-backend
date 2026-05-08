# 📚 Norton E-Library — Product Requirements Document (PRD)

> **Version:** 1.4  
> **Last Updated:** May 8, 2026  
> **Author:** Norton University Development Team  
> **Project:** Norton E-Library  
> **Status:** Live in Production (v1.1)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [Target Users & Personas](#4-target-users--personas)
5. [System Architecture](#5-system-architecture)
6. [Tech Stack](#6-tech-stack)
7. [Application Structure](#7-application-structure)
8. [Database Schema & Models](#8-database-schema--models)
9. [API Specification](#9-api-specification)
10. [Features — Student Frontend](#10-features--student-frontend)
11. [Features — Admin Dashboard](#11-features--admin-dashboard)
12. [Features — Backend API](#12-features--backend-api)
13. [Authentication & Authorization](#13-authentication--authorization)
14. [AI-Powered Features](#14-ai-powered-features)
15. [File Storage & Media](#15-file-storage--media)
16. [Third-Party Integrations](#16-third-party-integrations)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Deployment & Infrastructure](#18-deployment--infrastructure)
19. [Environment Variables](#19-environment-variables)
20. [Team](#20-team)

---

## 1. Product Overview

**Norton E-Library** is a full-stack digital library platform built for **Norton University**, Phnom Penh, Cambodia. It provides students with free, instant, 24/7 access to a curated collection of digital books, theses, journals, and academic resources.

The platform consists of **three applications**:

| Application | Description | URL |
|---|---|---|
| **Student Frontend** | Public-facing website for students to browse, search, read, and download books | `elibrary-user.vercel.app` / `frontend.samnangchan.shop` |
| **Admin Dashboard** | Administrative panel for librarians and admins to manage the entire library system | `elibrary-dashboard.vercel.app` / `admin-elibrary.samnangchan.shop` |
| **Backend API** | RESTful API server powering both frontends | Hosted on Render |

---

## 2. Problem Statement

Norton University students need a modern, digital-first library system that:

- Replaces limited physical library hours with **24/7 online access**
- Provides a **searchable, categorized catalog** of academic resources
- Supports **online PDF reading** with progress tracking
- Offers **AI-powered book recommendations** to help students discover relevant materials
- Enables administrators to **manage books, users, and permissions** efficiently
- Supports **bilingual content** (English and Khmer) for Cambodian students

---

## 3. Goals & Objectives

### Primary Goals
- Provide every Norton University student with free, instant access to a world-class digital library
- Become Southeast Asia's leading university digital library platform

### Key Objectives
- **Accessibility:** 24/7 online access from any device
- **Discoverability:** AI-powered recommendations and full-text search
- **Management:** Comprehensive admin dashboard for library staff
- **Scalability:** Cloud-native architecture that scales with the university
- **Security:** Role-based access control (RBAC) with granular permissions
- **Bilingual:** Full English/Khmer (ភាសាខ្មែរ) support for titles and metadata

---

## 4. Target Users & Personas

### 4.1 Students (Primary Users)
- Enrolled Norton University students
- Login via email, username, or student ID
- Browse, search, read, and download academic books
- Manage favorites, reading history, and reading progress
- Receive AI-powered book recommendations

### 4.2 Librarians
- Library staff who manage the book catalog
- Upload books (PDF + cover images)
- Manage categories, authors, editors, publishers, departments, and material types
- View download statistics and activity logs

### 4.3 Administrators (Super Users)
- Full system access
- All librarian capabilities plus:
- User management (create, update, deactivate, soft-delete)
- Role and permission management
- System settings configuration
- View comprehensive analytics and dashboards

### Roles Defined in System
| Role | Permissions |
|---|---|
| `user` | Browse, search, read, download books; manage own profile |
| `librarian` | All user permissions + create/update books and metadata |
| `admin` | All permissions + user management, roles, permissions, settings, delete books |

---

## 5. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         VERCEL (Frontend Hosting)                    │
│                                                                      │
│  ┌─────────────────────┐        ┌─────────────────────────────────┐  │
│  │  Student Frontend    │        │  Admin Dashboard                │  │
│  │  Next.js 16 + React │        │  Next.js 16 + React 19         │  │
│  │  Tailwind CSS        │        │  shadcn/ui + Tailwind CSS      │  │
│  │  Redux Toolkit       │        │  Redux Toolkit (RTK Query)     │  │
│  │  Port: 3000          │        │  Port: 3001                    │  │
│  └────────┬─────────────┘        └──────────┬─────────────────────┘  │
│           │                                  │                        │
│           │      API Requests (HTTPS)        │                        │
└───────────┼──────────────────────────────────┼────────────────────────┘
            │                                  │
            ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         RENDER (Backend Hosting)                     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Node.js + Express.js REST API                                 │  │
│  │  ─────────────────────────────────────────────                 │  │
│  │  • JWT Authentication (Access + Refresh tokens)                │  │
│  │  • RBAC Middleware (Roles + Permissions)                       │  │
│  │  • Sequelize ORM                                               │  │
│  │  • Rate Limiting (express-rate-limit)                          │  │
│  │  • Helmet Security Headers                                     │  │
│  │  • CORS Whitelisting                                           │  │
│  └────────┬─────────────┬────────────────┬───────────────────────┘  │
│           │             │                │                           │
│           ▼             ▼                ▼                           │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐            │
│  │ PostgreSQL   │ │ Cloudflare   │ │ Google Gemini AI  │            │
│  │ (Render DB)  │ │ R2 Storage   │ │ (Recommendations) │            │
│  └─────────────┘ └──────────────┘ └───────────────────┘            │
│                                                                      │
│  ┌───────────────────┐  ┌──────────────────┐                        │
│  │ Vector Search Svc  │  │ Gmail SMTP       │                        │
│  │ (Book Cover AI)    │  │ (Email / OTP)    │                        │
│  └───────────────────┘  └──────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Tech Stack

### 6.1 Backend API (`user-backend/`)

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Node.js | Latest LTS |
| **Framework** | Express.js | ^4.x |
| **ORM** | Sequelize | ^6.37.7 |
| **Database** | PostgreSQL | Hosted on Render |
| **Authentication** | JSON Web Tokens (jsonwebtoken) | ^9.0.3 |
| **Password Hashing** | bcryptjs | ^3.0.3 |
| **File Upload** | Multer (memory storage) | ^2.0.2 |
| **Object Storage** | Cloudflare R2 (S3-compatible, via @aws-sdk/client-s3) | ^3.1015.0 |
| **Email** | Nodemailer (Gmail SMTP) | ^8.0.1 |
| **AI** | Google Gemini 2.0 Flash API | REST API |
| **Security** | Helmet, CORS, express-rate-limit | Latest |
| **Logging** | Morgan (HTTP logging) | ^1.10.1 |
| **Validation** | express-validator | ^7.3.1 |
| **Realtime** | Socket.IO | ^4.8.3 |

### 6.2 Admin Dashboard (`elibrary-dashboard/`)

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js | ^16.2.1 |
| **UI Library** | React | ^19.2.0 |
| **Component Library** | shadcn/ui (Radix UI primitives) | Full suite |
| **Styling** | Tailwind CSS | ^4.0.0 |
| **State Management** | Redux Toolkit + RTK Query | ^2.11.2 |
| **Data Tables** | TanStack React Table | ^8.21.2 |
| **Forms** | React Hook Form + Zod validation | ^7.54.1 / ^4.1.8 |
| **Charts** | Recharts | ^2.15.1 |
| **PDF Viewer** | @react-pdf-viewer | ^3.12.0 |
| **DnD** | @dnd-kit | ^6.3.1 |
| **Animations** | Motion (Framer Motion) | ^11.17.0 |
| **Command Palette** | kbar | ^0.1.0-beta.45 |
| **Monitoring** | Sentry (@sentry/nextjs) | ^9.19.0 |
| **Theme** | next-themes | ^0.4.6 |
| **TypeScript** | TypeScript | 5.7.2 |

### 6.3 Student Frontend (`frontend/`)

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js | 16.2.1 |
| **UI Library** | React | 19.2.4 |
| **Component Library** | shadcn/ui (Radix UI) | Latest |
| **Styling** | Tailwind CSS | ^4 |
| **State Management** | Redux Toolkit + RTK Query | ^2.11.2 |
| **PDF Viewer** | @react-pdf-viewer + pdfjs-dist | ^3.12.0 / ^3.4.120 |
| **Animations** | Framer Motion | ^12.38.0 |
| **Theme** | next-themes | ^0.4.6 |
| **TypeScript** | TypeScript | ^5 |

---

## 7. Application Structure

### 7.1 Backend (`user-backend/src/`)

```
src/
├── index.js                    # Express app entry point, CORS, middleware, DB connect
├── config/
│   ├── constants.js            # File size limits, pagination defaults, HTTP status codes
│   ├── database.js             # Sequelize + PostgreSQL connection (SSL for Render)
│   └── r2.js                   # Cloudflare R2 S3Client configuration
├── controllers/
│   ├── activityController.js   # Activity log CRUD
│   ├── aiRecommendationController.js  # AI-powered book recommendations (Gemini)
│   ├── authController.js       # Register, login, refresh, profile, OTP, password reset
│   ├── authorController.js     # Author CRUD
│   ├── bookController.js       # Book CRUD + scan-search (vector)
│   ├── categoryController.js   # Category CRUD
│   ├── departmentController.js # Department CRUD
│   ├── downloadController.js   # PDF streaming, download recording, cover serving
│   ├── editorController.js     # Editor CRUD
│   ├── materialTypeController.js  # Material type CRUD
│   ├── permissionController.js # Permission management
│   ├── publisherController.js  # Publisher CRUD
│   ├── roleController.js       # Role management
│   ├── settingController.js    # Application settings (key-value store)
│   ├── statsController.js      # Dashboard analytics & statistics
│   ├── uploadController.js     # File upload to Cloudflare R2
│   └── userController.js       # User CRUD + role assignment
├── middleware/
│   ├── auth.js                 # authenticate, authorize, requirePermission, optionalAuth
│   ├── errorHandler.js         # Global error handling middleware
│   ├── rateLimiter.js          # Rate limiting configuration
│   ├── upload.js               # Multer configuration for file uploads
│   └── validation.js           # express-validator rules
├── models/                     # Sequelize model definitions (14 models)
├── routes/                     # Express router definitions (18 route files)
└── utils/
    ├── activityLogger.js       # Activity logging helper
    ├── cloudinaryUpload.js     # R2 upload utilities (named "cloudinary" for legacy reasons)
    ├── emailService.js         # Nodemailer email templates (OTP, password reset)
    ├── errors.js               # Custom error classes
    ├── helpers.js              # Utility functions (file size formatting, etc.)
    ├── logger.js               # Application logger
    ├── responseFormatter.js    # Standardized API response format
    └── vectorSearchService.js  # External vector search API integration
```

### 7.2 Admin Dashboard (`elibrary-dashboard/src/`)

```
src/
├── app/
│   ├── (auth)/                 # Login/register pages (auth layout)
│   ├── dashboard/
│   │   ├── overview/           # Analytics dashboard (charts, stats, recent activity)
│   │   ├── books/              # Book management (CRUD, categories, departments, etc.)
│   │   ├── users/              # User management (CRUD, roles, permissions)
│   │   ├── authors/            # Author management
│   │   ├── categories/         # Category management
│   │   ├── departments/        # Department management
│   │   ├── material-types/     # Material type management
│   │   ├── publishers/         # Publisher management
│   │   ├── profile/            # Admin/librarian profile
│   │   └── billing/            # Billing information
│   └── api/                    # Next.js API routes (auth proxy)
├── components/                 # Reusable UI components (shadcn/ui based)
│   ├── crud/                   # Generic CRUD components
│   ├── forms/                  # Form components
│   ├── kbar/                   # Command palette
│   ├── layout/                 # App shell, sidebar, header
│   ├── modal/                  # Modal/dialog components
│   ├── pdf-reader/             # PDF viewer component
│   └── ui/                     # shadcn/ui primitives
├── features/                   # Feature-specific components
│   ├── auth/                   # Authentication views
│   ├── books/                  # Book management views
│   ├── overview/               # Dashboard overview
│   └── profile/                # Profile management
├── services/                   # RTK Query API slices
│   ├── api.ts                  # Base API with auth re-auth logic
│   ├── authApi.ts              # Authentication endpoints
│   ├── bookApi.ts              # Book CRUD endpoints
│   ├── categoryApi.ts          # Category endpoints
│   ├── userApi.ts              # User management endpoints
│   └── ...                     # Author, editor, publisher, etc.
├── store/                      # Redux store + slices
├── hooks/                      # Custom React hooks
├── config/                     # Navigation config, data table config
├── types/                      # TypeScript type definitions
└── lib/                        # Utilities (cn, formatters, etc.)
```

### 7.3 Student Frontend (`frontend/`)

```
app/
├── page.tsx                    # Home page (Hero, Featured Books, Stats, CTA)
├── about/page.tsx              # About Norton E-Library (mission, team, milestones)
├── contact/page.tsx            # Contact page (form, FAQs, contact info)
├── books/
│   ├── page.tsx                # Book catalog (search, filter, grid/list view, pagination)
│   └── [id]/page.tsx           # Book detail (metadata, PDF reader, download, share)
├── library/page.tsx            # Personal library (favorites, reading history, progress)
├── profile/page.tsx            # User profile management
├── auth/
│   ├── signin/                 # Login page
│   ├── signup/                 # Registration page
│   ├── forgot-password/        # Forgot password (email → OTP)
│   └── reset-password/         # Reset password with OTP verification
└── api/                        # Next.js API proxy routes (auth, books, categories, stats)
```

---

## 8. Database Schema & Models

### Entity-Relationship Overview

```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│  Users   │────<│ UsersRoles   │>────│   Roles    │
└──────────┘     └──────────────┘     └─────┬──────┘
     │                                       │
     │           ┌──────────────────┐        │
     ├──────────<│ UsersPermissions │    ┌───┴──────────────┐
     │           └────────┬─────────┘    │ RolesPermissions │
     │                    │              └───┬──────────────┘
     │                    ▼                  │
     │           ┌──────────────┐            │
     │           │ Permissions  │<───────────┘
     │           └──────────────┘
     │
     ├──────────< Downloads >──────────┐
     │                                  │
     ├──────────< Activities            │
     │                                  ▼
     │                            ┌──────────┐
     │                            │  Books   │
     │                            └──┬───┬───┘
     │                               │   │
     │            ┌──────────────────┘   └───────────────┐
     │            ▼                                       ▼
     │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
     │   │ BookAuthor   │  │ BookEditor   │  │ PublishersBooks   │
     │   └───────┬──────┘  └───────┬──────┘  └────────┬─────────┘
     │           ▼                 ▼                   ▼
     │   ┌──────────┐     ┌──────────┐       ┌──────────────┐
     │   │ Authors  │     │ Editors  │       │ Publishers   │
     │   └──────────┘     └──────────┘       └──────────────┘
     │
     │   Books also belong to:
     │   ├── Categories
     │   ├── Departments
     │   └── MaterialTypes
```

### 8.1 Users

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, Auto-increment |
| `avatar` | VARCHAR(500) | Nullable |
| `username` | VARCHAR(50) | Unique, Not Null |
| `email` | VARCHAR(256) | Unique, Not Null |
| `password` | VARCHAR(256) | Not Null (bcrypt hashed) |
| `student_id` | VARCHAR(50) | Unique, Nullable |
| `first_name` | TEXT | Nullable |
| `last_name` | TEXT | Nullable |
| `is_active` | BOOLEAN | Default: true |
| `is_deleted` | BOOLEAN | Default: false (soft delete) |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto |

**Behaviors:**
- Password is automatically hashed via bcrypt (cost factor 10) on create/update hooks
- `toJSON()` strips the password field from API responses
- Login supports email, username, or studentId identification
- Default scope excludes soft-deleted users (`isDeleted: false`)

### 8.2 Books

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, Auto-increment |
| `title` | VARCHAR(500) | Not Null |
| `title_kh` | VARCHAR(500) | Nullable (Khmer title) |
| `isbn` | VARCHAR(20) | Unique, Nullable |
| `publication_year` | INTEGER | Nullable |
| `description` | TEXT | Nullable |
| `cover_url` | VARCHAR(500) | R2 presigned URL |
| `pdf_url` | VARCHAR(500) | R2 presigned URL |
| `pages` | INTEGER | Nullable |
| `views` | INTEGER | Default: 0 |
| `downloads` | INTEGER | Default: 0 |
| `publisher_id` | INTEGER | FK → Publishers |
| `category_id` | INTEGER | FK → Categories |
| `department_id` | INTEGER | FK → Departments |
| `type_id` | INTEGER | FK → MaterialTypes |
| `is_active` | BOOLEAN | Default: true |
| `is_deleted` | BOOLEAN | Default: false (soft delete) |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto |

**Relationships:**
- Many-to-Many → Authors (through `books_authors` with `is_primary_author`)
- Many-to-Many → Editors (through `books_editors`)
- Many-to-Many → Publishers (through `publishers_books`)
- Belongs To → Category, Publisher, Department, MaterialType
- Has Many → Downloads

### 8.3 Roles

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, Auto-increment |
| `name` | VARCHAR | Unique, Not Null |
| `description` | TEXT | Nullable |

**Predefined Roles:** `admin`, `librarian`, `user`

### 8.4 Permissions

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, Auto-increment |
| `name` | VARCHAR | Unique, Not Null |
| `description` | TEXT | Nullable |

**Seeded Permissions:**
- `users.view`, `users.create`, `users.update`, `users.delete`
- `roles.view`, `roles.create`, `roles.update`, `roles.delete`
- `permissions.view`, `permissions.assign`
- `books.view`, `books.create`, `books.update`, `books.delete`, `books.download`

### 8.5 Authors

| Column | Type |
|---|---|
| `id` | BIGINT (PK) |
| `name` | VARCHAR(255), Not Null |
| `name_kh` | VARCHAR(255), Nullable (Khmer) |
| `biography` | TEXT |
| `website` | VARCHAR(255) |

### 8.6 Editors

| Column | Type |
|---|---|
| `id` | BIGINT (PK) |
| `name` | VARCHAR(255), Not Null |
| `name_kh` | VARCHAR(255), Nullable (Khmer) |
| `biography` | TEXT |
| `website` | VARCHAR(255) |

### 8.7 Categories

| Column | Type |
|---|---|
| `id` | INTEGER (PK) |
| `name` | VARCHAR(255), Unique, Not Null |
| `name_kh` | VARCHAR(255), Nullable (Khmer) |
| `description` | TEXT |

### 8.8 Publishers

| Column | Type |
|---|---|
| `id` | INTEGER (PK) |
| `name` | VARCHAR(255), Not Null |
| `name_kh` | VARCHAR(255), Nullable (Khmer) |
| `address` | TEXT |
| `contact_email` | VARCHAR(255) |

### 8.9 Departments

| Column | Type |
|---|---|
| `id` | INTEGER (PK) |
| `code` | VARCHAR(50), Unique, Not Null |
| `name` | VARCHAR(255), Not Null |
| `name_kh` | VARCHAR(255), Nullable (Khmer) |
| `description` | TEXT |

### 8.10 Material Types

| Column | Type |
|---|---|
| `id` | INTEGER (PK) |
| `name` | VARCHAR(100), Not Null |
| `name_kh` | VARCHAR(100), Nullable (Khmer) |
| `description` | TEXT |

**Examples:** Book, Thesis, Dissertation, Journal, Article

### 8.11 Downloads

| Column | Type |
|---|---|
| `id` | BIGINT (PK) |
| `user_id` | BIGINT, FK → Users |
| `book_id` | BIGINT, FK → Books |
| `downloaded_at` | TIMESTAMP, Default: NOW |
| `ip_address` | VARCHAR(45) |

### 8.12 Activities

| Column | Type |
|---|---|
| `id` | BIGINT (PK) |
| `user_id` | BIGINT, FK → Users, Nullable |
| `action` | VARCHAR(50) — `created`, `updated`, `deleted`, `login`, `download` |
| `target_id` | BIGINT, Nullable |
| `target_name` | VARCHAR(255), Nullable |
| `target_type` | VARCHAR(50) — `book`, `user`, `category`, etc. |
| `metadata` | JSON, Nullable |
| `created_at` | TIMESTAMP |

### 8.13 Settings

| Column | Type |
|---|---|
| `key` | VARCHAR(100), PK |
| `value` | TEXT |
| `group` | VARCHAR(50), Default: `general` |
| `type` | VARCHAR(20) — `string`, `json`, `boolean`, `number` |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

### Junction Tables

| Table | Columns | Purpose |
|---|---|---|
| `users_roles` | `user_id`, `role_id` | User ↔ Role mapping |
| `roles_permissions` | `role_id`, `permission_id` | Role ↔ Permission mapping |
| `users_permissions` | `user_id`, `permission_id` | Direct user permissions |
| `books_authors` | `book_id`, `author_id`, `is_primary_author` | Book ↔ Author mapping |
| `books_editors` | `book_id`, `editor_id` | Book ↔ Editor mapping |
| `publishers_books` | `publisher_id`, `book_id` | Publisher ↔ Book mapping |

---

## 9. API Specification

**Base URL:** `https://<render-host>/api`

### 9.1 Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user (auto-assigns `user` role) |
| POST | `/auth/login` | Public | Login with email/username/studentId + password |
| POST | `/auth/refresh` | Public | Refresh access token using refresh token |
| POST | `/auth/logout` | Bearer | Logout (client-side token discard) |
| GET | `/auth/me` | Bearer | Get current user profile (alias for `/profile`) |
| GET | `/auth/profile` | Bearer | Get current user profile with roles |
| PATCH | `/auth/profile` | Bearer | Update profile (name, email, studentId) |
| GET | `/auth/avatar` | Bearer | Get user avatar (R2 presigned URL redirect) |
| POST | `/auth/avatar` | Bearer | Upload avatar image |
| PUT | `/auth/change-password` | Bearer | Change password (requires current password) |
| POST | `/auth/forgot-password` | Public | Request OTP code via email |
| POST | `/auth/verify-otp` | Public | Verify 6-digit OTP → get resetToken |
| POST | `/auth/reset-password` | Public | Set new password using resetToken |

### 9.2 Books (`/api/books`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/books` | Public | List books (paginated, search, filter, sort) |
| GET | `/books/:id` | Public | Get book details (auto-increments view count) |
| POST | `/books` | Admin/Librarian | Create book |
| PUT | `/books/:id` | Admin/Librarian | Update book |
| DELETE | `/books/:id` | Admin only | Soft-delete book |
| POST | `/books/scan-search` | Public | AI-powered visual book cover scan search |
| GET | `/books/:id/cover` | Public | Redirect to presigned R2 cover image URL |
| GET | `/books/:id/pdf-url` | Bearer | Get presigned R2 URL for PDF |
| GET | `/books/:id/stream` | Public | Stream/proxy PDF inline (no auth needed) |
| GET | `/books/:id/download` | Bearer (stream) | Download PDF + record in downloads table |
| GET | `/books/:id/downloads` | Admin/Librarian | Get download stats for a book |

**Query Parameters for GET `/books`:**
- `page`, `limit` — Pagination (default: 1, 10)
- `search` — Search title, titleKh, isbn, description (iLike)
- `categoryId`, `publisherId`, `departmentId`, `typeId` — Filters
- `publicationYear`, `isActive` — Additional filters
- `sortBy`, `sortOrder` — Sorting (default: `created_at` DESC)

### 9.3 Users (`/api/users`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin | List all users (paginated, searchable) |
| GET | `/users/:id` | Admin | Get user with roles & permissions |
| POST | `/users` | Admin | Create user (admin-created) |
| PUT | `/users/:id` | Admin | Update user |
| DELETE | `/users/:id` | Admin | Soft-delete user (cannot delete self) |
| PATCH | `/users/:id/roles` | Admin | Assign roles to user |
| PATCH | `/users/:id/permissions` | Admin | Assign direct permissions to user |

### 9.4 Roles (`/api/roles`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/roles` | Admin | List all roles |
| GET | `/roles/:id` | Admin | Get role with permissions |
| POST | `/roles` | Admin | Create role |
| PUT | `/roles/:id` | Admin | Update role |
| DELETE | `/roles/:id` | Admin | Delete role |
| PATCH | `/roles/:id/permissions` | Admin | Assign permissions to role |

### 9.5 Metadata CRUD Endpoints

Each of these follows standard REST CRUD pattern:

| Resource | Base Path | Auth (Write) |
|---|---|---|
| Categories | `/api/categories` | Admin/Librarian |
| Authors | `/api/authors` | Admin/Librarian |
| Editors | `/api/editors` | Admin/Librarian |
| Publishers | `/api/publishers` | Admin/Librarian |
| Material Types | `/api/material-types` | Admin/Librarian |
| Departments | `/api/departments` | Admin/Librarian |
| Permissions | `/api/permissions` | Admin |

### 9.6 File Uploads (`/api/uploads`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/uploads/single` | Admin/Librarian | Upload single file (cover, pdf, avatar) to R2 |
| POST | `/uploads/multiple` | Admin/Librarian | Upload multiple files (cover + pdf) to R2 |
| DELETE | `/uploads/delete` | Admin/Librarian | Delete file from R2 by key or URL |

**File Limits:**
- PDF: Max 10 MB
- Image: Max 5 MB
- Accepted image types: JPEG, PNG, WebP

### 9.7 Downloads (`/api/downloads`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/downloads/my` | Bearer | Get current user's download history |
| GET | `/downloads/stats` | Admin | Download statistics |
| GET | `/downloads` | Admin/Librarian | List all downloads |

### 9.8 Statistics (`/api/stats`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/stats` | Public | Public stats (total books, members, categories) |
| GET | `/stats/overview` | Admin/Librarian | Full dashboard analytics |
| GET | `/stats/popular` | Public | Most viewed books |
| GET | `/stats/recent` | Public | Recently added books |

**Overview stats include:**
- Total counts (books, members, authors, categories, downloads, theses, journals, articles)
- Upload trends (last 5 years)
- Category distribution
- Recent activities (filterable by days)
- Role-based activity stats (create/update/delete counts per role)

### 9.9 AI Recommendations (`/api/ai`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/ai/recommendations?category=X` | Public | AI recommendations by category |
| GET | `/ai/recommendations?bookTitle=X` | Public | AI recommendations similar to a book |
| GET | `/ai/recommendations?userId=current` | Bearer | Personalized recommendations from download history |
| GET | `/ai/recommendations/trending` | Public | Trending books with AI-generated reasons |
| GET | `/ai/recommendations/similar/:bookId` | Public | Similar books by book ID |
| POST | `/ai/recommendations/personalized` | Public | Custom personalized recommendations |
| POST | `/ai/recommendations/chat` | Public | Conversational AI library assistant |

**Rate Limit:** 20 requests per minute per IP (all AI endpoints)

### 9.10 Activities & Settings

| Resource | Base Path | Auth |
|---|---|---|
| Activities | `/api/activities` | Admin/Librarian |
| Settings | `/api/settings` | Admin |

---

## 10. Features — Student Frontend

### 10.1 Home Page
- **Hero Section** — Animated gradient background with floating particles, search bar, marquee of book covers
- **Featured Books** — Top 15 books sorted by views, ranked badges (#1 Most Read, #2 Trending, etc.)
- **Statistics Section** — Live stats from API (total books, active students, subject areas, 24/7 badge)
- **Categories Section** — Browse by subject category
- **Testimonials Section** — Student testimonials carousel
- **CTA Section** — Call to action for registration

### 10.2 Book Catalog (`/books`)
- **Grid/List View Toggle** — Switch between card grid and list layout
- **Search** — Real-time full-text search across titles, ISBNs, descriptions
- **Category Filter** — Filter by category dropdown
- **Sort Options** — Newest First, Title A–Z, Most Viewed, Most Downloaded
- **Pagination** — Server-side pagination with page navigation
- **Skeleton Loading** — Animated skeleton cards during data fetch

### 10.3 Book Detail Page (`/books/:id`)
- **Book Metadata** — Title (EN + KH), ISBN, publication year, pages, description
- **Related Info** — Category, department, material type, publisher, authors
- **Cover Image** — R2 presigned URL with gradient fallback
- **View Count** — Auto-incremented on page visit
- **Actions:**
  - 📖 **Read Online** — Opens in-browser PDF reader (react-pdf-viewer)
  - ⬇️ **Download PDF** — Authenticated download with tracking
  - ❤️ **Add to Favorites** — Saved to localStorage (per-user)
  - 🔗 **Share** — Share via Twitter, Facebook, or copy link

### 10.4 PDF Reader
- **Full-featured PDF viewer** — Powered by `@react-pdf-viewer` with default layout plugin
- **Page Position Memory** — Saves last-read page per book per user in localStorage
- **Reading Time Tracking** — Dispatches reading time every 30 seconds to Redux
- **Reading Progress** — Tracks current page / total pages with completion percentage
- **Completion Celebration** — Toast notification when user finishes a book

### 10.5 Personal Library (`/library`)
- **Favorites Tab** — Favorited books with remove option
- **Reading History** — Recently viewed books with timestamps
- **Reading Progress** — Track reading progress per book (page/total, percentage)
- **Stats Cards** — Total favorites, recently viewed count, completion rate
- All data persisted in localStorage (per user ID)

### 10.6 User Profile (`/profile`)
- **View/Edit Profile** — First name, last name, email, student ID
- **Avatar Upload** — Image upload to R2 with preview, max 5 MB
- **Change Password** — Current password + new password with confirmation
- **Account Info** — Roles display, registration date

### 10.7 Authentication
- **Sign In** — Login with email, username, or student ID
- **Sign Up** — Registration with username, email, password, name, student ID
- **Forgot Password** — 3-step flow:
  1. Enter email → receive 6-digit OTP via Gmail
  2. Enter OTP → verify code → receive reset token
  3. Enter new password → reset complete
- **Session Management** — JWT access token + refresh token with auto-refresh

### 10.8 Static Pages
- **About** — Mission, vision, values, team members (with photos), milestones timeline
- **Contact** — Contact info, quick-link topics, contact form, FAQ accordion

---

## 11. Features — Admin Dashboard

### 11.1 Dashboard Overview (`/dashboard/overview`)
- **Summary Cards** — Total books, theses, members, journals, authors, categories, articles
- **Upload Trends Chart** — Books uploaded per year (last 5 years) via Recharts
- **Category Distribution** — Pie/bar chart of books per category
- **Role Activity Stats** — Create/update/delete counts grouped by role
- **Recent Activities Feed** — Last 10 activities with user info, action, timestamp
- **Activity Filter** — Filter by time period (today, 7 days, 30 days, all)

### 11.2 Book Management (`/dashboard/books`)
- **Data Table** — Full-featured table with TanStack React Table
  - Server-side pagination, search, filtering, sorting
  - Column visibility toggle
  - Row selection for bulk operations
- **Create Book** — Multi-field form with:
  - Title (EN + KH), ISBN, publication year, description, pages
  - Category, department, material type selection (dropdowns)
  - Author names (find-or-create), editor names, publisher names
  - Cover image upload + PDF upload (pre-upload to R2, then pass URLs)
  - Active/inactive toggle
- **Edit Book** — Pre-populated form with all book data
- **Delete Book** — Soft delete with confirmation dialog
- **Sub-pages:**
  - `/dashboard/books/categories` — Category CRUD
  - `/dashboard/books/departments` — Department CRUD
  - `/dashboard/books/material-types` — Material Type CRUD
  - `/dashboard/books/publishers` — Publisher CRUD
  - `/dashboard/books/authors` — Author CRUD
  - `/dashboard/books/editors` — Editor CRUD

### 11.3 User Management (`/dashboard/users`) — Admin Only
- **User Table** — List all users with search, pagination
- **Create User** — Admin-created users with role assignment
- **Edit User** — Update profile, status, roles
- **Deactivate/Delete** — Soft-delete (cannot delete self)
- **Role Assignment** — Assign/remove roles via PATCH
- **Permission Assignment** — Direct user-level permission assignment
- **Sub-pages:**
  - `/dashboard/users/roles` — Role CRUD + permission assignment
  - `/dashboard/users/permissions` — Permission management

### 11.4 Navigation & UX
- **Sidebar Navigation** — Collapsible sidebar with icon + text, nested sub-items
- **Keyboard Shortcuts** — kbar command palette (⌘K) for quick navigation
- **Breadcrumbs** — Dynamic breadcrumb trail
- **Theme Switching** — Light/Dark/System mode via `next-themes`
- **Toast Notifications** — Success/error feedback via Sonner
- **Responsive Design** — Mobile-friendly with responsive sidebar

### 11.5 Profile & Account
- **Profile Page** — Edit admin/librarian profile
- **Billing Page** — Billing information display

---

## 12. Features — Backend API

### 12.1 Authentication System
- **JWT-Based Auth** — Access token (30-day expiry) + Refresh token (60-day expiry)
- **Multi-Identifier Login** — Login via email, username, or student ID
- **Password Security** — bcryptjs hashing with cost factor 10
- **Token Refresh** — Automatic token refresh with mutex to prevent race conditions
- **OTP Password Reset** — 6-digit OTP embedded in JWT, sent via Gmail SMTP
  - Session token (10-min expiry) → OTP verification → Reset token (15-min expiry)
  - Tokens signed with `SECRET + password_hash` (auto-invalidate on password change)

### 12.2 Role-Based Access Control (RBAC)
- **Three-Level Authorization:**
  1. `authenticate` — Verify JWT, load user with roles + permissions
  2. `authorize(...roles)` — Check if user has any of the specified roles
  3. `requirePermission(name)` — Check specific granular permission
- **Special Middleware:**
  - `optionalAuth` — Attach user if token present, continue regardless
  - `authenticateStream` — Accept token from `Authorization` header OR `?token=` query param (for PDF iframe/download URLs)

### 12.3 File Management
- **Cloudflare R2 Storage** (S3-compatible)
  - Cover images: `books/covers/` prefix
  - PDFs: `books/pdfs/` prefix
  - Avatars: `users/avatars/` prefix
- **Presigned URLs** — Time-limited (1-hour) R2 URLs for secure file access
- **PDF Streaming** — Server-side proxy with redirect following, timeout handling, proper content headers
- **Upload Flow:** Files uploaded via `/api/uploads/single` → R2 → URL returned → Book created with URL reference

### 12.4 Activity Logging
- Automatic logging of all CRUD operations
- Tracks: user ID, action type, target entity, target name, metadata
- Used for admin dashboard recent activity feed

### 12.5 Statistics Engine
- Real-time dashboard analytics
- Counts by material type (books, theses, journals, articles)
- Upload trends over 5 years
- Category distribution
- Role-based activity aggregation
- Public stats endpoint for frontend

### 12.6 Vector Search Service Integration
- External microservice for image-based book search
- **Index:** When a book is created/updated, its cover image is indexed
- **Search:** Upload a photo of a book cover → find matching books via vector similarity
- **Delete:** When a book is deleted, its vector index entry is removed

### 12.7 Database Connection Resilience
- Render free-tier databases may sleep after inactivity
- Automatic retry logic: 5 attempts with 3-second delays
- Graceful exit after all retries exhausted

---

## 13. Authentication & Authorization

### Token Flow

```
┌──────────┐   POST /auth/login    ┌──────────┐
│  Client  │ ────────────────────> │  Server  │
│          │ <──────────────────── │          │
│          │   { accessToken,      │          │
│          │     refreshToken }    │          │
│          │                       │          │
│          │   GET /books (Bearer) │          │
│          │ ────────────────────> │          │
│          │                       │ verify   │
│          │                       │ JWT      │
│          │ <──────────────────── │ load     │
│          │   { books: [...] }    │ user     │
│          │                       │          │
│          │   401 (token expired) │          │
│          │ <──────────────────── │          │
│          │                       │          │
│          │   POST /auth/refresh  │          │
│          │ ────────────────────> │          │
│          │ <──────────────────── │          │
│          │   { newAccessToken }  │          │
└──────────┘                       └──────────┘
```

### Password Reset Flow

```
1. POST /auth/forgot-password { email }
   → Server generates 6-digit OTP
   → OTP embedded in JWT (sessionToken) signed with SECRET+passwordHash
   → OTP sent to user's email via Gmail SMTP
   → Returns { sessionToken } to frontend

2. POST /auth/verify-otp { sessionToken, otp }
   → Verify JWT signature + expiry
   → Compare OTP codes
   → Returns { resetToken } (15-min expiry)

3. POST /auth/reset-password { resetToken, password, confirmPassword }
   → Verify resetToken (signed with SECRET+passwordHash+'_reset')
   → Update password (auto-hashed via hook)
   → Old tokens auto-invalidated (passwordHash changed)
```

---

## 14. AI-Powered Features

### 14.1 AI Book Recommendations (Google Gemini 2.0 Flash)

The system uses Google's Gemini AI to provide intelligent book recommendations:

| Feature | Endpoint | Strategy |
|---|---|---|
| **By Category** | `?category=X` | Fetches library books in category → asks Gemini to rank top 6 |
| **By Book Title** | `?bookTitle=X` | Finds similar books in same category → Gemini recommends top 5 |
| **By User History** | `?userId=current` | Analyzes user's download history → Gemini suggests unread books |
| **Personalized** | POST `/personalized` | Custom mix of history, categories, and reference book |
| **Trending** | GET `/trending` | Most downloaded (30 days) + most viewed → Gemini explains why |
| **Similar Books** | GET `/similar/:id` | Finds source book → recommends from same category |
| **Chat** | POST `/chat` | Conversational AI library assistant (max 500 chars) |

**Key Design Decisions:**
- **Library-Grounded:** AI always recommends from actual books in the database when possible
- **Fallback:** If no library books match, returns general AI suggestions with `source: "ai-general"`
- **Caching:** In-memory cache with 5-minute TTL, max 200 entries
- **Rate Limiting:** 20 requests/minute per IP
- **Error Handling:** Graceful degradation when Gemini API is unavailable

### 14.2 Visual Book Cover Search (Vector Search)

- External vector search microservice integration
- Users can upload a photo of a book cover
- System converts image to vector embedding → searches for similar covers in the database
- Returns matched books with similarity scores
- Cover images are automatically indexed/synced when books are created or updated

---

## 15. File Storage & Media

### Cloudflare R2 (S3-Compatible Object Storage)

| Asset Type | R2 Path Prefix | Max Size | Formats |
|---|---|---|---|
| Book Covers | `books/covers/` | 5 MB | JPEG, PNG, WebP |
| Book PDFs | `books/pdfs/` | 10 MB | PDF |
| User Avatars | `users/avatars/` | 5 MB | JPEG, PNG, WebP |

**Access Pattern:**
- Files uploaded to R2 via `@aws-sdk/client-s3`
- Stored URLs reference R2 object keys
- Served via presigned URLs (1-hour expiry) using `@aws-sdk/s3-request-presigner`
- Book covers served publicly via redirect (`GET /books/:id/cover`)
- PDFs require authentication for download; public streaming available

---

## 16. Third-Party Integrations

| Service | Purpose | Integration |
|---|---|---|
| **Cloudflare R2** | Object storage for PDFs, covers, avatars | AWS S3 SDK |
| **Google Gemini AI** | Book recommendations & chat assistant | REST API (`gemini-2.0-flash`) |
| **Gmail SMTP** | Email delivery (OTP for password reset) | Nodemailer |
| **Vector Search Service** | Image-based book cover search | External microservice (REST) |
| **Sentry** | Error monitoring (Dashboard) | `@sentry/nextjs` |
| **PDF.js** | Client-side PDF rendering | `pdfjs-dist` + `@react-pdf-viewer` |
| **Vercel** | Frontend hosting (both apps) | Git-based deployment |
| **Render** | Backend + PostgreSQL hosting | Docker/Node.js deployment |

---

## 17. Non-Functional Requirements

### 17.1 Performance
- Server-side pagination for all list endpoints (configurable: default 10, max 100)
- In-memory caching for AI recommendations (5-min TTL)
- Presigned URL caching headers (`Cache-Control: private, max-age=3600`)
- JWT verification is synchronous (no DB hit) before loading user
- **Two-query strategy** for `GET /api/books` — separate `COUNT` + paginated `findAll` to avoid GROUP BY issues with M:N JOINs
- **N+1 prevention** — shared `BOOK_INCLUDE` constant with eager-loaded associations; batch queries with `Promise.all` in stats endpoints
- **Rating subqueries** — `averageRating` and `reviewCount` computed as correlated SQL subqueries (no extra N+1 queries per book)
- **Database indexes** — composite indexes on junction tables, reverse-key indexes, covering indexes on frequently filtered columns
- **Connection pool** — `{ max: 20, min: 5, acquire: 30000, idle: 10000 }` for production workloads
- **gzip compression** — Express `compression` middleware for all responses
- **RTK Query cache** — `keepUnusedDataFor` configured per endpoint (categories: 1hr, stats: 30min)
- **Sort whitelist** — injection-safe column whitelist for dynamic ORDER BY

### 17.2 Security
- **Helmet.js** — Security HTTP headers
- **CORS Whitelist** — Only approved origins allowed
- **Rate Limiting** — AI endpoints: 20 req/min; general: configurable
- **bcryptjs** — Password hashing (cost factor 10)
- **JWT** — Signed tokens with separate secrets for access, refresh, and password reset
- **SQL Injection Prevention** — Sequelize ORM with parameterized queries
- **Soft Deletes** — Data preservation for audit trails
- **Input Validation** — express-validator on auth routes
- **File Validation** — MIME type and size checks before upload
- **CSRF Protection** — Separate token flows for API vs cookie-based auth

### 17.3 Reliability
- **DB Connection Retry** — 5 attempts with 3-second backoff (handles Render cold starts)
- **Graceful Error Handling** — Global error handler with standardized response format
- **Error Monitoring** — Sentry integration in admin dashboard
- **Activity Logging** — Full audit trail of all operations

### 17.4 Accessibility
- **Bilingual Support** — English + Khmer (ភាសាខ្មែរ) for titles and metadata fields
- **Responsive Design** — Mobile-first approach for all frontends
- **Dark/Light Mode** — System-aware theme switching
- **Keyboard Navigation** — Command palette (⌘K) in admin dashboard

### 17.5 Scalability
- **Stateless Backend** — JWT-based auth, no server-side sessions
- **Cloud-Native Storage** — Cloudflare R2 for unlimited file storage
- **Managed Database** — PostgreSQL on Render with SSL
- **Microservice Pattern** — Vector search as separate service

### 17.6 Database Integrity
- **Sequelize CLI Migrations** — version-controlled schema changes (replaces `sync({ alter: true })`)
- **UNIQUE constraints** — `authors.name`, `editors.name`, `publishers.name`, `material_types.name`, `departments.name`, `categories.name`, `roles.name`, `permissions.name`
- **Foreign key constraints** — all associations have explicit `ON DELETE` / `ON UPDATE` rules:
  - Book belongsTo (Category, Publisher, Department, MaterialType): `SET NULL`
  - Junction tables (BookAuthor, BookEditor, PublishersBooks, UsersRoles, etc.): `CASCADE`
  - Downloads, Reviews: `CASCADE`
  - Activities: `SET NULL`
- **Performance indexes** — reverse-key indexes on junction tables, composite indexes on `downloads(user_id, book_id)`, indexes on `users.is_deleted`, `books.downloads`, `settings.group`
- **CHECK constraint** — `reviews.rating` between 1–5
- **Partial unique index** — `reviews(book_id, user_id)` WHERE `is_deleted = false` (one active review per user per book)
- **Safe migration helpers** — `safeAddIndex()` / `safeAddConstraint()` for idempotent catch-up migrations

---

## 18. Deployment & Infrastructure

### 18.1 Environments

| Component | Platform | URL |
|---|---|---|
| **Backend API** | Render (Node.js) | `https://<render-service>.onrender.com` |
| **PostgreSQL Database** | Render (Managed DB) | Internal connection via `DATABASE_URL` |
| **Student Frontend** | Vercel | `https://frontend.samnangchan.shop/` / `frontend.samnangchan.shop` |
| **Admin Dashboard** | Vercel | `https://admin-elibrary.samnangchan.shop/` / `admin-elibrary.samnangchan.shop` |
| **File Storage** | Cloudflare R2 | S3-compatible endpoint |
| **Vector Search** | External service | Configurable URL |

### 18.2 Backend Deployment (Render)
- **Build Command:** `npm install`
- **Start Command:** `node src/index.js`
- **Database Migrations:** `npx sequelize-cli db:migrate` (run before deploy or as part of build)
- **Migration Config:** `.sequelizerc` → `src/config/sequelize-cli-config.js` (reads `DATABASE_URL`)
- **Cold Start Handling:** Retry loop for DB connection (5 attempts, 3s backoff)
- **No auto-sync** — `sequelize.sync()` removed; all schema changes via versioned migrations
- **Active DB Instance (May 2026):** `nu_elibrary_db_nvwp` on Render Singapore (`dpg-d7h07ej7uimc73d1o6qg-a.singapore-postgres.render.com`)
- **DB Migration:** Database backup restored to new Render PostgreSQL instance on April 18, 2026 using `scripts/restore-db.sh` with compressed `pg_dump` backup.
- **AI Route Fix (April 19, 2026):** `aiRecommendations` router was defined but not mounted — fixed by adding `router.use('/api/ai/recommendations', aiRecommendationRoutes)` in `src/routes/index.js`. All AI recommendation endpoints now fully reachable.
- **Stable Operations (May 2026):** All systems confirmed stable as of May 8, 2026. Sentry error rate nominal, DB performance steady, production monitoring via `monitor-prod.sh` running continuously.

### 18.3 Frontend Deployment (Vercel)
- **Framework:** Next.js (auto-detected by Vercel)
- **Build:** `next build`
- **Environment Variables:** Set via Vercel dashboard
- **Student Frontend Port:** 3000 (default)
- **Admin Dashboard Port:** 3001 (dev only)

---

## 19. Environment Variables

### Backend (`user-backend/.env.local`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5005) |
| `DATABASE_URL` | PostgreSQL connection string (Render) — e.g. `postgresql://nu_elibrary_db_nvwp_user:***@dpg-d7h07ej7uimc73d1o6qg-a.singapore-postgres.render.com/nu_elibrary_db_nvwp` |
| `ACCESS_TOKEN_SECRET` | JWT access token signing secret |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token expiry (default: 30d) |
| `REFRESH_TOKEN_SECRET` | JWT refresh token signing secret |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiry (default: 60d) |
| `FORGOT_PASSWORD_SECRET` | JWT secret for password reset flow |
| `R2_ENDPOINT` | Cloudflare R2 S3 endpoint |
| `R2_ACCESS_KEY` | R2 access key ID |
| `R2_SECRET_KEY` | R2 secret access key |
| `R2_BUCKET` | R2 bucket name |
| `EMAIL_USER` | Gmail address for SMTP |
| `EMAIL_PASS` | Gmail app password |
| `GOOGLE_AI_API_KEY` | Google Gemini API key |
| `VECTOR_SEARCH_SERVICE_URL` | Vector search microservice URL |

### Frontends (`.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API base URL |
| `NEXT_PUBLIC_APP_URL` | Frontend application URL |

---

## 20. Team

| Name | Role |
|---|---|
| **Hoeurn Chanthorn** | Project Advisor |
| **Chan Samnang** | Full-Stack Developer (Lead) |
| **Hoeung Phearun** | Full-Stack Developer |
| **Dok Dara** | Full-Stack Developer |
| **Rorsat Sorphiny** | Full-Stack Developer |

---

## Appendix A: API Response Format

All API responses follow a standardized format:

```json
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Book not found",
    "details": null
  }
}

// Paginated List
{
  "success": true,
  "data": {
    "books": [...],
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

## Appendix B: Custom Error Classes

| Error Class | HTTP Status | Code |
|---|---|---|
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `AuthenticationError` | 401 | `UNAUTHORIZED` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ConflictError` | 409 | `CONFLICT` |
| Internal Server Error | 500 | `INTERNAL_SERVER_ERROR` |

---

## Appendix C: Postman Collection

**File:** `user-backend/E-Library-API.postman_collection.json`  
**Created:** April 19, 2026  

A complete Postman collection covering all API endpoints is available for import:

| Group | Requests |
|---|---|
| Auth | 13 |
| Users | 7 |
| Roles | 6 |
| Permissions | 3 |
| Books | 11 |
| Categories / Authors / Editors / Publishers / Material Types / Departments | 6 each |
| File Uploads | 3 |
| Downloads | 3 |
| Reviews | 5 |
| Statistics | 4 |
| Settings | 4 |
| Activities | 3 |
| Push Notifications | 4 |
| Feedback | 6 |
| AI Recommendations | 7 |

**Features:**
- Collection variable `baseUrl` pre-set to `{{baseUrl}}`
- Login request auto-saves `accessToken` via test script
- Per-resource variables: `userId`, `bookId`, `roleId`, `categoryId`, `authorId`, `feedbackId`, etc.
- Bearer token applied globally via collection auth

**Import:** Postman → Import → select `E-Library-API.postman_collection.json` → set `baseUrl` to your backend URL.

---

> **© 2026 Norton University E-Library · Phnom Penh, Cambodia**
