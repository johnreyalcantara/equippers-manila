You are a senior full-stack architect.

I already have an existing church website for Equippers Manila.

The system is already deployed on Vercel and connected to a TiDB Cloud database.

You must design all solutions so they work with the following stack.

---------------------------------------

CURRENT STACK

Hosting / Deployment
Vercel

Database
TiDB Cloud (MySQL compatible)

Backend
Vercel Serverless Functions (Node.js)

Frontend
HTML + CSS + JavaScript

Realtime features
Use a FREE realtime solution compatible with serverless environments such as:

Firebase Realtime Database
or
Supabase Realtime
or
WebSocket service compatible with serverless

DO NOT design a traditional persistent Node server.

All APIs must work as serverless API routes.

---------------------------------------

GOAL

Transform the church website into a lightweight Church CRM system with the following modules:

• Announcement / Event board
• Volunteer management (Equip Teams)
• Hubs management (E-HUBS)
• Small group management (E-GROUPS)
• Realtime group communication
• Membership tracking

---------------------------------------

PUBLIC ACCESS (NO LOGIN)

Visitors should be able to see the following lists without logging in:

Equip Teams
E-Hubs
E-Groups

Each item must display:

• name
• description
• leader
• total members

However only logged-in users can apply to join.

---------------------------------------

ANNOUNCEMENT / EVENT MANAGEMENT

Admins can create announcements or events.

Fields:

title
description
event_date
location
image_url
created_by
created_at

Announcements appear on a public announcement board.

---------------------------------------

VOLUNTEER MANAGEMENT (EQUIP TEAMS)

Admins create Equip Teams.

Fields:

name
description
leader_user_id
created_at

Users can view teams and apply to join.

Each team should display:

name
description
leader
total_members

Team leader can approve or reject join requests.

---------------------------------------

HUBS MANAGEMENT (E-HUBS)

Admins create E-HUBS.

Fields:

name
description
leader_user_id
created_at

Users can apply to join.

Hub leaders can approve or reject requests.

---------------------------------------

GROUP MANAGEMENT (E-GROUPS)

E-Groups are small groups created by users with role "leader".

Admin assigns the leader role to users.

Leader users can create groups.

Fields:

name
description
meeting_day
meeting_location
leader_user_id

Users can apply to join.

Group leaders can approve or reject join requests.

Each group displays:

name
description
leader
total_members

---------------------------------------

COMMUNICATION SYSTEM

Every Equip Team, E-Hub, and E-Group automatically gets a group chat.

Chat room name format:

TYPE_NAME

Examples:

E-HUB_Youth
EQUIPTEAM_Worship
EGROUP_YoungAdults

When a user joins a team, hub, or group they automatically join the chat.

Chat should support:

• realtime messages
• message history
• sender name
• timestamp

UI should resemble Messenger-style chat bubbles.

Because the system is deployed on Vercel, use a realtime solution that works without a persistent server.

---------------------------------------

USER ROLES

Roles:

user
leader
admin

Admins can:

assign leader roles
create Equip Teams
create E-Hubs
create announcements
view system analytics

---------------------------------------

ADMIN DASHBOARD

Admin dashboard shows:

Total Users
Total Equip Teams
Total E-Hubs
Total E-Groups
Total Join Requests

Admin can view lists of:

Users
Teams
Hubs
Groups
Requests

---------------------------------------

DATABASE DESIGN

Create a full MySQL-compatible schema for TiDB.

Tables should include:

users
roles
announcements

equip_teams
equip_team_members
equip_team_requests

e_hubs
e_hub_members
e_hub_requests

e_groups
e_group_members
e_group_requests

chat_rooms
chat_messages

All tables must include:

primary keys
foreign keys
indexes
created_at timestamps

---------------------------------------

API DESIGN

Because this runs on Vercel, design APIs as serverless endpoints.

Example structure:

/api/auth/login
/api/auth/signup

/api/equip-teams
/api/equip-teams/apply

/api/e-hubs
/api/e-hubs/apply

/api/e-groups
/api/e-groups/apply

/api/announcements

Each API must work with TiDB using MySQL drivers.

---------------------------------------

OUTPUT REQUIRED

Provide:

1. System architecture for Vercel + TiDB
2. Full SQL schema
3. Serverless API endpoint design
4. Folder structure for Vercel project
5. Frontend page structure
6. Chat architecture compatible with serverless
7. Example queries