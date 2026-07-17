# brain.md — SentraDesk Project Memory

> **This is the permanent memory of the SentraDesk.**
> Before implementing any feature, read this document first.
> After completing any feature that changes architecture, workflows, APIs, database design, security, or user journeys — update this document before committing.

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Database Philosophy & Schema](#4-database-philosophy--schema)
5. [API Design Principles](#5-api-design-principles)
6. [Security Philosophy](#6-security-philosophy)
7. [AI Architecture](#7-ai-architecture)
8. [User Journeys — Entry → Workflow → Exit](#8-user-journeys)
9. [Ticket Lifecycle](#9-ticket-lifecycle)
10. [Notification Engine](#10-notification-engine)
11. [Approval Workflow](#11-approval-workflow)
12. [Evidence Management](#12-evidence-management)
13. [SLA Engine](#13-sla-engine)
14. [Folder Structure](#14-folder-structure)
15. [Development Rules & Coding Standards](#15-development-rules--coding-standards)
16. [API Endpoint Reference](#16-api-endpoint-reference)
17. [Era Completion Log](#17-era-completion-log)
18. [Long-Term Documentation Goals (SAD & API Docs)](#18-long-term-documentation-goals-sad--api-docs)

---

## 1. Project Vision

**SentraDesk — SentraDesk** is an enterprise-grade, AI Complaint Management & Intelligent Case Assignment Platform system built for use by cyber crime departments and government organizations.

### What SentraDesk Is

- A production-oriented ticket management platform for cyber complaints
- An AI-assisted investigation tool for cyber crime officers
- A secure, auditable, role-based governance system
- A multi-channel complaint intake platform (web portal, email, API)

### What SentraDesk Is Not

- A college project or UI showcase
- An animation portfolio
- A prototype for demonstration only

### Core Design Principle

> **The engine is more important than the car's exterior.**

The backend is the engine. The frontend is the interface. Every engineering decision prioritizes:

1. **Security** — no compromise
2. **Data integrity** — nothing is lost
3. **Correctness** — business logic is accurate
4. **Auditability** — every action is traceable
5. **Scalability** — designed for growth
6. **Usability** — simple, clear, professional

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                   │
│              Next.js 15 + React 19 + TypeScript         │
│         Citizen Portal │ Officer Portal │ Admin Portal   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST (JWT Bearer)
┌────────────────────────▼────────────────────────────────┐
│                      API LAYER                          │
│                 FastAPI + Uvicorn                       │
│         /api/v1/ (versioned REST endpoints)             │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  BUSINESS SERVICES                      │
│  Auth │ Ticket │ Evidence │ AI Pipeline │ Notification  │
│  Approval │ Audit │ SLA │ Search │ Reporting │ ThreatIntel│
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   DATA LAYER                            │
│  PostgreSQL (primary) │ Redis (cache/sessions/queue)    │
│  MinIO (evidence/reports) │ Qdrant (vectors/semantic)   │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               BACKGROUND PROCESSING                     │
│            Celery Workers (email, SLA, cleanup)         │
└─────────────────────────────────────────────────────────┘
```

### System Components

| Component | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind | Citizen, Officer, Admin portals |
| Backend API | FastAPI, Uvicorn, Python 3.13+ | REST API, business logic |
| Primary Database | PostgreSQL | All persistent data |
| Cache & Sessions | Redis | JWT denylist, rate limiting, queues |
| Object Storage | MinIO | Evidence files, PDF reports |
| Vector Database | Qdrant | Semantic search, duplicate detection |
| Background Jobs | Celery | Email sending, SLA monitoring, cleanup |
| ORM | SQLAlchemy 2.0 + Alembic | Database schema, migrations |
| Auth | JWT (access + refresh token pair) | Authentication & sessions |

---

## 3. Technology Stack

### Frontend
- **Next.js 15** — App Router, Server Components
- **React 19** — UI rendering
- **TypeScript** — Type safety throughout
- **Tailwind CSS** — Design system
- **Framer Motion** — Subtle transitions only (no animations for show)
- **Lucide Icons** — Icon system
- **React Hook Form + Zod** — Form validation
- **Axios** — HTTP client (centralized in `lib/api.ts`)

### Backend
- **FastAPI** — REST API framework
- **Python 3.13+** — Runtime
- **SQLAlchemy 2.0** — ORM
- **Pydantic v2** — Data validation and schemas
- **Alembic** — Database migrations
- **Uvicorn** — ASGI server
- **bcrypt** — Password hashing
- **python-jose** — JWT encoding/decoding
- **Celery** — Async task processing
- **reportlab** — PDF generation
- **scikit-learn** — ML classification model

### AI Libraries (current + future-ready)
- **scikit-learn** — SGDClassifier for complaint classification
- **langdetect** — Language detection
- **qdrant-client** — Vector similarity search
- Architecture designed for future HuggingFace, spaCy, LLM integration

---

## 4. Database Philosophy & Schema

### Principles
- Every table has: `UUID primary key`, `created_at`, `updated_at`
- Soft delete where appropriate (users, evidence)
- Foreign keys with appropriate cascade rules
- Indexes on all frequently queried columns
- No weak schemas — every field has proper type, constraints, nullability

### Core Models

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | String(255) UNIQUE | Login identifier |
| hashed_password | String(255) | bcrypt hash |
| name | String(255) | Display name |
| role | String(50) | citizen, cyber_cell_officer, investigator, supervisor, security_auditor, system_administrator |
| is_active | Boolean | Soft disable |
| email_verified | Boolean | Required for login |

#### `complaints`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| title | String(255) | Complaint headline |
| description | String(2000) | Detailed description |
| source | String(50) | portal, email, mobile, helpline, station |
| status | String(50) | New, AI Processing, Assigned, Under Investigation, Waiting for Citizen, Evidence Received, Closure Requested, Closed, Reopened |
| reporter_name | String(255) | |
| reporter_email | String(255) | |
| reporter_phone | String(50) | |
| metadata_json | JSON | AI results, extracted entities, fraud details |
| citizen_id | UUID FK → users | Nullable for email-intake |

#### `tickets`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| ticket_number | String(100) UNIQUE | Format: SentraDesk-YYYY-NNNNNN |
| complaint_id | UUID FK → complaints | |
| category | String(100) | AI-classified |
| severity | String(50) | Critical, High, Medium, Low |
| assigned_officer_id | UUID FK → users | |
| assigned_group | String(100) | |
| jurisdiction | String(255) | |
| sla_deadline | DateTime TZ | Computed from severity |
| is_escalated | Boolean | |
| l1_approved | Boolean | L1 supervisor approval |
| l2_approved | Boolean | L2 supervisor approval |
| rating | Integer | Citizen feedback rating (1-5) |
| feedback | String(1000) | Citizen feedback text |
| reopened_at | DateTime TZ | |
| reopen_reason | String(1000) | |

#### `evidence`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| ticket_id | UUID FK → tickets | |
| filename | String(255) | |
| file_path | String(512) | MinIO object path |
| mime_type | String(100) | |
| file_size | Integer | Bytes |
| sha256_hash | String(64) | Integrity hash |
| uploaded_by_id | UUID FK → users | |
| version_number | Integer | Default 1 |
| is_deleted | Boolean | Soft delete |

#### `comments` (public conversation thread)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| ticket_id | UUID FK → tickets | |
| author_id | UUID FK → users | Citizen or officer |
| content | String(1000) | |
| attachment_meta | JSON | |

#### `private_notes` (officer-only, citizen cannot see)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| ticket_id | UUID FK → tickets | |
| author_id | UUID FK → users | Officer only |
| content | String(1000) | |

#### `activity_timeline`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| ticket_id | UUID FK → tickets | |
| event_type | String(50) | StatusChanged, Assigned, NoteAdded, CommentAdded, EvidenceUploaded, ClosureRequested, L1Approved, L2Approved, Closed, FeedbackSubmitted, TicketReopened |
| description | String(255) | Human-readable event text |
| actor_id | UUID FK → users | Who performed this action |

#### `audit_logs` + `security_audit_chain`
Cryptographic audit trail with SHA-256 hash chains for tamper detection.

#### `notification_logs`
All notifications sent (email + in-app) with delivery status tracking.

### Role Hierarchy
```
citizen (level 1)
complaint_operator (level 2)
cyber_cell_officer (level 3)
investigator (level 4)
senior_investigator (level 5)
supervisor (level 6)
security_auditor (level 6)
state_administrator (level 7)
system_administrator (level 8)
```

---

## 5. API Design Principles

### Versioning
All APIs are versioned: `/api/v1/`

### Response Format
Every API response uses `StandardResponse`:
```json
{
  "success": true | false,
  "data": <payload or null>,
  "error": null | { "code": "...", "message": "...", "details": [...] }
}
```

### HTTP Status Codes
- `200` — Success
- `400` — Validation error (bad input)
- `401` — Not authenticated
- `403` — Authenticated but insufficient role
- `404` — Resource not found
- `422` — Schema validation failed
- `500` — Internal server error (never expose stack traces)

### Auth Convention
All protected endpoints use `Depends(RoleRequirement("minimum_role"))`.
Role hierarchy is additive — a supervisor can access everything a citizen can.

### Frontend API Rule
**All API calls go through `frontend/lib/api.ts`** — a centralized axios instance:
- Base URL from `NEXT_PUBLIC_API_URL` environment variable
- JWT Authorization header injected automatically
- Token refresh interceptor
- No hardcoded URLs anywhere in components

---

## 6. Security Philosophy

### Authentication
- JWT access tokens (30 min expiry) + refresh tokens (7 day expiry)
- Refresh tokens stored in PostgreSQL with revocation support
- Access tokens on logout added to Redis denylist
- All refresh tokens invalidated on password change

### Password Policy
- Minimum 12 characters, maximum 128 characters
- Must contain: uppercase, lowercase, digit, special character
- Common passwords rejected (blacklist: password, admin, 12345678, qwerty, etc.)
- Hashed with bcrypt (rounds=12)
- Frontend shows real-time strength meter

### RBAC
Every API endpoint declares minimum required role. RBAC is enforced server-side — the frontend role check is UI convenience only, never security.

### Data Protection
- PII (name, email, phone) only accessible to authorized roles
- Citizens access only their own tickets
- Officers access only assigned tickets (except supervisors)
- Private notes never exposed to citizens — enforced at API level

### Evidence Integrity
- Every file gets a SHA-256 hash on upload
- Hash stored in database
- Download verification compares stored hash to re-computed hash
- Chain of custody maintained in `activity_timeline`

### Audit Trail
- Every major action creates an `audit_log` entry
- SHA-256 hash chain connects all audit records
- Tamper detection on integrity check
- Cannot be deleted or modified

### Rate Limiting
- Redis-backed rate limiting on auth endpoints (login, register, forgot-password)
- Configurable per endpoint

---

## 7. AI Architecture

AI is organized into 7 independent modules, all called during `ticket_service.create_complaint_and_ticket()`.

### Module 1 — Complaint Classification
- Model: SGDClassifier trained on seed corpus
- Categories: UPI Fraud, Banking Fraud, Credit Card Fraud, Loan Scam, Cryptocurrency Scam, Social Media Fraud, Identity Theft, OTP Scam, Investment Scam, Phishing, QR Code Fraud, Fake Job Scam, Fake Shopping Website, Sextortion, Malware, Ransomware, Cyber Harassment, Cyber Financial Fraud, Hacking, Online Harassment, Cyber Stalking, Other Cybercrime
- Stores: predicted category, confidence score, model version, inference time

### Module 2 — Entity Extraction
- Regex-based extraction of: phone numbers, email addresses, UPI IDs, bank accounts, IFSC codes, URLs, domains, IP addresses, wallet addresses
- All extracted entities indexed in `extracted_entity_index` table for search

### Module 3 — Severity Engine
- Factors: amount involved, keywords (urgent, fraud, hack, ransom), threat indicators
- Output: Critical (< 24hr SLA), High (< 72hr), Medium (< 7 days), Low (< 15 days)

### Module 4 — Duplicate Detection
- Uses Qdrant vector similarity search
- Encodes complaint text as embedding, searches for similar past complaints
- Returns list of potentially duplicate complaints with similarity scores
- Officer receives notification when duplicates found

### Module 5 — Investigator Assistant
- Per-ticket AI assistant panel (officers only)
- Provides: complaint summary, key facts, suggested investigation steps, evidence requests, similar complaints, category-specific investigation guidance

### Module 6 — Language Detection
- Uses `langdetect` library
- Detects complaint language for future multilingual support

### Module 7 — Confidence Scoring
- Every AI prediction stores confidence percentage
- If confidence < 70%, ticket flagged `needs_ai_review = True`
- Low-confidence tickets routed to human review queue

### AI Data Stored in `metadata_json`
```json
{
  "ai_category_prediction": "UPI Fraud",
  "ai_confidence": 94.3,
  "ai_extracted_entities": { "phones": ["9876543210"], "upi_ids": ["scam@upi"] },
  "ai_risk_score": 78.5,
  "ai_language": "en",
  "needs_ai_review": false,
  "category": "UPI Fraud",
  "amount": 15000
}
```

---

## 8. User Journeys

### 8.1 Citizen Journey — Entry → Workflow → Exit

```
ENTRY POINT: Citizen visits http://localhost:3000
↓
Homepage explains SentraDesk. Citizen clicks "Sign In" or "Track Ticket"
↓
REGISTRATION:
  - Enter: name, email, password (with strength meter)
  - Password validated: min 12 chars, uppercase, lowercase, digit, special, not common
  - Account created, email verification sent
  - Email verification link clicked → account activated
↓
LOGIN:
  - Enter email + password
  - JWT issued (access + refresh token)
  - Role detected = "citizen"
  - Redirected to /citizen/dashboard
↓
CITIZEN DASHBOARD:
  - KPI cards: Open / Closed / Under Investigation / Pending Response
  - Recent notifications
  - Recent ticket activity
↓
RAISE COMPLAINT (Primary Purpose):
  - Fill form: title, category, description, fraud amount, date, phone, email,
    UPI ID, bank account, wallet, URL, social media, suspect name/phone,
    additional info, file attachments
  - Submit → AI pipeline runs (classification, entity extraction, severity, duplicate detection)
  - Ticket created: SentraDesk-YYYY-NNNNNN
  - Acknowledgement email sent
  - In-app notification created
  - Success screen shows ticket number
↓
TRACK & FOLLOW-UP:
  - My Tickets: see only own tickets with status, priority, officer
  - Ticket Detail: full timeline, evidence, conversation thread
  - Add follow-up message in conversation thread
  - Upload additional evidence
↓
INVESTIGATION PHASE (officer-driven):
  - Status updates appear in timeline
  - Officer replies appear in conversation thread
  - Each status change triggers email + in-app notification
↓
CLOSURE:
  - Officer requests closure → L1 approval → L2 approval → Ticket closed
  - Citizen receives closure email + in-app notification
  - PDF report sent with closure email
  - Feedback modal appears on next dashboard visit
↓
FEEDBACK:
  - Rating (1-5 stars)
  - Optional written feedback
  - Stored permanently
↓
EXIT POINT: Citizen logs out. All data persists permanently.
  On re-login: full history, all tickets, all notifications present.
```

**Success Criteria:** Citizen feels: "My complaint was handled professionally, my data was secure, I always knew the status, communication was clear."

---

### 8.2 Officer Journey — Entry → Workflow → Exit

```
ENTRY POINT: Officer visits http://localhost:3000 → Login
↓
LOGIN:
  - JWT issued, role = "cyber_cell_officer" or "investigator" or "supervisor"
  - Redirected to /officer/dashboard
↓
OFFICER DASHBOARD:
  - KPI cards: Assigned / Open / Under Investigation / Pending Citizen Follow-ups /
    Closed / Avg Resolution Time / SLA Status
  - High priority tickets
  - Recent activity
↓
ASSIGNED TICKETS:
  - Only tickets assigned to this officer (role-enforced)
  - Filter by status, severity, category
  - Search by ticket number, complainant, description
↓
TICKET INVESTIGATION:
  - Open ticket → full view with all panels:
    ├── Citizen info + complaint details
    ├── AI Assistant panel: summary, key facts, suggested steps, extracted entities
    ├── Threat Intelligence panel: scan IPs, URLs, domains, hashes
    ├── Private Notes (officer-only, citizen cannot see)
    ├── Public Conversation thread (citizen sees these)
    ├── Evidence panel: list, download, verify hash, upload new
    └── Status workflow controls
↓
INVESTIGATION ACTIONS:
  - Add private investigation notes
  - Send public reply to citizen (triggers email + notification to citizen)
  - Upload additional evidence
  - Request more info from citizen (status: Waiting for Citizen)
  - Change ticket status through valid transitions only
↓
CLOSURE WORKFLOW:
  - Officer clicks "Request Closure"
  - Confirmation popup: "Generate final report? Notify citizen?"
  - Status → Closure Requested
  - Supervisor (L1) reviews and approves
  - Senior Supervisor (L2) reviews and approves
  - Ticket status → Closed
  - System auto-generates PDF investigation report
  - Citizen notified via email + in-app notification
↓
EXIT POINT: Officer logs out. Investigation history, notes, and timeline persist.
```

**Officer Rule:** Every action is logged. Officer notes are private. Public replies trigger citizen notifications. Status transitions are validated — no arbitrary jumps.

---

### 8.3 Admin Journey — Entry → Workflow → Exit

```
ENTRY POINT: Admin visits http://localhost:3000 → Login
↓
LOGIN:
  - JWT issued, role = "system_administrator"
  - Redirected to /admin/dashboard
↓
ADMIN DASHBOARD:
  - Platform-wide statistics: total tickets, active, closed, solve rate, SLA breach rate
  - System health summary
  - Officer performance overview
  - Recent audit events
↓
USER MANAGEMENT:
  - Create new users (any role)
  - Enable / Disable users
  - Assign / Change roles
  - Reset passwords
↓
OFFICER MANAGEMENT:
  - View officer assignments and performance
  - Assign departments, teams, jurisdictions
↓
ASSIGNMENT RULES:
  - Configure auto-assignment logic by category, severity, jurisdiction
↓
EMAIL DIRECTORY:
  - Manage department email addresses
  - Configure distribution lists
↓
SYSTEM HEALTH:
  - Real-time status: PostgreSQL, Redis, MinIO, Qdrant, Celery, SMTP
  - Latency, last checked, online/offline/warning state
↓
AUDIT LOGS:
  - View all actions with cryptographic hash chain
  - Verify integrity (detect tampering)
  - Export PDF audit report
↓
ANALYTICS:
  - Complaint trends, category distribution, officer performance,
    SLA compliance, citizen satisfaction scores
↓
CONFIGURATION:
  - SLA rules by severity
  - Notification templates
  - Email templates
  - Categories and priorities
↓
EXIT POINT: Admin logs out. All configuration and audit history persists.
```

**Admin Rule:** Admin manages the platform. Admin does NOT investigate complaints. Admin cannot see complaint details unless they also hold investigator privileges.

---

## 9. Ticket Lifecycle

### Status State Machine

```
New
  ↓ (AI pipeline completes)
AI Processing
  ↓ (Assignment engine runs)
Assigned
  ↓ (Officer opens ticket)
Under Investigation
  ↓ (Officer requests more info)
Waiting for Citizen
  ↓ (Citizen responds / uploads)
Evidence Received
  ↓ (Investigation complete, officer requests closure)
Closure Requested
  ↓ (Supervisor L1 approves)
L1 Approved
  ↓ (Senior Supervisor L2 approves)
Closed
  ↓ (If citizen disagrees, can reopen within policy)
Reopened → Under Investigation
```

### Allowed Transitions (Server-Side Enforcement)
| From | Allowed To | Required Role |
|---|---|---|
| New | AI Processing | system (automatic) |
| AI Processing | Assigned | system (automatic) |
| Assigned | Under Investigation | cyber_cell_officer+ |
| Under Investigation | Waiting for Citizen | cyber_cell_officer+ |
| Under Investigation | Evidence Received | cyber_cell_officer+ |
| Under Investigation | Closure Requested | investigator+ |
| Waiting for Citizen | Under Investigation | cyber_cell_officer+ |
| Evidence Received | Under Investigation | cyber_cell_officer+ |
| Closure Requested | Closed (via L1+L2) | supervisor |
| Closed | Reopened | citizen (own ticket) |
| Reopened | Under Investigation | cyber_cell_officer+ |

### Ticket Number Format
`SentraDesk-{YEAR}-{6-digit-sequence}` — e.g. `SentraDesk-2026-000001`
Never reused. Always searchable. Globally unique.

---

## 10. Notification Engine

### Trigger Events
| Event | Notification Type | Channel |
|---|---|---|
| User registered | Welcome | Email |
| Email verification sent | Verify account | Email |
| Complaint created | Acknowledgement | Email + In-App |
| Ticket assigned to officer | Assignment | In-App (officer) |
| Officer replied | New reply | Email + In-App (citizen) |
| Evidence requested | Evidence needed | Email + In-App (citizen) |
| Status changed | Status update | Email + In-App (citizen) |
| Closure requested | Pending approval | In-App (supervisor) |
| Ticket closed | Case resolved | Email + In-App (citizen) |
| Feedback requested | Rate your experience | Email + In-App (citizen) |
| Ticket reopened | Case reopened | In-App (officer) |
| Password reset | Reset link | Email only |
| SLA breached | Escalation alert | In-App (supervisor + admin) |

### Delivery
- Email: via SMTP (configured in settings)
- In-App: stored in `notification_logs` table, fetched via API
- Future: SMS, WhatsApp

---

## 11. Approval Workflow

```
Officer / Investigator
  → Clicks "Request Closure"
  → Creates closure request entry
  → Ticket status → "Closure Requested"
  → Notification sent to supervisor(s)

Supervisor (L1)
  → Reviews case, investigation notes, evidence
  → Approves with remarks
  → ticket.l1_approved = True
  → Ticket status → "L1 Approved"

Senior Supervisor (L2)
  → Final review
  → Approves with remarks
  → ticket.l2_approved = True
  → Ticket status → "Closed"
  → PDF report auto-generated
  → Citizen notified
```

Each approval records: approver ID, timestamp, decision, remarks.

---

## 12. Evidence Management

### Upload Flow
1. Frontend requests presigned MinIO upload URL from `POST /evidence/{ticket_id}/upload-link`
2. Frontend uploads file directly to MinIO (bypasses FastAPI for performance)
3. Frontend computes SHA-256 hash of file
4. Frontend calls `POST /evidence/{ticket_id}/save` with metadata + hash
5. Backend stores: filename, path, mime_type, size, sha256_hash, uploaded_by, version_number

### Download Flow
1. Request `GET /evidence/download/{evidence_id}`
2. Backend generates presigned MinIO download URL
3. Frontend downloads directly from MinIO

### Integrity Verification
- SHA-256 hash stored on upload
- On download, hash can be recomputed and compared
- Any mismatch = evidence tampering alert
- All uploads logged in `activity_timeline`

### Versioning
- Each re-upload of same filename increments `version_number`
- Old versions are soft-deleted, not permanently removed
- Full chain of custody maintained

---

## 13. SLA Engine

| Severity | SLA Deadline | Escalation |
|---|---|---|
| Critical | 24 hours | Immediate |
| High | 72 hours (3 days) | After 48 hours |
| Medium | 168 hours (7 days) | After 120 hours |
| Low | 360 hours (15 days) | After 240 hours |

SLA deadline computed at ticket creation. Celery task monitors deadlines. On breach:
- `ticket.is_escalated = True`
- Supervisor and admin notified
- Ticket priority elevated

---

## 14. Folder Structure

```
SentraDesk/
  brain.md                          ← This document
  roadmap.md                        ← Era/Phase/Task roadmap
  README.md                         ← Enterprise README
  SECURITY.md                       ← Enterprise security policy
  .env.example                      ← Environment variables template
  .gitignore
  docker-compose.yml
  LICENSE
  docs/                             ← Additional documentation
  scripts/                          ← Setup and maintenance scripts
  infra/                            ← Grafana, Nginx, Prometheus configs
  tests/load/                       ← Load testing scripts

  backend/
    app/
      api/v1/endpoints/             ← All REST endpoints
      core/                         ← config, database, security, logging, exceptions
      models/                       ← SQLAlchemy models
      schemas/                      ← Pydantic schemas
      repositories/                 ← Database query layer
      services/                     ← Business logic
      tasks/                        ← Celery async tasks
      utils/                        ← Seed data, helpers
    alembic/                        ← Migration scripts
    tests/                          ← All test files
    requirements.txt
    Dockerfile
    alembic.ini
    pytest.ini

  frontend/
    app/
      (public)/                     ← Homepage, about, auth pages
      (citizen)/                    ← Citizen portal (auth-gated)
      (officer)/                    ← Officer portal (auth-gated)
      (admin)/                      ← Admin portal (auth-gated)
      layout.tsx                    ← Root layout
      globals.css                   ← Design system
      not-found.tsx
    components/
      ui/                           ← Atomic reusable components
      layout/                       ← Navbars, sidebars, layouts
      homepage/                     ← Homepage sections
      citizen/                      ← Citizen-specific components
      officer/                      ← Officer-specific components
      admin/                        ← Admin-specific components
    hooks/                          ← Custom React hooks
    lib/                            ← api.ts, auth.ts, constants.ts, utils.ts
    types/                          ← TypeScript interfaces
    services/                       ← API service functions
    public/                         ← Static assets
```

---

## 15. Development Rules & Coding Standards

### The Permanent Documentation Rule
Before marking any feature complete:
1. If architecture, workflows, database, APIs, user journeys, security, or project decisions changed → **update `brain.md` first**
2. Update `roadmap.md` to reflect completed phases
3. Update `README.md` (and `SECURITY.md` if security-related)
4. Only then commit

### Era Completion Verification Sequence (Mandatory)
1. Run backend tests: `pytest backend/tests/ -v`
2. Run frontend TypeScript check: `npx tsc --noEmit`
3. Run frontend build: `npm run build`
4. Open `http://localhost:3000`
5. Manually verify every affected user journey from entry point to exit point
6. Fix every issue found — no deferred bugs
7. Update `brain.md`
8. Update `roadmap.md`
9. Update `README.md` (and `SECURITY.md` if affected)
10. Commit with meaningful message
11. Push to GitHub
12. Verify GitHub Actions shows green checkmark
13. Only then begin the next Era

### Coding Standards

**General**
- Write production-quality code — no shortcuts
- No duplicate logic — extract to service/helper
- No hardcoded values — use constants or env vars
- Keep functions small and single-purpose
- Meaningful names for everything

**Backend**
- Every endpoint must declare its minimum required role
- Never expose stack traces in API responses
- Every major operation must create an audit log entry
- Use SQLAlchemy session correctly — no session leaks
- All migrations via Alembic — never `CREATE TABLE` manually

**Frontend**
- All API calls through `lib/api.ts` — never hardcode URLs
- Role-based route guards enforced at layout level
- TypeScript strict mode — no `any` types
- Components are focused and reusable — no 600-line components
- Form validation with Zod schemas

**Git Commit Convention**
```
feat: Era N - description of what was built
fix: description of what was fixed
chore: description of maintenance task
docs: description of documentation update
refactor: description of refactoring
```

---

## 16. API Endpoint Reference

### Authentication — `/api/v1/auth/`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | None | Login, returns JWT pair |
| POST | `/refresh` | None | Rotate refresh token |
| POST | `/logout` | Citizen+ | Invalidate session |
| POST | `/verify-email` | None | Verify email with token |
| POST | `/forgot-password` | None | Send reset link |
| POST | `/reset-password` | None | Commit new password |

### Users — `/api/v1/users/`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | None | Create new user |
| GET | `/me` | Citizen+ | Get own profile |
| PUT | `/me` | Citizen+ | Update own profile |
| PUT | `/me/password` | Citizen+ | Change own password |
| GET | `/me/stats` | Citizen+ | Own ticket counts |
| GET | `/notifications` | Citizen+ | Get notifications |
| GET | `/notifications/unread-count` | Citizen+ | Unread badge count |
| PUT | `/notifications/{id}/read` | Citizen+ | Mark one as read |
| PUT | `/notifications/read-all` | Citizen+ | Mark all as read |
| GET | `/list` | SystemAdmin | List all users |

### Tickets — `/api/v1/tickets/`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `` | Citizen+ | Create complaint + ticket |
| GET | `` | Officer+ | List all tickets (filtered) |
| GET | `/my-tickets` | Citizen | Own tickets only |
| GET | `/{id}` | Citizen+ | Ticket detail (citizen: own only) |
| PUT | `/{id}/assign` | Supervisor+ | Assign to officer |
| PUT | `/{id}/status` | Officer+ | Update status (validated transitions) |
| POST | `/{id}/comments` | Citizen+ | Add public comment |
| GET | `/{id}/comments` | Citizen+ | Get public comments |
| POST | `/{id}/notes` | Investigator+ | Add private note |
| GET | `/{id}/notes` | Investigator+ | Get private notes |
| GET | `/{id}/timeline` | Citizen+ | Get event timeline |
| GET | `/{id}/similar` | Officer+ | Similar complaints (vector search) |
| GET | `/{id}/explain` | Officer+ | AI explanation breakdown |
| GET | `/{id}/ai-summary` | Officer+ | AI assistant summary card |
| GET | `/{id}/report/complaint` | Officer+ | Download complaint PDF |
| GET | `/{id}/report/case` | Officer+ | Download case PDF |
| POST | `/{id}/feedback` | Citizen | Submit post-closure feedback |
| POST | `/{id}/reopen` | Citizen | Reopen closed ticket |
| POST | `/merge` | Supervisor+ | Merge duplicate tickets |
| GET | `/global/search` | Officer+ | Hybrid keyword + semantic search |

### Evidence — `/api/v1/evidence/`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/{ticket_id}/upload-link` | Citizen+ | Get presigned upload URL |
| POST | `/{ticket_id}/save` | Citizen+ | Save evidence metadata |
| GET | `/{ticket_id}` | Citizen+ | List evidence |
| GET | `/download/{evidence_id}` | Citizen+ | Get download URL |
| GET | `/{ticket_id}/zip` | Investigator+ | Bulk ZIP download |

### Approvals — `/api/v1/approvals/`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/{ticket_id}/request-closure` | Investigator+ | Request closure |
| POST | `/{ticket_id}/l1-approve` | Supervisor+ | L1 approval |
| POST | `/{ticket_id}/l2-approve` | Supervisor+ | L2 approval + close |

### Audit — `/api/v1/audit/`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/logs` | SecurityAuditor+ | Audit log list with hashes |
| GET | `/verify` | SecurityAuditor+ | Hash chain integrity check |
| POST | `/anchor` | SecurityAuditor+ | Anchor batch to chain |
| GET | `/export/pdf` | SecurityAuditor+ | PDF audit report |

### Governance — `/api/v1/governance/`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/kpis` | Officer+ | Platform-wide governance KPIs |
| POST | `/reports/dispatch` | Supervisor+ | Trigger governance report |
| GET | `/export/json` | SecurityAuditor+ | Export data as JSON |
| GET | `/export/csv` | SecurityAuditor+ | Export data as CSV |

### Officer — `/api/v1/officer/` (NEW — Era 4)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | Officer+ | Officer KPI dashboard stats |

### Admin — `/api/v1/admin/` (NEW — Era 5)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | SystemAdmin | Admin platform stats |
| GET | `/users` | SystemAdmin | Paginated user list |
| PUT | `/users/{id}` | SystemAdmin | Enable/disable/role-change |
| GET | `/system-health` | SystemAdmin | Extended service health |

### Other
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | PostgreSQL + Redis health |
| GET | `/metrics` | SystemAdmin | Prometheus metrics |
| POST | `/email/receive-mock` | SystemAdmin | Test email intake |
| POST | `/email/poll` | SystemAdmin | Trigger IMAP poll |
| GET/POST | `/threat-intel/*` | Officer+ | Threat intelligence scans |

---

## 17. Era Completion Log

| Era | Description | Status | Completed |
|---|---|---|---|
| Era 0 | Repository Reset & Master Documents | ✅ Completed | 2026-07-12 |
| Era 1 | Foundation & Design System | ✅ Completed | 2026-07-12 |
| Era 2 | Authentication Flows | ✅ Completed | 2026-07-12 |
| Era 3 | Citizen Portal | ✅ Completed | 2026-07-13 |
| Era 4 | Officer Portal | ✅ Completed | 2026-07-13 |
| Era 5 | Admin Portal | ✅ Completed | 2026-07-13 |
| Era 6 | Backend Polish & AI Modules | ✅ Completed | 2026-07-13 |
| Era 7 | Testing, CI/CD & Final Documentation | ✅ Completed | 2026-07-13 |

---

*Last updated: Era 7 — Final Testing, CI/CD & Final Documentation*

### Infrastructure Refactors: Parallel Routes & Redis Grace Fallback (2026-07-13)
**Root Cause**: The Next.js dev server (`npm run dev`) was started once at the beginning of the project and kept running through multiple project restructuring phases. After bulk file deletions, route changes, and new component additions, the server's internal Webpack/HMR module graph became out of sync with the physical files on disk, causing all `_next/static/` asset requests to return 404.

**Additional contributing factor**: `dashboard/page.tsx` imported `Card` and `KPICard` from `@/components/ui/index`, but those components were not exported from the index file — causing Webpack to fail to compile the module graph for those chunks.

**Permanent Fix**:
1. Kill the stale dev server and delete `frontend/.next/` cache before every fresh environment setup.
2. Exported `Card`, `CardHeader`, `CardBody`, `CardFooter`, `KPICard` from `components/ui/index.tsx`.
3. Corrected all API route key mismatches across citizen portal pages.
4. Added `reloadSession()` to `AuthProvider` context.
5. Removed legacy `transpilePackages` (three.js) from `next.config.js`.

### Administrative Portals, Socket Health Diagnostics & Auth Revocation Grace (2026-07-13)
**Changes**:
1. Created `/api/v1/admin/` routes suite for platform analytics, user directory queries, socket diagnostics, and dynamic configurations.
2. Added `department` and `jurisdiction` optional metadata fields to the `User` model, and registered the new `SystemConfig` schema in SQLAlchemy.
3. Implemented lightweight, sub-second `socket.create_connection` health probes for external services to prevent Axios frontend API timeouts when microservices are offline in local dev setups.
4. Corrected a NameError bug inside `invalidate_session` exception handler in `auth.py` by defining `logger`.
5. Created the Next.js layouts and admin dashboard pages (`dashboard`, `users` list + edit settings modals, `rules`, `health`, `audit`, `config`).

**Developer Rule**: Whenever moving between development environments or after bulk file changes, always run `Remove-Item -Recurse -Force .next, tsconfig.tsbuildinfo` and restart the dev server.

---

## 18. Long-Term Documentation Goals (SAD & API Docs)

### System Architecture Document (SAD)
A formal System Architecture Document will be generated in `docs/system_architecture_document.md` after the completion of Era 5 or Era 6. It will cover:
- High-level system topology and architectural patterns.
- Detailed component relationships, sequence flows, and network boundary conditions.
- Schema definitions and entity-relationship models for all data stores (PostgreSQL, Redis, MinIO, Qdrant).
- Vector indexing strategies and semantic search pipelines.
- Security enclaves, rate limit parameters, and encryption-at-rest policies.

### API Documentation
A consolidated API reference guide will be generated in `docs/api_documentation.md` after the completion of Era 5 or Era 6. It will cover:
- Authentication schemas and token rotation lifecycles.
- Request/Response validation payloads (Zod, Pydantic schemas) for all endpoints.
- Detailed status response definitions and standardized error codes.
- Postman or Swagger JSON specifications matching live application endpoints.

### Era 6: Backend Polish & AI Modules (2026-07-13)
**New Services Implemented**:
1. `ThreatIntelService` (`app/services/threat_intel.py`) — IP reputation (AbuseIPDB), domain scan (OTX), file hash lookup (VirusTotal) with graceful local fallback.
2. `EmailListenerService` enhancement — multipart email parsing, SHA-256 attachment hashing, MinIO upload, Evidence DB registration.
3. Auto-assignment engine in `TicketService` — least-workload routing selects active investigator with fewest open tickets.
4. `UnifiedSearchService` (`app/services/search.py`) — hybrid SQL + vector search across UUID, reporter name, email, phone, ticket number.
5. `ApprovalService.reject_closure` — supervisor rejection transitions ticket to `Reopened`, resets L1/L2 flags, sends in-app notification.

**Bug Fixes**:
- `search.py`: Fixed `ModuleNotFoundError` for `app.models.complaint` (correct path: `app.models.ticket`).
- `search.py`: Fixed `AttributeError: Complaint has no attribute 'category'` (category is on `Ticket` model).
- `approval.py`: Fixed invalid state transition `Closure Requested` → `Under Investigation` (correct: → `Reopened`).
- `ticket.py` / `approval.py`: Added `ENVIRONMENT != 'testing'` guards on all `send_notification_task.delay()` calls to prevent 20-retry Celery/Redis hang during unit tests.
- `conftest.py`: Changed `os.environ.setdefault("ENVIRONMENT", ...)` to forced assignment `os.environ["ENVIRONMENT"] = "testing"` so shell env vars cannot override.
- `test_era6.py`: Replaced raw `Ticket()` instantiation with `ticket_service.create_complaint_and_ticket()` to avoid `NOT NULL constraint failed: tickets.complaint_id`.

**New Test Suite**: `backend/tests/test_era6.py` — 5 tests covering all new features.

**Performance Benchmarks**: `backend/app/scripts/analyze_performance.py` — 30-iteration benchmark covering all 5 feature categories. Results: Threat Intel ~0.03ms; Hybrid Search ~1.5ms; Auto-Assign ~10.6ms; Email Parser ~17ms; Full Rejection Cycle ~426ms (compound).

**Verification**: 22/22 backend tests pass | `npx tsc --noEmit` clean | `npm run build` 33/33 pages compiled.

---

### Era 7: Final Testing, CI/CD & Production Readiness (2026-07-13)
**Activities & Validations**:
1. **Docker Compose Verification**: Run syntax check via `docker compose config`. The system architecture, volumes, health checks, dependency ordering, and environment mappings for all 8 microservices (Postgres, Redis, MinIO, Qdrant, Backend, Frontend, Celery Worker, Prometheus, Grafana) are validated.
2. **Backend Code & Tests Coverage**: Verified the complete test suite. All 22 tests targeting authentication, JWT tokens, evidence uploads, SLA escalations, notifications logs, vector search, and L1/L2 approval workflows passed with no failures.
3. **Frontend Compilation & Standalone Builds**: Validated compile status of React 19 pages. Checked TypeScript definitions with `npx tsc --noEmit` (0 errors) and ran `npm run build` to generate optimized production bundles for all 33 views under Next.js 15 standalone output configuration.
4. **Environment Variables**: Confirmed that all production parameters match across `.env.example`, `docker-compose.yml`, and `app/core/config.py`.
5. **Documentation Review**: Updated all documentation (brain.md, roadmap.md, README.md, SECURITY.md, and walkthrough.md) to reflect Version 1.0 architecture and completed development.


