# Healio — Development Plan

This document is the actionable development plan for the Healio health-monitoring web application. It assumes a local development environment: a Python REST API backend hosted locally on your laptop, a separate client-side frontend (HTML/CSS/JS), and a local MongoDB instance.

---

## 1. Goals & Scope

- Build a secure, role-based web application to collect, store, visualize, and export biometric health data.
- Roles: `Patient`, `Doctor`, `Admin`.
- Architecture: REST API backend (Python) + client-side frontend (HTML/CSS/JS). Local hosting on developer laptop.
- Core datasets: heart rate, steps, calories, blood pressure, blood glucose, sleep, user profiles, appointments, alerts, gamification data.

---

## 2. High-level Roadmap (Phased)

Phase 1 — Core (MUST-HAVE) (4–6 weeks)
- Dev environment, repo, branching strategy.
- Authentication (register/login/logout), strong password hashing, JWT session tokens.
- RBAC enforcement (Patient/Doctor/Admin).
- Patient manual data entry endpoints + client UI.
- Patient dashboard: summaries + time-series charts (day/week/month).
- Local MongoDB setup and schema basics.
- Basic server-side and client-side validation.
- Minimal automated unit tests for core endpoints.

Phase 2 — Clinical & Admin (3–5 weeks)
- Doctor dashboard: patient list, search, patient details, report generation (CSV/PDF).
- Admin: user management (activate/deactivate, role assignment), basic stats.
- Alert engine: detect abnormal readings & in-app notifications.
- Background jobs for report generation (simple queue/task runner).

Phase 3 — UX & Enhancements (3–6 weeks)
- Gamification (points, badges, streaks) and achievement UI.
- UI polish: responsive layouts, light/dark theme toggle, customization of dashboard widgets.
- Export improvements, import CSV with validation.
- Optional: offline data entry + synchronization (service worker or local storage solution).
- Optional: AI chatbot (deferred to future iteration if time limited).

Phase 4 — Hardening & Deliverables (2–4 weeks)
- Security audits, automated testing (unit, integration, E2E), performance tuning.
- Backup plan, data migration scripts, documentation, README and developer setup docs.
- Usability fixes driven by test results.

---

## 3. Actionable Tasks (broken down)

1. Repository & environment
   - Create Git repository, `main` + `dev` branches, feature branch naming convention.
   - Add `.gitignore`, `README.md`, `PLAN.md` (this file).
   - Create `backend/` and `frontend/` directories.

2. Backend scaffold
   - Choose framework (Flask or FastAPI recommended). Create project skeleton, virtualenv, and `requirements.txt`.
   - Implement basic routes and health check: `GET /health`.
   - Configure local MongoDB connection string: `mongodb://localhost:27017/healio`.

3. Auth & RBAC
   - Implement `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`.
   - Password hashing (bcrypt/argon2), email uniqueness check, JWT tokens, refresh token strategy (optional).
   - Middleware for role checking on protected endpoints.

4. User & Data Models
   - Collections: `users`, `biometrics`, `alerts`, `appointments`, `achievements`, `audit_logs`.
   - Indexes on `biometrics.user_id + timestamp`, `users.email`, `users.role`.

5. Biomarker endpoints
   - `POST /patients/{id}/biometrics` (create entry)
   - `GET /patients/{id}/biometrics?metric=steps&from=...&to=...&interval=day`
   - Validation of numeric ranges and timestamps.

6. Dashboards & Visuals
   - Frontend will call REST endpoints to render charts (use Chart.js or similar). Provide default widget set and allow selection.

7. Alerts & Notifications
   - Engine checks incoming biometrics against thresholds (user or system defaults).
   - Persist alerts to `alerts` collection and expose `GET /alerts`.

8. Reports & Exports
   - Implement CSV and PDF export endpoints for patient reports.

9. Admin & Doctor features
   - Admin: `GET /admin/users`, `PATCH /admin/users/{id}` (activate/deactivate/role).
   - Doctor: `GET /doctor/patients`, `GET /doctor/patients/{id}`.

10. Tests & CI
   - Unit tests for API routes; integration tests for DB operations.
   - Optional: set up GitHub Actions later for tests on push.

11. Documentation
   - In-repo `README.md`, API docs (Swagger/OpenAPI if using FastAPI or Flask-RESTX), developer setup instructions.

---

## 4. Suggested Tech & Tools

- Backend: Python 3.10+ with FastAPI (recommended) or Flask
- DB: MongoDB (local) — use MongoDB Compass for GUI during development
- Frontend: plain HTML/CSS/JavaScript or small framework (React/Vite) if desired
- Charts: Chart.js or ApexCharts
- Auth: JWT tokens, bcrypt/argon2 password hashing
- Local dev: Windows commands / PowerShell; recommend using virtual environments
- Testing: pytest for Python, Playwright or Cypress for E2E if a JS frontend

---

## 5. API Sketch (examples)

Authentication
- POST /auth/register { name, email, password, role }
- POST /auth/login { email, password } -> { access_token }
- POST /auth/refresh -> { access_token }

Patients & Biometrics
- POST /patients/{userId}/biometrics { metric, value, timestamp, notes }
- GET /patients/{userId}/biometrics?metric=&from=&to=&interval=

Alerts
- GET /alerts?userId=&status=
- POST /alerts/acknowledge { alertId }

Admin
- GET /admin/users
- PATCH /admin/users/{id} { role, active }

Doctor
- GET /doctor/patients?query=
- GET /doctor/patients/{id}/biometrics?from=&to=

Notes: All protected endpoints require `Authorization: Bearer <token>` and role-based middleware.

---

## 6. Minimal DB Schema (MongoDB collections)

users
- _id, name, email (unique), password_hash, role (patient|doctor|admin), active (bool), created_at, profile { height, weight, gender, dob }

biometrics
- _id, user_id (ref), metric ("hr"|"steps"|...), value (number), unit, timestamp, notes

alerts
- _id, user_id, metric, value, threshold, severity, created_at, acknowledged (bool), acknowledged_by

achievements
- _id, user_id, type, points, date_awarded, metadata

audit_logs
- _id, actor_id, action, target, timestamp, details

appointments (optional)
- _id, patient_id, doctor_id, datetime, notes, reminder_sent

---

## 7. Security Checklist

- Use HTTPS for local development (self-signed cert) or run behind local proxy.
- Salt+hash passwords with bcrypt/argon2.
- Enforce strong password rules client+server side.
- Validate and sanitize all inputs (prevent XSS). Use parameterized DB operations (avoid query building with unsanitized strings).
- Add CSRF protection for stateful endpoints (if using cookies). With JWT, ensure secure storage and short expiry.
- RBAC checks server-side on every protected route.
- Audit logging for administrative and sensitive operations.

---

## 8. Testing & QA

- Unit tests for business logic and API routes (pytest).
- Integration tests with a test MongoDB database (or use a test collection/prefix).
- Manual usability checklist (based on your usability test file): registration, manual data entry, dashboard views, logout.
- E2E smoke tests (optional) for main user flows.

---

## 9. Local Setup & Run (Windows commands)

Backend (recommended Python + FastAPI)

```powershell
cd \path\to\App\backend
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip
pip install fastapi uvicorn pymongo passlib[bcrypt] python-jose[cryptography]
# later: pip install -r requirements.txt
# Run dev server
uvicorn app.main:app --reload --host 127.0.0.1 --port 5000
```

Frontend (plain static files or dev server)

```powershell
cd \path\to\App\frontend
# If plain HTML: open index.html in browser (or use a simple static server)
# If using Node/React/Vite:
npm install
npm run dev    # default on port 3000
```

MongoDB
- Start local MongoDB: use MongoDB Community edition service or run `mongod` locally.
- Connection string: `mongodb://localhost:27017/healio`

CORS: Enable CORS on backend for `http://localhost:3000` (frontend origin).

---

## 10. Sample Sprint Plan (6 sprints, 2 weeks each)

Sprint 1: Repo, env, basic backend scaffold, auth, DB models
Sprint 2: Patient biometrics endpoints, simple dashboard UI, client validation
Sprint 3: Doctor features (patient list/search), admin user management
Sprint 4: Alerts, notifications, report exports, background jobs
Sprint 5: Gamification, UI polish, responsive layouts
Sprint 6: Tests, security audit, docs, usability fixes

---

## 11. Risks & Mitigations (short)

- Security breach: enforce encryption, RBAC, audits, weekly security checks.
- Scope creep: build must-haves first; defer could-haves to Phase 3.
- Skill gaps: pair programming, pick lighter-weight libraries (FastAPI) and reuse components.
- Local-only hosting constraints: backup local DB frequently, keep data dumps for resilience.

---

## 12. Deliverables

- Working local REST API (backend/) with tests and documentation.
- Frontend (frontend/) that consumes the API and renders dashboards.
- `README.md` with developer setup, API endpoints, and run instructions.
- `PLAN.md` (this file) and short design notes.

---

## 13. Immediate Next Steps (what I recommend you do now)

1. Create the Git repo in `c:\Users\Hayden\Documents\Study\SoftwareEngineering\App` and push to GitHub if desired.
2. Scaffold `backend/` with FastAPI and `frontend/` with a minimal static site or Vite app.
3. Configure local MongoDB and create `.env` with `MONGO_URI` and `JWT_SECRET`.
4. Implement Phase 1 tasks (auth, RBAC, biometrics endpoints).

---

If you want, I can scaffold the backend (FastAPI) and a minimal frontend now, including runnable example endpoints, tests and a small demo dataset. Reply with your preference and I will start implementing the selected pieces.
