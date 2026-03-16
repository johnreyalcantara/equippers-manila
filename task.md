You are a senior full-stack engineer.

I have an existing church website for Equippers Manila. I want to ADD a full user system and service attendance management system.

Your task is to design and implement the system architecture, database schema, backend logic, and UI components.

The solution should be scalable, secure, and easy to maintain.

Assume the system will use:

Frontend:
HTML, CSS, JavaScript

Backend:
Node.js / Express (or similar REST backend)

Database:
MySQL

-------------------------------------

CORE FEATURES

The website should allow users (church attendees) to:

1. Create an account (Sign Up)
2. Login
3. Reserve seats for Sunday service
4. Mark themselves as attending service
5. Cancel attendance or reservation
6. Send donations via GCash
7. Request photography for the service
8. View their photos in a personal album
9. Track their church attendance streak
10. See a daily Bible verse that refreshes every day

-------------------------------------

AUTHENTICATION SYSTEM

Create a login system with roles.

Roles:
- USER
- ADMIN

Sign Up page:
Users create accounts using:
- name
- age
- email
- username
- password

Login page:
Users can login with username and password.

Admins also login from the same page but have admin privileges.

Admin credentials should exist in the database but are predefined:

username: eqprs_admin
password: eqprs_mnl_2026!

-------------------------------------

USER DASHBOARD

After login, users see their personal dashboard.

Dashboard includes:

Attendance tracker:
- shows total services attended
- shows attendance streak (consecutive weeks attended)

Daily Bible Verse:
- automatically generated
- resets every day at 12:00 AM Philippine Time (UTC+8)

Service Attendance Section:

Buttons:
[ Reserve Seat ]
[ Mark As Attending ]
[ Cancel Attendance ]

When user clicks:

Reserve Seat
→ recorded in reservations table

Mark As Attending
→ recorded in attendance table

Cancel Attendance
→ removes record

-------------------------------------

DONATIONS (GCASH)

Users can submit donations via GCash.

Donation page should:

1. Display church GCash QR code
2. Allow user to input:
   - donation amount
   - reference number
   - optional message
3. Submit donation record

Admin can see all donations.

-------------------------------------

PHOTO REQUEST + ALBUM

Users can request photography coverage.

Features:

Request Photo
→ user submits request for the service

Photo Album
→ user can view all photos assigned to them

Admin can upload photos and assign them to users.

-------------------------------------

ACCOUNT SETTINGS

Users can update:

- name
- age
- email
- username
- password

-------------------------------------

ADMIN PANEL

Admins have a separate dashboard.

Admin Dashboard shows:

Total Users
Total Attendees
Total Seat Reservations
Total Donations

Charts per service.

-------------------------------------

ADMIN DATA TABLES

Admin can view:

1. Users list
2. Attendance list
3. Reservations list
4. Donations list
5. Photo requests

Each table must have GLOBAL FILTER options:

Filter options:

- Today
- This Week
- This Month
- This Year
- Custom Date Range

-------------------------------------

DATABASE DESIGN

Create all required MySQL tables.

Required tables include:

users
admins
services
attendance
reservations
donations
photo_requests
photos
daily_verses

Design full schema including:

- primary keys
- foreign keys
- timestamps
- indexes

-------------------------------------

ATTENDANCE STREAK LOGIC

A streak increases when a user attends consecutive weekly services.

If a week is skipped, streak resets.

-------------------------------------

DAILY BIBLE VERSE SYSTEM

A daily verse should automatically appear each day.

Rules:

- changes every day
- resets at 12:00 AM Philippine Time
- verses can come from database or API

-------------------------------------

ADMIN ANALYTICS

Admin dashboard should display:

Charts showing:

- attendance per service
- reservations per service
- donations trend

-------------------------------------

SECURITY REQUIREMENTS

Include:

password hashing
JWT authentication
role-based access control
input validation

-------------------------------------

DELIVERABLES

Provide:

1. System architecture
2. Database schema (SQL)
3. API endpoints
4. Backend logic structure
5. UI component layout
6. Admin dashboard design
7. User dashboard design
8. Example SQL queries