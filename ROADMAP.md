# 🚀 Cyber Complaint Governance Platform (CCGP) — Consolidated Roadmap

This is the consolidated enterprise implementation roadmap for the **Cyber Complaint Governance Platform (CCGP)**, built in accordance with national cyber cell specifications and enterprise governance guidelines. 

The roadmap is structured into **12 Eras** spanning **100 logical phases** (Phases 0 to 99). 

---

## 🗺️ Roadmap Overview

| Era | Focus | Phase Range | Status |
| --- | --- | --- | --- |
| **1. Foundation Era** | Project initialization, Docker, core libraries, and db configurations | Phases 0 - 9 | Completed ✅ |
| **2. Security & Auth Era** | JWT, session management, RBAC, hardening, audit logger foundations | Phases 10 - 19 | Completed ✅ |
| **3. Intake & Ticket Era** | Multi-channel schema, ticket state machine, assignment, comments, search | Phases 20 - 32 | Completed ✅ |
| **4. Email Automation Era** | IMAP integration, email parsing, threading, SMTP notifications, and queues | Phases 33 - 41 | Not Started ⏳ |
| **5. Workflow & SLA Era** | SLA engine, deadline tracking, escalations, L1/L2 approval workflows | Phases 42 - 49 | Not Started ⏳ |
| **6. Evidence & Storage Era** | MinIO integration, hashing, file verification, evidence management | Phases 50 - 55 | Not Started ⏳ |
| **7. AI Intelligence Era** | Language detection, categorization, extraction, duplicates, similar cases | Phases 56 - 67 | Not Started ⏳ |
| **8. Search & Threat Intel** | Global search index, entity search, VirusTotal, reputation feeds | Phases 68 - 73 | Not Started ⏳ |
| **9. Blockchain Audit Era** | Cryptographic hash chains, Merkle roots, immutable ledger anchoring | Phases 74 - 79 | Not Started ⏳ |
| **10. Governance & Analytics** | BI dashboards, Leaflet heatmaps, performance indicators, report exports | Phases 80 - 89 | Not Started ⏳ |
| **11. DevOps & Operations** | Auto backups, restores, Prometheus metrics, Grafana, SIEM routing | Phases 90 - 95 | Not Started ⏳ |
| **12. Deployment & Release** | CI/CD actions, NGINX configuration, performance/load testing, v1.0 release | Phases 96 - 99 | Not Started ⏳ |

---

## 🏗️ ERA 1: FOUNDATION ERA (Phases 0 - 9)
> **Goal:** Set up the repository, configurations, multi-container Docker structures, logging, exception handling, and database interfaces.

### Phase 0: Project Planning & Repository Architecture
* **Status:** Completed ✅
* **Dependencies:** None
* **Deliverables:** Architecture design, `.gitignore`, licensing, style guidelines (`CONTRIBUTING.md`, `SECURITY.md`).
* **Acceptance Criteria:** Directory layout is finalized; Git repository is initialized with default rules.

### Phase 1: Backend Project Initialization
* **Status:** Completed ✅
* **Dependencies:** Phase 0
* **Deliverables:** FastAPI core backend, Pydantic configuration loader, dependencies requirements file.
* **Acceptance Criteria:** FastAPI server starts successfully and exposes basic setup metrics.

### Phase 2: Frontend Project Initialization
* **Status:** Completed ✅
* **Dependencies:** Phase 0
* **Deliverables:** Next.js 15 application initialization with TypeScript and Tailwind CSS.
* **Acceptance Criteria:** React development server launches and renders the main page.

### Phase 3: PostgreSQL & SQLAlchemy Database Integration
* **Status:** Completed ✅
* **Dependencies:** Phase 1
* **Deliverables:** Database connection pooling, ORM base models, and Alembic database migration config.
* **Acceptance Criteria:** Health check API verifies database connection connectivity.

### Phase 4: Modular Architecture & Folder Structure
* **Status:** Completed ✅
* **Dependencies:** Phase 1, Phase 2
* **Deliverables:** Segregated routers, services, repositories, schemas, models, and utility folders.
* **Acceptance Criteria:** Implements clean architecture separation without circular dependencies.

### Phase 5: Environment Configuration & Docker Compose Foundation
* **Status:** Completed ✅
* **Dependencies:** Phase 3, Phase 4
* **Deliverables:** Multi-service `docker-compose.yml` including db, Redis, MinIO, Qdrant, backend, and frontend.
* **Acceptance Criteria:** All services start and interconnect successfully via `docker compose up --build`.

### Phase 6: Alembic Migrations System & DB Seeding
* **Status:** Completed ✅
* **Dependencies:** Phase 3, Phase 5
* **Deliverables:** Alembic version history folders, db migration script, base data seeding commands.
* **Acceptance Criteria:** Running migrations applies schema changes without errors; test users are seeded.

### Phase 7: Logging & Diagnostics Infrastructure
* **Status:** Completed ✅
* **Dependencies:** Phase 1
* **Deliverables:** Structured JSON logger, unified application logging middleware.
* **Acceptance Criteria:** Application actions produce clear logs containing Request-IDs.

### Phase 8: Exception Handling & Global Response Formatting
* **Status:** Completed ✅
* **Dependencies:** Phase 1, Phase 4
* **Deliverables:** Global exception handler, unified JSON response wrapper for error and success states.
* **Acceptance Criteria:** Any backend error returns standard structured JSON with error detail.

### Phase 9: Redis Caching & Connection Pools
* **Status:** Completed ✅
* **Dependencies:** Phase 5
* **Deliverables:** Centralized Redis service class, connection manager with reuse helper utilities.
* **Acceptance Criteria:** Redis connection is established; client successfully caches and retrieves keys.

---

## 🔐 ERA 2: SECURITY & AUTHENTICATION FOUNDATION ERA (Phases 10 - 19)
> **Goal:** Secure the platform using JWT token rotation, Active Session Management, Role-Based Access Control, Rate Limiting, and Secret Enclaves.

### Phase 10: JWT Authentication Infrastructure
* **Status:** Completed ✅
* **Dependencies:** Phase 3, Phase 6
* **Deliverables:** Login, Access Token generation APIs, and secure bcrypt password hashing.
* **Acceptance Criteria:** User can log in with a valid password and receive a signed JWT access token.

### Phase 11: Refresh Token & Session Management
* **Status:** Completed ✅
* **Dependencies:** Phase 10
* **Deliverables:** Refresh token endpoint, active database-backed session model.
* **Acceptance Criteria:** Requesting refresh returns new access token; handles token rotation securely.

### Phase 12: Role-Based Access Control (RBAC) Core
* **Status:** Completed ✅
* **Dependencies:** Phase 10, Phase 11
* **Deliverables:** Core application role configurations (Citizen, Operator, Officer, Investigator, Supervisor, Admin, Auditor).
* **Acceptance Criteria:** Endpoints verify role flags before executing handlers.

### Phase 13: Session Revocation & Token Denylist
* **Status:** Completed ✅
* **Dependencies:** Phase 9, Phase 11
* **Deliverables:** Logout API, Redis-backed JWT token denylisting, and administrator session revocation endpoint.
* **Acceptance Criteria:** Logout invalidates the current access token and deletes the refresh session.

### Phase 14: Protected APIs Routing & Auth Middleware
* **Status:** Completed ✅
* **Dependencies:** Phase 4, Phase 12
* **Deliverables:** Route protection dependency decorators, frontend authentication middleware handler.
* **Acceptance Criteria:** Unauthenticated requests to protected endpoints return `401 Unauthorized`.

### Phase 15: Security Hardening & Rate Limiting
* **Status:** Completed ✅
* **Dependencies:** Phase 9, Phase 14
* **Deliverables:** Redis rate-limiting decorator, XSS/SQLi sanitizer filters, secure HTTP headers.
* **Acceptance Criteria:** Exceeding requests/second threshold returns `429 Too Many Requests`.

### Phase 16: Secrets Management Infrastructure
* **Status:** Completed ✅
* **Dependencies:** Phase 5
* **Deliverables:** Pydantic environment loader securing keys and token signing algorithms.
* **Acceptance Criteria:** Sensitive credentials cannot be checked into source control and load dynamically.

### Phase 17: Step-Up Authentication Framework
* **Status:** Completed ✅
* **Dependencies:** Phase 14
* **Deliverables:** Step-up action flags, multi-factor authorization checkpoints placeholder.
* **Acceptance Criteria:** Accessing highly sensitive APIs triggers a step-up verify challenge request.

### Phase 18: Application Audit Logging Infrastructure
* **Status:** Completed ✅
* **Dependencies:** Phase 7, Phase 12
* **Deliverables:** Audit logger middleware recording actor, action, timestamp, IP, and target data.
* **Acceptance Criteria:** User logins, profile changes, and security breaches produce logs in the DB.

### Phase 19: Identity Federation Preps
* **Status:** Completed ✅
* **Dependencies:** Phase 14
* **Deliverables:** SSO-ready configuration files, OIDC endpoint interfaces mapping external roles.
* **Acceptance Criteria:** Authentication services support extensions for multi-tenant identity.

---

## 🎫 Intakes & Tickets: ERA 3: MULTI-CHANNEL INTAKE & TICKET MANAGEMENT ERA (Phases 20 - 32)
> **Goal:** Create complaints, automatically track them as tickets, define a strict state-machine workflow, and build management interfaces.

### Phase 20: Multi-channel Complaint Schema & Data Models
* **Status:** Completed ✅
* **Dependencies:** Phase 6
* **Deliverables:** DB Schema for Complaints and Tickets (supporting Portal, Email, Mobile, Helpline, Police Station).
* **Acceptance Criteria:** Database updates compile; columns cover title, description, source, and severity.

### Phase 21: Complaint Submission APIs
* **Status:** Completed ✅
* **Dependencies:** Phase 20
* **Deliverables:** Public submission API, citizen complaint creation validations.
* **Acceptance Criteria:** Citizen submission accepts inputs, saves to Database, and returns receipt.

### Phase 22: Ticket Generation Engine
* **Status:** Completed ✅
* **Dependencies:** Phase 21
* **Deliverables:** Ticket creation background worker, sequence-based ticket number generator.
* **Acceptance Criteria:** Submitting a complaint automatically generates a ticket with tag `CCGP-2026-XXXX`.

### Phase 23: Ticket Lifecycle & State Machine
* **Status:** Completed ✅
* **Dependencies:** Phase 22
* **Deliverables:** State transition rules engine, valid state transition guard middleware.
* **Acceptance Criteria:** Validates lifecycle changes (e.g. Assigned -> Investigation; denies Assigned -> Closed directly).

### Phase 24: Ticket Versioning & History Model
* **Status:** Completed ✅
* **Dependencies:** Phase 20
* **Deliverables:** Ticket version table saving before/after JSON structures on every ticket change.
* **Acceptance Criteria:** Modifying ticket attributes inserts history record with author ID.

### Phase 25: Ticket Assignment Rules Engine
* **Status:** Completed ✅
* **Dependencies:** Phase 22
* **Deliverables:** Automatic routing rules evaluating Category, Severity, and Jurisdiction.
* **Acceptance Criteria:** Tickets are auto-routed to matching regional cyber cell teams.

### Phase 26: Assignment Groups & Distribution Lists
* **Status:** Completed ✅
* **Dependencies:** Phase 25
* **Deliverables:** Database mapping of user officers to specific teams (e.g. Fraud Investigation Unit).
* **Acceptance Criteria:** Assignment APIs support assigning tickets to a group or team.

### Phase 27: Ticket Merge & Linking Engine
* **Status:** Completed ✅
* **Dependencies:** Phase 22
* **Deliverables:** Endpoints to link related tickets, merge duplicates, and mark parent-child relations.
* **Acceptance Criteria:** Merging links duplicate tickets to primary ticket and synchronizes updates.

### Phase 28: Internal Comment System
* **Status:** Completed ✅
* **Dependencies:** Phase 22
* **Deliverables:** DB models, GET/POST APIs for officer ticket comments and attachment details.
* **Acceptance Criteria:** Authenticated officers can read/write ticket comments.

### Phase 29: Officer Private Notes System
* **Status:** Completed ✅
* **Dependencies:** Phase 28
* **Deliverables:** Database schema for internal-only notes flag, hide-from-citizen permissions.
* **Acceptance Criteria:** Only authorized officers can view private comments/notes.

### Phase 30: Activity Feed & Timeline Generator
* **Status:** Completed ✅
* **Dependencies:** Phase 24, Phase 28
* **Deliverables:** Aggregator service combining history, comments, and status events into a single sorted timeline.
* **Acceptance Criteria:** GET API returns a chronologically sorted feed of events for any ticket ID.

### Phase 31: Ticket Search & Advanced Filter Backend
* **Status:** Completed ✅
* **Dependencies:** Phase 20
* **Deliverables:** PostgreSQL indexing, flexible query endpoints (status, priority, reporter, assigned).
* **Acceptance Criteria:** Filter API filters tickets instantly and returns matching lists.

### Phase 32: Frontend Ticket Queue & Detail View
* **Status:** Completed ✅
* **Dependencies:** Phase 2, Phase 14
* **Deliverables:** Ticket management dashboards, sorting lists, card components, detailed ticket logs view.
* **Acceptance Criteria:** Authenticated officer can view, search, and navigate ticket lists in browser.

---

## 📧 ERA 4: EMAIL AUTOMATION ERA (Phases 33 - 41)
> **Goal:** Connect systems to external mailbox, parse incoming emails, automatically create tickets, and dispatch status alerts.

### Phase 33: Email Listener Infrastructure
* **Status:** Completed ✅
* **Dependencies:** Phase 9, Phase 22
* **Deliverables:** IMAP connection library, background worker listener polling mailbox.
* **Acceptance Criteria:** Worker establishes TLS connection, reads new emails from Inbox.

### Phase 34: Email Parsing Engine
* **Status:** Completed ✅
* **Dependencies:** Phase 33
* **Deliverables:** Email message headers parser, body plain-text/HTML decoder helper.
* **Acceptance Criteria:** Parses fields like from, subject, date, body contents successfully.

### Phase 35: Attachment Processing & Storage
* **Status:** Completed ✅
* **Dependencies:** Phase 34
* **Deliverables:** Attachment files reader, storage pipeline streaming attachments.
* **Acceptance Criteria:** Downloads attachment file byte-arrays, prepares metadata headers.

### Phase 36: Email Threading & Conversation History
* **Status:** Completed ✅
* **Dependencies:** Phase 34
* **Deliverables:** Database index tracking headers (`In-Reply-To`, `References`).
* **Acceptance Criteria:** Map incoming email replies to existing ticket threads instead of creating new ones.

### Phase 37: Automatic Ticket Creation from Email
* **Status:** Completed ✅
* **Dependencies:** Phase 22, Phase 34
* **Deliverables:** Intake parser executing complaint creation parameters from email body.
* **Acceptance Criteria:** Valid email complaint creates active ticket with email source indicator.

### Phase 38: SMTP Mail Dispatcher
* **Status:** Completed ✅
* **Dependencies:** Phase 1
* **Deliverables:** SMTP mail delivery service wrapper.
* **Acceptance Criteria:** Dispatches test email with HTML templates securely.

### Phase 39: Notification Templates Engine
* **Status:** Completed ✅
* **Dependencies:** Phase 38
* **Deliverables:** Jinja2 dynamic template folders (Ticket Created, SLA Alert, Closed status).
* **Acceptance Criteria:** Combines ticket variables with template HTML dynamically.

### Phase 40: Notification History & Delivery Tracking
* **Status:** Completed ✅
* **Dependencies:** Phase 38
* **Deliverables:** Notification logs table saving target, template, status (Sent, Failed), retry count.
* **Acceptance Criteria:** Dispatched notifications insert status logs into Database.

### Phase 41: Email Queue & Reliability Retry Engine
* **Status:** Completed ✅
* **Dependencies:** Phase 9, Phase 40
* **Deliverables:** Celery background tasks retry handler.
* **Acceptance Criteria:** Automatic retry for failed notifications with exponential backoff.

---

## ⚖️ ERA 5: WORKFLOW & SLA MANAGEMENT ERA (Phases 42 - 49)
> **Goal:** Track SLAs, configure escalations, enforce two-layer human-in-the-loop approvals.

### Phase 42: SLA Model & Configuration
* **Status:** Completed ✅
* **Dependencies:** Phase 20
* **Deliverables:** SLA rules table assigning deadlines by severity.
* **Acceptance Criteria:** SLA policies can be saved and mapped dynamically.

### Phase 43: SLA Engine & Timer Service
* **Status:** Completed ✅
* **Dependencies:** Phase 42
* **Deliverables:** Expiration times calculation logic, remaining-time active timers in DB.
* **Acceptance Criteria:** Ticket record displays SLA deadline datetime on initialization.

### Phase 44: SLA Breach Monitoring & Alerts
* **Status:** Completed ✅
* **Dependencies:** Phase 43
* **Deliverables:** Celery cron checking imminent SLA deadlines.
* **Acceptance Criteria:** Triggers alarms when ticket remains open past threshold limit.

### Phase 45: SLA Escalation Engine
* **Status:** Completed ✅
* **Dependencies:** Phase 44
* **Deliverables:** Automatic escalations dispatcher (reassigns team, boosts ticket priority).
* **Acceptance Criteria:** Breached tickets escalate to Supervisor category automatically.

### Phase 46: Ticket Closure Approval Workflow
* **Status:** Completed ✅
* **Dependencies:** Phase 23
* **Deliverables:** Approval request flag, closure-requested status transition guards.
* **Acceptance Criteria:** Transitioning ticket to closed requires active approvals.

### Phase 47: L1 Approval Workflow & Verification
* **Status:** Completed ✅
* **Dependencies:** Phase 46
* **Deliverables:** L1 approval validation routes, comments, decisions logging database schema.
* **Acceptance Criteria:** Supervisor reviews and signs off; pushes ticket to L2 status.

### Phase 48: L2 Approval Workflow & Final Resolution
* **Status:** Completed ✅
* **Dependencies:** Phase 47
* **Deliverables:** L2 approval sign-off endpoints.
* **Acceptance Criteria:** Senior Supervisor approves; ticket state changes to Closed.

### Phase 49: Workflow Dashboard
* **Status:** Completed ✅
* **Dependencies:** Phase 32, Phase 46
* **Deliverables:** Multi-level pending approval listings in the dashboard UI.
* **Acceptance Criteria:** Supervisors can view and action all pending approvals in grid format.

---

## 📂 ERA 6: EVIDENCE & STORAGE ERA (Phases 50 - 55)
> **Goal:** Integrate MinIO Object Storage, hash uploads, manage file versions.

### Phase 50: MinIO Storage Client Service
* **Status:** Completed ✅
* **Dependencies:** Phase 5
* **Deliverables:** MinIO Python API adapter, bucket initialization logic.
* **Acceptance Criteria:** Backend uploads and downloads file bytes using mock storage.

### Phase 51: Evidence Upload & Metadata Schema
* **Status:** Completed ✅
* **Dependencies:** Phase 50
* **Deliverables:** Evidence schema, pre-signed upload URLs generator endpoints.
* **Acceptance Criteria:** Client requests secure pre-signed link, uploads file to bucket.

### Phase 52: Evidence Cryptographic Hashing
* **Status:** Completed ✅
* **Dependencies:** Phase 51
* **Deliverables:** SHA-256 calculation middleware processing uploads.
* **Acceptance Criteria:** Database records secure hash signature alongside file details.

### Phase 53: Evidence Versioning & History
* **Status:** Completed ✅
* **Dependencies:** Phase 51
* **Deliverables:** File versions history log, parent-version mapping indexes.
* **Acceptance Criteria:** Re-uploading evidence creates new file version while retaining the old one.

### Phase 54: Bulk Evidence Retrieval & Zipping
* **Status:** Completed ✅
* **Dependencies:** Phase 50
* **Deliverables:** Zip compilation service.
* **Acceptance Criteria:** Requests download of multiple evidence assets; returns single ZIP archive.

### Phase 55: Evidence Management UI
* **Status:** Completed ✅
* **Dependencies:** Phase 32, Phase 51
* **Deliverables:** Upload fields, evidence viewer grid in Next.js portal.
* **Acceptance Criteria:** Officers drag-and-drop evidence, see file status and validation checks.

---

## 🤖 ERA 7: AI FOUNDATION & INTELLIGENCE ERA (Phases 56 - 67)
> **Goal:** Deploy MLflow, detect language, classify categories, extract entities, run similarity searches on Qdrant, calculate confidence.

### Phase 56: AI Architecture & Framework Setup
* **Status:** Completed ✅
* **Dependencies:** Phase 5
* **Deliverables:** MLflow interface setup, pipeline execution base class.
* **Acceptance Criteria:** MLflow logs initialization data, models registry interface is ready.

### Phase 57: Language Detection Service
* **Status:** Completed ✅
* **Dependencies:** Phase 56
* **Deliverables:** Language identification utility (supporting English, Hindi, regional dialects).
* **Acceptance Criteria:** Categorizes input text language accurately before AI processing.

### Phase 58: AI Complaint Classification Model
* **Status:** Completed ✅
* **Dependencies:** Phase 57
* **Deliverables:** Text classifier service predicting complaint class (e.g. Cyber Financial Fraud).
* **Acceptance Criteria:** ML model categorizes complaint with probability distribution list.

### Phase 59: AI Entity Extraction Engine
* **Status:** Completed ✅
* **Dependencies:** Phase 57
* **Deliverables:** Named Entity Recognition (NER) pipeline (Phone, Email, UPI, Wallet, PAN).
* **Acceptance Criteria:** Processes complaint body, returns lists of extracted technical entities.

### Phase 60: AI Severity & Risk Scoring Engine
* **Status:** Completed ✅
* **Dependencies:** Phase 58
* **Deliverables:** Risk calculation engine (scores 0-100 based on financial loss, victim profiles).
* **Acceptance Criteria:** Returns risk score and category classification (Critical, High, Medium, Low).

### Phase 61: Vector Search Database Integration
* **Status:** Completed ✅
* **Dependencies:** Phase 5
* **Deliverables:** Qdrant DB Python wrapper, collection schemas.
* **Acceptance Criteria:** Connects to Qdrant cluster, initializes vectors collection.

### Phase 62: AI Duplicate Complaint Detection
* **Status:** Completed ✅
* **Dependencies:** Phase 61
* **Deliverables:** Text embeddings generator, similarity threshold matcher.
* **Acceptance Criteria:** Checks Qdrant index; flags similar incoming complaints as possible duplicates.

### Phase 63: AI Complaint Similarity Search
* **Status:** Completed ✅
* **Dependencies:** Phase 62
* **Deliverables:** Similarity search API.
* **Acceptance Criteria:** GET api returns listing of related past complaints with similarity scores.

### Phase 64: Human-in-the-Loop Review Queue
* **Status:** Completed ✅
* **Dependencies:** Phase 23, Phase 58
* **Deliverables:** Low-confidence queue model, routing logic.
* **Acceptance Criteria:** Routes complaints with confidence score < threshold to Operator review queue.

### Phase 65: AI Confidence Scores & Explainability
* **Status:** Completed ✅
* **Dependencies:** Phase 58
* **Deliverables:** Explainability logger, confidence tracker.
* **Acceptance Criteria:** Stores confidence percentage and brief decision reasoning alongside prediction.

### Phase 66: Investigator AI Assistant
* **Status:** Completed ✅
* **Dependencies:** Phase 59, Phase 65
* **Deliverables:** Summary generator API, list of recommended next steps.
* **Acceptance Criteria:** Provides case summary to the officer in the detailed ticket view.

### Phase 67: AI Decision Logs & Performance Monitoring
* **Status:** Completed ✅
* **Dependencies:** Phase 18, Phase 56
* **Deliverables:** AI model audit logs in DB, logs metrics to MLflow.
* **Acceptance Criteria:** Logs inputs, outputs, models version, and latency statistics.

---

## 🔍 ERA 8: SEARCH & THREAT INTELLIGENCE ERA (Phases 68 - 73)
> **Goal:** Run advanced keyword/vector search, index entities, scan files via VirusTotal.

### Phase 68: Global Advanced Search Backend
* **Status:** Completed ✅
* **Dependencies:** Phase 31, Phase 61
* **Deliverables:** Unified SQL + Vector Search service class.
* **Acceptance Criteria:** Performs combined queries across text databases and vector collections.

### Phase 69: Entity-Specific Search Index
* **Status:** Completed ✅
* **Dependencies:** Phase 59
* **Deliverables:** Specialized indexes for Phone, UPI, Email, Bank Account, Wallet, PAN.
* **Acceptance Criteria:** Searching a phone number immediately lists all tickets where it was extracted.

### Phase 70: Threat Intelligence Core
* **Status:** Completed ✅
* **Dependencies:** Phase 4
* **Deliverables:** Indicators of Compromise (IoC) database mappings.
* **Acceptance Criteria:** Defines models to host blacklisted IPs, malicious domains, fraudulent accounts.

### Phase 71: VirusTotal Integration API
* **Status:** Completed ✅
* **Dependencies:** Phase 50
* **Deliverables:** VirusTotal API adapter scanning uploaded evidence files.
* **Acceptance Criteria:** Flag uploaded binaries/files that contain matching malware hashes.

### Phase 72: AbuseIPDB & OTX Reputation Integrations
* **Status:** Completed ✅
* **Dependencies:** Phase 70
* **Deliverables:** Reputation check services queries dispatcher.
* **Acceptance Criteria:** Queries external APIs; returns threat score for IP/domains.

### Phase 73: Unified Search UI
* **Status:** Completed ✅
* **Dependencies:** Phase 32, Phase 68
* **Deliverables:** Faceted search page with tags, date sliders, exports controls.
* **Acceptance Criteria:** Display query results with highlights and filters in the web browser.

---

## ⛓ ERA 9: BLOCKCHAIN AUDIT & INTEGRITY ERA (Phases 74 - 79)
> **Goal:** Hash-chain audit logs, build Merkle roots, anchor hashes, implement verification dashboard.

### Phase 74: Hash-Based Audit Chain Service
* **Status:** Completed ✅
* **Dependencies:** Phase 18
* **Deliverables:** Row-level hashing triggers in DB.
* **Acceptance Criteria:** Each audit log insert contains a hash computed from data + previous log hash.

### Phase 75: Merkle Tree Generator
* **Status:** Completed ✅
* **Dependencies:** Phase 74
* **Deliverables:** Merkle tree compiler library.
* **Acceptance Criteria:** Groups audit records in batch interval; outputs Merkle root hash.

### Phase 76: Hyperledger / Verifiable Journal Client
* **Status:** Completed ✅
* **Dependencies:** Phase 75
* **Deliverables:** Permissioned ledger driver / journaling mock service.
* **Acceptance Criteria:** Submits batch Merkle root to external ledger node; saves tx index.

### Phase 77: Audit Verification Engine
* **Status:** Completed ✅
* **Dependencies:** Phase 74, Phase 76
* **Deliverables:** Integrity check script re-hashing rows and verifying anchors.
* **Acceptance Criteria:** Detects alterations (modified values, deleted rows, gap breaks).

### Phase 78: Auditor Workspace & Verification UI
* **Status:** Completed ✅
* **Dependencies:** Phase 32, Phase 77
* **Deliverables:** Auditor dashboard panel showing ledger status, mismatch alarms.
* **Acceptance Criteria:** Auditor runs verification check, visually monitors validation logs.

### Phase 79: Audit Logs Exporter
* **Status:** Completed ✅
* **Dependencies:** Phase 78
* **Deliverables:** PDF report compiler with verification signatures.
* **Acceptance Criteria:** Generates signed audit log exports for court evidence.

---

## 📊 ERA 10: GOVERNANCE, ANALYTICS & REPORTING ERA (Phases 80 - 89)
> **Goal:** Deploy Leaflet maps, show investigator KPIs, generate complaint PDFs.

### Phase 80: Executive Governance Dashboard
* **Status:** Completed ✅
* **Dependencies:** Phase 32
* **Deliverables:** High-level metrics view: active complaints, solve rates, SLA status.
* **Acceptance Criteria:** Shows real-time statistics panels for cyber cell executives.

### Phase 81: Operations & Analytics Dashboard
* **Status:** Completed ✅
* **Dependencies:** Phase 80
* **Deliverables:** Recharts-based statistics graphs, category-wise breakdowns.
* **Acceptance Criteria:** Visual analytics load correctly.

### Phase 82: District & State Heatmaps
* **Status:** Completed ✅
* **Dependencies:** Phase 81
* **Deliverables:** React Leaflet geo maps component mapping regional incident counts.
* **Acceptance Criteria:** Renders visual heat map indicating high-activity sectors.

### Phase 83: Investigator Performance Analytics
* **Status:** Completed ✅
* **Dependencies:** Phase 80
* **Deliverables:** Performance logs parser showing average close times, backlog counts.
* **Acceptance Criteria:** Admins can view individual officer workload metrics.

### Phase 84: Complaint Reports Generator
* **Status:** Completed ✅
* **Dependencies:** Phase 20
* **Deliverables:** PDF exporter for single complaint sheets.
* **Acceptance Criteria:** Exports detailed complaint report file upon clicking print.

### Phase 85: Investigation Reports Generator
* **Status:** Completed ✅
* **Dependencies:** Phase 51, Phase 84
* **Deliverables:** Case report generator compile-service.
* **Acceptance Criteria:** Compiles timeline, evidence logs, notes, metadata into single PDF.

### Phase 86: Executive Governance Reports Scheduler
* **Status:** Completed ✅
* **Dependencies:** Phase 41, Phase 85
* **Deliverables:** Celery background scheduling, auto-emails reports.
* **Acceptance Criteria:** Automates delivery of monthly analytics reports to supervisors.

### Phase 87: AI Model Decision Reports
* **Status:** Completed ✅
* **Dependencies:** Phase 67
* **Deliverables:** Model classification evaluation reports.
* **Acceptance Criteria:** Reports accuracy percentages, drift values, override counts.

### Phase 88: SLA & Escalation Reporting
* **Status:** Completed ✅
* **Dependencies:** Phase 44, Phase 85
* **Deliverables:** SLA violations report compiler.
* **Acceptance Criteria:** Identifies department queues having the highest breach percentages.

### Phase 89: BI Data Export API
* **Status:** Completed ✅
* **Dependencies:** Phase 14
* **Deliverables:** Secure, token-authorized database exports API (JSON/CSV).
* **Acceptance Criteria:** External reporting platforms (PowerBI) retrieve analytics securely.

---

## 🛡️ ERA 11: DEVOPS, BACKUP & OPERATIONS ERA (Phases 90 - 95)
> **Goal:** Automate database/MinIO backups, deploy Prometheus/Grafana, implement SIEM.

### Phase 90: Automated PostgreSQL Backup Manager
* **Status:** Completed ✅
* **Dependencies:** Phase 5, Phase 9
* **Deliverables:** Celery database backup scheduler.
* **Acceptance Criteria:** Generates `.sql` backup files, compresses and saves them.

### Phase 91: Evidence Storage Backup System
* **Status:** Completed ✅
* **Dependencies:** Phase 50, Phase 90
* **Deliverables:** Object replication utility backing up MinIO buckets.
* **Acceptance Criteria:** Syncs local evidence files with backup directories.

### Phase 92: Restore & Disaster Recovery Verification
* **Status:** Completed ✅
* **Dependencies:** Phase 90
* **Deliverables:** Recovery testing shell commands/scripts.
* **Acceptance Criteria:** Validates backups integrity by restoring to test db instance automatically.

### Phase 93: Prometheus Metrics & Health-Check Endpoints
* **Status:** Completed ✅
* **Dependencies:** Phase 7
* **Deliverables:** Prometheus client library integration in FastAPI.
* **Acceptance Criteria:** `/metrics` endpoint exports CPU, request count, db pool count.

### Phase 94: Grafana Dashboard Setup
* **Status:** Completed ✅
* **Dependencies:** Phase 93
* **Deliverables:** Configured Grafana UI dashboards.
* **Acceptance Criteria:** Graphically displays metrics metrics.

### Phase 95: SIEM Integration System
* **Status:** Completed ✅
* **Dependencies:** Phase 7
* **Deliverables:** Syslog JSON output configuration.
* **Acceptance Criteria:** Forwards audit and error events to external collectors.

---

## 🚀 ERA 12: DEPLOYMENT & ENTERPRISE VALIDATION ERA (Phases 96 - 99)
> **Goal:** Setup CI/CD, configure NGINX, load test, deploy v1.0.

### Phase 96: GitHub Actions CI/CD Pipeline
* **Status:** Completed ✅
* **Dependencies:** None
* **Deliverables:** `.github/workflows/ci.yml` file.
* **Acceptance Criteria:** Checks out code, triggers linting (ruff, eslint), runs tests.

### Phase 97: NGINX Reverse Proxy & TLS Configuration
* **Status:** Completed ✅
* **Dependencies:** Phase 5
* **Deliverables:** NGINX config file setting up proxies, headers, SSL paths.
* **Acceptance Criteria:** NGINX handles traffic, terminates TLS.

### Phase 98: Production Stability & Load Testing
* **Status:** Completed ✅
* **Dependencies:** Phase 97
* **Deliverables:** Locust test scripts simulating concurrent requests.
* **Acceptance Criteria:** Application maintains <200ms latency under benchmark load.

### Phase 99: CCGP Enterprise Edition v1.0 Release
* **Status:** Completed ✅
* **Dependencies:** All previous phases
* **Deliverables:** Final deployment builds, version release documentation, git tags.
* **Acceptance Criteria:** Complete platform verified; passes checklist; builds clean.
