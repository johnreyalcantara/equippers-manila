# Equippers Manila — Full Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Setup & Installation](#4-setup--installation)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Authentication System](#7-authentication-system)
8. [Frontend Architecture](#8-frontend-architecture)
9. [User Guide — Members](#9-user-guide--members)
10. [User Guide — Admin](#10-user-guide--admin)
11. [Business Logic](#11-business-logic)
12. [Security](#12-security)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Project Overview

Equippers Manila is a church website and management system that provides:

- **Public landing page** with splash animation, hero section, and connect hub
- **Member portal** for attendance tracking, seat reservations, donations, and photos
- **Admin panel** for managing services, viewing analytics, and uploading photos

The system supports two roles: **USER** (church members) and **ADMIN** (church staff).

---

## 2. Tech Stack

| Layer      | Technology                                     |
|------------|------------------------------------------------|
| Frontend   | HTML, CSS, JavaScript (no frameworks)          |
| Backend    | Node.js, Express.js                            |
| Database   | MySQL                                          |
| Auth       | JWT (jsonwebtoken) + bcrypt password hashing   |
| File Upload| Multer                                         |
| Charts     | Chart.js (CDN)                                 |

### NPM Dependencies

| Package        | Version  | Purpose                        |
|----------------|----------|--------------------------------|
| express        | ^4.18    | Web framework & static serving |
| mysql2         | ^3.9     | Async MySQL driver             |
| bcrypt         | ^5.1     | Password hashing (12 rounds)   |
| jsonwebtoken   | ^9.0     | JWT token creation/verification|
| dotenv         | ^16.4    | Environment variable loading   |
| multer         | ^1.4     | Multipart file upload handling |
| cors           | ^2.8     | Cross-origin request support   |
| uuid           | ^9.0     | Unique filenames for uploads   |

---

## 3. Project Structure

```
equippers-manila/
│
├── server.js                  # Express entry point, route mounting, admin seeding
├── package.json               # Node dependencies and scripts
├── .env                       # Environment variables (DB credentials, JWT secret)
├── .gitignore                 # Excludes node_modules, .env, uploaded photos
│
├── config/
│   └── db.js                  # MySQL connection pool (mysql2/promise)
│
├── middleware/
│   └── auth.js                # verifyToken() and requireAdmin() middleware
│
├── routes/
│   ├── auth.js                # POST /api/auth/signup, /api/auth/login
│   ├── users.js               # GET/PUT /api/users/me
│   ├── services.js            # GET /api/services/upcoming, POST /api/services
│   ├── attendance.js          # POST/DELETE /api/attendance, GET /api/attendance/streak
│   ├── reservations.js        # POST/DELETE /api/reservations, GET /api/reservations/mine
│   ├── donations.js           # POST /api/donations, GET /api/donations/mine
│   ├── photos.js              # POST /api/photos/request, GET /api/photos/album
│   ├── verses.js              # GET /api/verses/today
│   └── admin.js               # All /api/admin/* endpoints (stats, tables, uploads)
│
├── db/
│   ├── schema.sql             # Full CREATE TABLE statements (8 tables)
│   └── seed.sql               # Sample services data
│
├── uploads/
│   └── photos/                # Admin-uploaded photos stored here
│
├── index.html                 # Public landing page (splash + hero + connect hub)
├── style.css                  # Landing page styles
├── script.js                  # Splash animation + connect hub scroll animations
│
├── css/
│   ├── common.css             # Shared app styles (nav, cards, tables, buttons, forms)
│   └── auth.css               # Login/signup page styles (glass morphism dark theme)
│
├── js/
│   ├── api.js                 # Frontend API client (fetch wrapper with JWT handling)
│   ├── auth.js                # Login/signup form handlers
│   ├── dashboard.js           # User dashboard logic (streak, verse, services)
│   ├── donations.js           # Donation form and history
│   ├── photos.js              # Photo request and album viewer
│   ├── settings.js            # Account settings form
│   └── admin/
│       ├── dashboard.js       # Admin stats + Chart.js charts
│       ├── tables.js          # Shared data table with date filtering
│       └── photos.js          # Admin photo upload and request viewer
│
└── pages/
    ├── login.html             # User/admin login page
    ├── signup.html            # New user registration page
    ├── dashboard.html         # User dashboard
    ├── donations.html         # GCash donation submission
    ├── photos.html            # Photo request + album
    ├── settings.html          # Account settings
    └── admin/
        ├── dashboard.html     # Admin dashboard (stats + charts)
        ├── users.html         # Admin users table
        ├── attendance.html    # Admin attendance table
        ├── reservations.html  # Admin reservations table
        ├── donations.html     # Admin donations table
        └── photos.html        # Admin photo upload + requests
```

---

## 4. Setup & Installation

### Prerequisites

- **Node.js** v18 or higher
- **MySQL** 8.0 or higher
- **npm** (comes with Node.js)

### Step 1 — Clone and install dependencies

```bash
cd equippers-manila
npm install
```

### Step 2 — Configure environment

Edit `.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=equippers_manila
JWT_SECRET=eqprs_jwt_secret_key_2026
PORT=3000
```

### Step 3 — Create the database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS equippers_manila;"
mysql -u root -p equippers_manila < db/schema.sql
```

Optionally seed sample services:

```bash
mysql -u root -p equippers_manila < db/seed.sql
```

### Step 4 — Start the server

```bash
npm start
```

The server starts at **http://localhost:3000**.

On first start, it automatically seeds the admin account:
- Username: `eqprs_admin`
- Password: `eqprs_mnl_2026!`

### Development mode (auto-reload)

```bash
npm run dev
```

---

## 5. Database Schema

### Entity Relationship Summary

```
users ──┬── attendance ──── services
        ├── reservations ── services
        ├── donations
        ├── photo_requests ─ services
        └── photos ──────── services

daily_verses (standalone)
```

### Table Definitions

#### users

| Column     | Type         | Constraints              |
|------------|--------------|--------------------------|
| id         | INT          | PRIMARY KEY, AUTO_INCREMENT |
| name       | VARCHAR(100) | NOT NULL                 |
| age        | INT          | NOT NULL                 |
| email      | VARCHAR(255) | NOT NULL, UNIQUE         |
| username   | VARCHAR(50)  | NOT NULL, UNIQUE         |
| password   | VARCHAR(255) | NOT NULL (bcrypt hash)   |
| role       | ENUM         | 'USER' or 'ADMIN', default 'USER' |
| created_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP|
| updated_at | TIMESTAMP    | AUTO-UPDATES             |

#### services

| Column       | Type         | Constraints              |
|--------------|--------------|--------------------------|
| id           | INT          | PRIMARY KEY              |
| title        | VARCHAR(100) | NOT NULL, default 'Sunday Service' |
| service_date | DATE         | NOT NULL                 |
| service_time | ENUM         | '8:30 AM' or '10:30 AM' |
| max_seats    | INT          | DEFAULT 200              |
| created_at   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP|

#### attendance

| Column     | Type      | Constraints                         |
|------------|-----------|-------------------------------------|
| id         | INT       | PRIMARY KEY                         |
| user_id    | INT       | FK → users(id) ON DELETE CASCADE    |
| service_id | INT       | FK → services(id) ON DELETE CASCADE |
| status     | ENUM      | 'ATTENDING' or 'CANCELLED'          |
| marked_at  | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP           |

Unique constraint on (user_id, service_id).

#### reservations

| Column     | Type      | Constraints                         |
|------------|-----------|-------------------------------------|
| id         | INT       | PRIMARY KEY                         |
| user_id    | INT       | FK → users(id) ON DELETE CASCADE    |
| service_id | INT       | FK → services(id) ON DELETE CASCADE |
| status     | ENUM      | 'RESERVED' or 'CANCELLED'           |
| reserved_at| TIMESTAMP | DEFAULT CURRENT_TIMESTAMP           |

Unique constraint on (user_id, service_id).

#### donations

| Column           | Type          | Constraints               |
|------------------|---------------|---------------------------|
| id               | INT           | PRIMARY KEY               |
| user_id          | INT           | FK → users(id)            |
| amount           | DECIMAL(10,2) | NOT NULL                  |
| reference_number | VARCHAR(100)  | NOT NULL                  |
| message          | TEXT          | nullable                  |
| donated_at       | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

#### photo_requests

| Column       | Type      | Constraints               |
|--------------|-----------|---------------------------|
| id           | INT       | PRIMARY KEY               |
| user_id      | INT       | FK → users(id)            |
| service_id   | INT       | FK → services(id)         |
| status       | ENUM      | 'PENDING' or 'COMPLETED'  |
| requested_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### photos

| Column      | Type         | Constraints               |
|-------------|--------------|---------------------------|
| id          | INT          | PRIMARY KEY               |
| user_id     | INT          | FK → users(id)            |
| service_id  | INT          | FK → services(id)         |
| file_path   | VARCHAR(500) | NOT NULL                  |
| uploaded_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP |

#### daily_verses

| Column          | Type         | Constraints     |
|-----------------|--------------|-----------------|
| id              | INT          | PRIMARY KEY     |
| verse_text      | TEXT         | NOT NULL        |
| verse_reference | VARCHAR(100) | NOT NULL        |
| verse_date      | DATE         | NOT NULL, UNIQUE|

---

## 6. API Reference

### Authentication

All endpoints except `/api/auth/*` require a JWT token in the header:

```
Authorization: Bearer <token>
```

Admin endpoints additionally require `role: ADMIN` in the token payload.

---

### Auth Endpoints

#### POST /api/auth/signup

Create a new user account.

**Request Body:**
```json
{
  "name": "Juan Dela Cruz",
  "age": 25,
  "email": "juan@email.com",
  "username": "juan",
  "password": "mypassword"
}
```

**Responses:**
- `201` — Account created
- `400` — Missing fields or password too short (min 6 chars)
- `409` — Username or email already exists

---

#### POST /api/auth/login

Login and receive a JWT token.

**Request Body:**
```json
{
  "username": "juan",
  "password": "mypassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "name": "Juan Dela Cruz",
    "username": "juan",
    "role": "USER"
  }
}
```

**Responses:**
- `401` — Invalid credentials

---

### User Endpoints

#### GET /api/users/me

Returns the current user's profile.

**Response (200):**
```json
{
  "id": 1,
  "name": "Juan Dela Cruz",
  "age": 25,
  "email": "juan@email.com",
  "username": "juan",
  "role": "USER",
  "created_at": "2026-03-16T12:00:00.000Z"
}
```

---

#### PUT /api/users/me

Update current user's profile. Only send fields you want to change.

**Request Body (all optional):**
```json
{
  "name": "New Name",
  "age": 26,
  "email": "new@email.com",
  "username": "newusername",
  "password": "newpassword"
}
```

---

### Service Endpoints

#### GET /api/services/upcoming

Returns all services with dates >= today.

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Sunday Service",
    "service_date": "2026-03-22",
    "service_time": "8:30 AM",
    "max_seats": 200
  }
]
```

---

#### POST /api/services *(Admin only)*

Create a new service.

**Request Body:**
```json
{
  "service_date": "2026-03-29",
  "service_time": "10:30 AM",
  "max_seats": 200
}
```

---

### Attendance Endpoints

#### POST /api/attendance

Mark yourself as attending a service.

**Request Body:**
```json
{ "service_id": 1 }
```

---

#### DELETE /api/attendance/:serviceId

Cancel your attendance for a service.

---

#### GET /api/attendance/streak

Returns your attendance stats.

**Response (200):**
```json
{
  "total": 12,
  "streak": 4,
  "upcoming": [
    {
      "service_id": 5,
      "service_date": "2026-03-22",
      "service_time": "8:30 AM"
    }
  ]
}
```

---

### Reservation Endpoints

#### POST /api/reservations

Reserve a seat for a service. Fails if seats are full.

**Request Body:**
```json
{ "service_id": 1 }
```

**Responses:**
- `200` — Seat reserved
- `400` — No seats available

---

#### DELETE /api/reservations/:serviceId

Cancel your seat reservation.

---

#### GET /api/reservations/mine

Returns your active upcoming reservations.

---

### Donation Endpoints

#### POST /api/donations

Record a GCash donation.

**Request Body:**
```json
{
  "amount": 500.00,
  "reference_number": "1234567890",
  "message": "Tithes for March"
}
```

---

#### GET /api/donations/mine

Returns your donation history (most recent first).

---

### Photo Endpoints

#### POST /api/photos/request

Request photo coverage for a service.

**Request Body:**
```json
{ "service_id": 1 }
```

---

#### GET /api/photos/album

Returns all photos assigned to you.

---

#### GET /api/photos/requests

Returns your photo request history with status (PENDING/COMPLETED).

---

### Verse Endpoint

#### GET /api/verses/today

Returns today's Bible verse. Resets at midnight Philippine Time (UTC+8).

**Response (200):**
```json
{
  "verse": "For I know the plans I have for you, declares the Lord...",
  "reference": "Jeremiah 29:11"
}
```

The system has 31 built-in verses and caches the daily selection in the database.

---

### Admin Endpoints

All admin endpoints require the ADMIN role.

#### GET /api/admin/stats

Returns dashboard summary counts.

**Response (200):**
```json
{
  "totalUsers": 45,
  "totalAttendees": 120,
  "totalReservations": 98,
  "totalDonations": 25000.00,
  "donationCount": 30
}
```

---

#### GET /api/admin/charts

Returns data for Chart.js visualizations.

**Response (200):**
```json
{
  "attendance": [
    { "service_date": "2026-03-15", "service_time": "8:30 AM", "count": 45 }
  ],
  "reservations": [
    { "service_date": "2026-03-15", "service_time": "8:30 AM", "count": 38 }
  ],
  "donations": [
    { "week": 202611, "total": 5000.00 }
  ]
}
```

---

#### GET /api/admin/users?filter=today|week|month|year|custom&from=YYYY-MM-DD&to=YYYY-MM-DD

Returns filtered users list.

#### GET /api/admin/attendance?filter=...

Returns filtered attendance records with user and service details.

#### GET /api/admin/reservations?filter=...

Returns filtered reservations with user and service details.

#### GET /api/admin/donations?filter=...

Returns filtered donations with user details.

#### GET /api/admin/services-list

Returns all services with attendee and reservation counts. Used for the services table on the admin dashboard and for populating service dropdowns.

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Sunday Service",
    "service_date": "2026-03-22",
    "service_time": "8:30 AM",
    "max_seats": 200,
    "attendee_count": 45,
    "reservation_count": 38
  }
]
```

---

#### GET /api/admin/users-list

Returns a minimal list of all users (id, name, username). Used for populating user dropdowns (e.g., photo upload assignment).

**Response (200):**
```json
[
  { "id": 1, "name": "Juan Dela Cruz", "username": "juan" }
]
```

---

#### GET /api/admin/photo-requests

Returns all photo requests with user and service details.

---

#### POST /api/admin/photos/upload

Upload a photo and assign it to a user.

**Request:** Multipart form data

| Field      | Type   | Required |
|------------|--------|----------|
| photo      | File   | Yes      |
| user_id    | Number | Yes      |
| service_id | Number | Yes      |

Max file size: 10 MB. Photos stored in `/uploads/photos/` with UUID filenames.

---

#### POST /api/admin/services

Create a new service (same as POST /api/services).

---

### Date Filter Options

All admin table endpoints accept a `filter` query parameter:

| Filter   | Description                       |
|----------|-----------------------------------|
| (empty)  | All records                       |
| today    | Records from today                |
| week     | Records from this week (ISO week) |
| month    | Records from this month           |
| year     | Records from this year            |
| custom   | Custom range (requires `from` and `to` params) |

Example: `GET /api/admin/donations?filter=month`
Example: `GET /api/admin/users?filter=custom&from=2026-01-01&to=2026-03-31`

---

## 7. Authentication System

### Flow

1. User submits credentials on login page
2. Server verifies username + bcrypt password comparison
3. Server issues a JWT token (valid for 7 days)
4. Token payload: `{ id, username, role }`
5. Frontend stores token in `localStorage`
6. All API requests include `Authorization: Bearer <token>` header
7. Middleware verifies token on every protected request
8. 401 response automatically triggers logout on the frontend

### Roles

| Role  | Access                                            |
|-------|---------------------------------------------------|
| USER  | Dashboard, attendance, reservations, donations, photos, settings |
| ADMIN | Everything above + admin dashboard, data tables, photo upload, service creation |

### Predefined Admin

- **Username:** `eqprs_admin`
- **Password:** `eqprs_mnl_2026!`
- Auto-seeded on first server start

---

## 8. Frontend Architecture

### API Client (js/api.js)

All frontend pages use a shared `API` object:

```javascript
API.get('/users/me')          // GET request with auth
API.post('/attendance', data) // POST request with auth
API.put('/users/me', data)    // PUT request with auth
API.del('/attendance/5')      // DELETE request with auth
API.upload('/admin/photos/upload', formData) // File upload
API.logout()                  // Clear auth, redirect to login
API.requireAuth()             // Check auth, redirect if missing
API.requireAdmin()            // Check admin role
```

### Page Authentication

Every protected page runs this check on load:

```javascript
if (!API.requireAuth()) return;  // Redirects to /pages/login.html if no token
```

Admin pages additionally check:

```javascript
if (!API.requireAdmin()) return;  // Redirects to /pages/dashboard.html if not admin
```

### Design System

All app pages share CSS variables from `css/common.css`:

| Variable      | Value     | Usage                   |
|---------------|-----------|-------------------------|
| --navy        | #0a1628   | Primary dark color      |
| --orange      | #e86a2a   | Primary accent / CTAs   |
| --gold        | #c9a84c   | Secondary accent        |
| --charcoal    | #1c1c1e   | Dark backgrounds        |
| --gray-50     | #fafafa   | Page backgrounds        |
| --gray-200    | #e8e8ed   | Borders                 |
| --gray-400    | #86868b   | Secondary text          |
| --gray-600    | #424245   | Body text               |
| --success     | #34c759   | Success states          |
| --danger      | #ff3b30   | Error states            |

---

## 9. User Guide — Members

### Creating an Account

1. Visit the website at `http://localhost:3000`
2. Click **LOGIN** in the top navigation bar
3. Click **Sign Up** at the bottom of the login form
4. Fill in your details:
   - Full Name
   - Age
   - Email address
   - Choose a username
   - Choose a password (minimum 6 characters)
5. Click **Create Account**
6. You'll be redirected to the login page

### Logging In

1. Go to the login page
2. Enter your username and password
3. Click **Sign In**
4. You'll be taken to your dashboard

### Dashboard

Your dashboard shows:

- **Services Attended** — total count of all services you've attended
- **Week Streak** — how many consecutive weeks you've attended (resets if you skip a week)
- **Daily Bible Verse** — a new verse every day (resets at midnight Philippine Time)
- **Upcoming Services** — list of upcoming Sunday services with action buttons

### Attending a Service

For each upcoming service, you can:

- **Reserve Seat** — reserves your spot (checks against available seats)
- **Attend** — marks you as attending the service
- **Cancel** — cancels your attendance or reservation

### Making a Donation

1. Click **Donations** in the navigation bar
2. Pay via GCash externally (scan QR code)
3. Enter the donation details:
   - Amount (in PHP)
   - GCash reference number (from your receipt)
   - Optional message
4. Click **Submit Donation**
5. Your donation history appears on the right

### Requesting Photos

1. Click **Photos** in the navigation bar
2. Select an upcoming service from the dropdown
3. Click **Request Photo** — this notifies the church team
4. After the service, the admin will upload and assign your photos
5. Your photos appear in **My Photo Album**

### Account Settings

1. Click **Settings** in the navigation bar
2. Update any of your details:
   - Name, age, email, username
   - New password (leave blank to keep current)
3. Click **Save Changes**

### Logging Out

Click **Logout** in the navigation bar. Your session is cleared.

---

## 10. User Guide — Admin

### Logging In

1. Go to the login page
2. Enter admin credentials:
   - Username: `eqprs_admin`
   - Password: `eqprs_mnl_2026!`
3. You'll be taken to the **Admin Dashboard**

### Admin Dashboard

The dashboard displays:

- **Total Users** — number of registered members
- **Total Attendees** — all-time attendance count
- **Total Reservations** — all-time reservation count
- **Total Donations (PHP)** — cumulative donation amount
- **Create New Service** — form to create upcoming services
- **All Services** — table listing every service with ID, date, time, max seats, attendee count, and reservation count
- **Attendance per Service** — bar chart (last 8 services)
- **Reservations per Service** — bar chart (last 8 services)
- **Donation Trend** — line chart (last 12 weeks)

### Creating Services

1. On the admin dashboard, find the **Create New Service** form
2. Select a date, time slot (8:30 AM or 10:30 AM), and max seats
3. Click **Create**
4. The service immediately appears in the **All Services** table below
5. The service will also appear in users' dashboards

**Important:** Services must be created by the admin for users to reserve seats or mark attendance.

### Viewing the Services List

The **All Services** table on the admin dashboard shows every service you've created:

| Column        | Description                              |
|---------------|------------------------------------------|
| ID            | Service ID (used internally)             |
| Title         | Service name (e.g., "Sunday Service")    |
| Date          | Service date                             |
| Time          | Time slot (8:30 AM or 10:30 AM)          |
| Max Seats     | Maximum capacity                         |
| Attendees     | Number of users marked as attending      |
| Reservations  | Number of seat reservations              |

This table refreshes automatically after you create a new service.

### Viewing Data Tables

Navigate to any data page from the admin navigation:

- **Users** — all registered members
- **Attendance** — all attendance records
- **Reservations** — all seat reservations
- **Donations** — all donation records
- **Photos** — photo requests and upload tool

### Filtering Data

Every data table has filter buttons at the top:

| Button       | Shows                         |
|-------------|-------------------------------|
| All         | All records (no filter)       |
| Today       | Only today's records          |
| Week        | This week's records           |
| Month       | This month's records          |
| Year        | This year's records           |
| Custom      | Pick a start and end date     |

For custom filtering, click **Custom**, select dates, then click **Apply**.

### Uploading Photos

1. Go to **Photos** in the admin navigation
2. In the upload form, use the dropdown menus:
   - **Assign to User** — select a member from the dropdown (shows name and username, populated from the database)
   - **Service** — select a service from the dropdown (shows date, time, and title, populated from the database)
   - **Photo** — select an image file (max 10 MB)
3. Click **Upload**
4. The photo is assigned to the user and appears in their album
5. If the user had a pending photo request for that service, it's automatically marked as completed

**Note:** The user and service dropdowns are populated from the database, so you don't need to memorize or look up IDs.

### Photo Requests Table

Below the upload form, you'll see all photo requests from users:

- **Pending** — user requested photos but none uploaded yet
- **Completed** — photos have been uploaded and assigned

---

## 11. Business Logic

### Attendance Streak Calculation

The streak counts consecutive weeks of attendance:

1. Query all distinct year-weeks the user attended a service
2. Starting from the current week, check backwards
3. If the user attended the current or previous week, increment streak
4. If a week is missing, the streak breaks

**Example:**
- Week 10: Attended ✓
- Week 11: Attended ✓
- Week 12: Missed ✗
- Week 13: Attended ✓ ← Streak = 1 (reset after week 12 gap)

### Daily Bible Verse

1. Get today's date in Philippine Time (UTC+8)
2. Check `daily_verses` table for today
3. If found, return it
4. If not found, select from 31 built-in verses using day-of-year as index
5. Cache the selected verse in the database
6. If the database is unavailable, still return a verse (graceful fallback)

### Seat Reservation Capacity

1. When a user reserves a seat, the system checks the service's `max_seats`
2. Counts current reservations with status `RESERVED`
3. If count >= max_seats, returns error "No seats available"
4. Otherwise, creates the reservation

### Donation Recording

Donations are **not** a payment gateway integration. The flow is:

1. User pays externally via GCash (scans QR code)
2. User records the transaction in the app (amount + GCash reference number)
3. Admin can view all recorded donations in the admin panel

---

## 12. Security

### Password Hashing

- All passwords hashed with **bcrypt** using **12 salt rounds**
- Original passwords are never stored or logged

### JWT Tokens

- Signed with a secret key from `.env` (`JWT_SECRET`)
- Expire after **7 days**
- Payload contains: `{ id, username, role }`
- Transmitted via `Authorization: Bearer <token>` header

### Role-Based Access Control

- `verifyToken` middleware — rejects requests without valid JWT
- `requireAdmin` middleware — rejects non-ADMIN users (returns 403)
- Frontend checks role before rendering admin pages

### Input Validation

- Required fields checked on all endpoints
- Password minimum length enforced (6 characters)
- Donation amount must be > 0
- File upload limited to 10 MB
- Duplicate email/username returns 409 conflict

### SQL Injection Prevention

- All database queries use **parameterized statements** (`?` placeholders)
- No string concatenation in SQL queries

### File Upload Security

- Files renamed to UUIDs (prevents path traversal)
- File size limited to 10 MB
- Stored in dedicated `/uploads/photos/` directory

---

## 13. Troubleshooting

### "Access denied for user 'root'@'localhost'"

Your MySQL password in `.env` is incorrect. Update `DB_PASSWORD`:

```env
DB_PASSWORD=your_actual_mysql_password
```

### "Table doesn't exist"

Run the schema SQL to create all tables:

```bash
mysql -u root -p equippers_manila < db/schema.sql
```

### "ER_DUP_ENTRY" on admin seed

The admin account already exists. This is normal — the seed function skips if the admin username already exists in the database.

### Login redirects back to login page

Your JWT token may have expired (tokens last 7 days). Log in again to get a new token.

### Charts not showing on admin dashboard

Ensure there are services created and some attendance/donation data. Charts require data to render.

### Photos not loading in user album

1. Ensure the photo was uploaded via the admin panel
2. Check that `/uploads/photos/` directory exists
3. Verify the file path in the `photos` database table

### Server won't start — port in use

Change the port in `.env`:

```env
PORT=3001
```

### "Cannot find module" errors

Run `npm install` to install all dependencies:

```bash
npm install
```
