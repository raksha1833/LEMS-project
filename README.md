# LEMS — Law Enforcement Management System
## Complete Setup Guide

---

## WHAT IS LEMS?

A full-stack web application for managing:
- FIR registration → auto-creates CrimeCase
- Suspects, Evidence, Witnesses, Victims
- Arrests (via stored procedure)
- IPC Charges
- Case closure with validation
- Role-based access: Admin, Officer, Viewer

Stack: React JS + Node.js + Express + MySQL

---

## PREREQUISITES — Install These First

1. MySQL 8.0     → https://dev.mysql.com/downloads/mysql/
2. Node.js LTS   → https://nodejs.org/
3. VS Code       → https://code.visualstudio.com/
4. Postman (optional for testing) → https://postman.com

---

## STEP 1 — DATABASE SETUP

Open MySQL Workbench. Connect to localhost.
Run the following SQL files IN THIS EXACT ORDER:

```
1. Open and run: 02_tables.sql
2. Open and run: 05_triggers.sql
3. Open and run: 06_procedures.sql
4. Open and run: 04_views.sql
5. Open and run: database/03_seed_and_userlogin.sql
```

After running all 5 files, you should see:
- 16 tables created
- 4 triggers created
- 3 stored procedures created
- 3 views created
- Seed data inserted (districts, stations, officers, 1 demo FIR)

---

## STEP 2 — BACKEND SETUP

```bash
# 1. Open terminal in the 'backend' folder
cd backend

# 2. Open .env file and change DB_PASSWORD to your MySQL root password
#    DB_PASSWORD=your_mysql_password_here

# 3. Install dependencies
npm install

# 4. Start the server
npm run dev
```

You should see:
```
✅  MySQL connected — database: law_enforcement
🚀  LEMS Backend running on http://localhost:5000
```

If you see a MySQL error:
→ Check your password in .env
→ Make sure MySQL service is running
→ Make sure 'law_enforcement' database exists

---

## STEP 3 — FRONTEND SETUP

Open a NEW terminal (keep backend running in first terminal).

```bash
# 1. Go to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start the React app
npm run dev
```

You should see:
```
VITE ready in 300ms
➜  Local: http://localhost:3000/
```

---

## STEP 4 — OPEN IN BROWSER

Go to: http://localhost:3000

You will see the LEMS login page.

---

## LOGIN CREDENTIALS

All passwords are: password

| Username | Password | Role        | Access                        |
|----------|----------|-------------|-------------------------------|
| admin    | password | Admin       | Full access, all stations     |
| rajesh   | password | Officer     | Station 1 (Mysuru Central)   |
| priya    | password | Officer     | Station 1 (Mysuru Central)   |
| irfan    | password | Officer     | Station 1 (Mysuru Central)   |
| viewer1  | password | Viewer      | Read-only access              |

---

## TESTING THE FULL LIFECYCLE

1. Login as priya (officer)
2. Dashboard shows 1 demo case already created
3. Click Cases → Case #1 to see the demo case
4. Try: Suspects tab → Arrest button → arrest Ramu Naik
5. Try: Evidence tab → change status to Sealed
6. Try: Charges tab → add a charge
7. Try: Close Case button (will fail if conditions not met — shows why)
8. Resolve all charges + seal all evidence → Close Case succeeds

---

## FOLDER STRUCTURE

```
lems-project/
├── database/
│   └── 03_seed_and_userlogin.sql    ← Run this last
│
├── backend/
│   ├── .env                         ← Set your DB password here
│   ├── server.js                    ← Entry point
│   ├── config/db.js                 ← MySQL connection
│   ├── middleware/
│   │   ├── auth.js                  ← JWT verification
│   │   └── roleCheck.js             ← Role guard
│   ├── controllers/                 ← Business logic
│   └── routes/                      ← URL definitions
│
└── frontend/
    ├── index.html
    ├── vite.config.js               ← Proxies /api to port 5000
    ├── package.json
    └── src/
        ├── App.jsx                  ← All routes
        ├── index.css                ← Global styles
        ├── context/AuthContext.jsx  ← JWT stored here
        ├── services/api.js          ← All API calls
        ├── components/              ← Shared UI components
        └── pages/                   ← All page components
```

---

## API ENDPOINTS (for testing in Postman)

Base URL: http://localhost:5000

| Method | URL                        | Auth Required | Body                                    |
|--------|----------------------------|---------------|-----------------------------------------|
| POST   | /api/auth/login            | No            | { username, password }                  |
| GET    | /api/fir                   | Yes           | -                                       |
| POST   | /api/fir                   | Yes (officer) | FIR fields                              |
| GET    | /api/cases                 | Yes           | -                                       |
| GET    | /api/cases/:id             | Yes           | -                                       |
| PUT    | /api/cases/:id/close       | Yes (officer) | -                                       |
| POST   | /api/suspects/arrest       | Yes (officer) | { suspect_id, officer_id, case_id }    |
| GET    | /api/officers/workload     | Yes           | -                                       |
| GET    | /api/reports/station/:id   | Yes (officer) | -                                       |
| GET    | /api/health                | No            | -                                       |

To use protected endpoints in Postman:
1. POST /api/auth/login → copy the token from response
2. In other requests → Headers → Authorization: Bearer <token>

---

## COMMON ERRORS

| Error                              | Fix                                          |
|------------------------------------|----------------------------------------------|
| ER_ACCESS_DENIED (MySQL)           | Wrong password in backend/.env               |
| Cannot connect to MySQL            | Start MySQL service (check Windows Services) |
| Port 5000 already in use           | Kill the other process or change PORT in .env|
| Port 3000 already in use           | Vite will auto-use 3001 — update proxy       |
| Login fails with correct password  | Run 03_seed_and_userlogin.sql again          |
| Blank page in browser              | Press F12 → Console → read the error         |
| CORS error                         | Make sure backend is on port 5000            |
