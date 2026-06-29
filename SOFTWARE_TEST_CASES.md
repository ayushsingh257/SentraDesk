# CCGP Enterprise Edition — Formal Software Test Case Document

**Project:** Cyber Complaint Governance Platform (CCGP)  
**Version:** v1.0.0  
**Document Type:** Software Test Case Specification  
**Date:** 2026-06-29  
**Prepared By:** Automated Verification Pipeline  

---

## Test Environment

| Parameter | Value |
|---|---|
| Backend | FastAPI 0.111.0 / Python 3.13 |
| Frontend | Next.js 15.1.0 / React 19 |
| Database | PostgreSQL 16 / SQLite (test) |
| Cache | Redis 7 |
| Storage | MinIO 7.x |
| Vector DB | Qdrant v1.9.3 |
| CI | GitHub Actions ubuntu-latest |

---

## Module 1: Authentication & Session Management

### TC-AUTH-01: Valid User Login
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AUTH-01 |
| **Module** | Authentication |
| **Priority** | Critical |
| **Preconditions** | Application running; seeded user exists |
| **Test Steps** | 1. POST `/api/v1/auth/login` with `{"email":"officer@ccgp.gov.in","password":"password123"}` |
| **Expected Result** | HTTP 200; response contains `access_token`, `token_type: bearer` |
| **Actual Result** | ✅ HTTP 200; JWT token returned |
| **Status** | PASS |

### TC-AUTH-02: Invalid Credentials Rejection
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AUTH-02 |
| **Module** | Authentication |
| **Priority** | Critical |
| **Preconditions** | Application running |
| **Test Steps** | 1. POST `/api/v1/auth/login` with wrong password |
| **Expected Result** | HTTP 401; `{"success": false, "error": "Invalid email or password"}` |
| **Actual Result** | ✅ HTTP 401 returned |
| **Status** | PASS |

### TC-AUTH-03: JWT Token Validation
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AUTH-03 |
| **Module** | Authentication |
| **Priority** | High |
| **Preconditions** | Valid JWT obtained from login |
| **Test Steps** | 1. GET `/api/v1/users/me` with `Authorization: Bearer <token>` |
| **Expected Result** | HTTP 200; returns user profile with correct role |
| **Actual Result** | ✅ HTTP 200 with user data |
| **Status** | PASS |

### TC-AUTH-04: Missing Token Rejection
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AUTH-04 |
| **Module** | Authentication |
| **Priority** | High |
| **Preconditions** | Application running |
| **Test Steps** | 1. GET `/api/v1/users/me` without Authorization header |
| **Expected Result** | HTTP 401 Unauthorized |
| **Actual Result** | ✅ HTTP 401 returned |
| **Status** | PASS |

### TC-AUTH-05: RBAC Role Enforcement (Admin-only route)
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AUTH-05 |
| **Module** | RBAC |
| **Priority** | Critical |
| **Preconditions** | Logged in as `citizen` role |
| **Test Steps** | 1. Login as citizen@ccgp.gov.in; 2. GET `/api/v1/tickets` with citizen JWT |
| **Expected Result** | HTTP 403 Forbidden |
| **Actual Result** | ✅ HTTP 403 returned |
| **Status** | PASS |

---

## Module 2: Complaint Intake (Public Portal)

### TC-COMP-01: Public Complaint Submission
| Field | Detail |
|---|---|
| **Test Case ID** | TC-COMP-01 |
| **Module** | Complaint Intake |
| **Priority** | Critical |
| **Preconditions** | Application running; no auth required |
| **Test Steps** | 1. POST `/api/v1/complaints` with title, description, reporter details |
| **Expected Result** | HTTP 200/201; complaint created, ticket_number starts with `CCGP-2026-` |
| **Actual Result** | ✅ Ticket created with proper numbering |
| **Status** | PASS |

### TC-COMP-02: Complaint with Metadata
| Field | Detail |
|---|---|
| **Test Case ID** | TC-COMP-02 |
| **Module** | Complaint Intake |
| **Priority** | High |
| **Preconditions** | Application running |
| **Test Steps** | 1. POST `/api/v1/complaints` with `metadata_json: {"category":"Cyber Financial Fraud","amount":150000}` |
| **Expected Result** | Ticket created; severity = "High" (>=100k financial fraud rule) |
| **Actual Result** | ✅ Severity auto-assigned as "High" |
| **Status** | PASS |

### TC-COMP-03: Email Intake Automation
| Field | Detail |
|---|---|
| **Test Case ID** | TC-COMP-03 |
| **Module** | Email Automation |
| **Priority** | High |
| **Preconditions** | Application running |
| **Test Steps** | 1. POST `/api/v1/email/receive-mock` with sender, subject, body |
| **Expected Result** | HTTP 200; ticket auto-created, category auto-classified, NotificationLog created |
| **Actual Result** | ✅ Ticket created from email; notification logged |
| **Status** | PASS |

### TC-COMP-04: Email Thread Reply Detection
| Field | Detail |
|---|---|
| **Test Case ID** | TC-COMP-04 |
| **Module** | Email Automation |
| **Priority** | Medium |
| **Preconditions** | Existing ticket with ticket_number |
| **Test Steps** | 1. Send reply with `Re: ... [CCGP-2026-XXXX]` in subject |
| **Expected Result** | Reply threaded to existing ticket; new Comment added; no new ticket created |
| **Actual Result** | ✅ is_new=False; Comment added to original ticket |
| **Status** | PASS |

---

## Module 3: Ticket Lifecycle Management

### TC-TICK-01: Create Ticket (Operator Role)
| Field | Detail |
|---|---|
| **Test Case ID** | TC-TICK-01 |
| **Module** | Ticket Management |
| **Priority** | Critical |
| **Preconditions** | Logged in as complaint_operator |
| **Test Steps** | 1. POST `/api/v1/tickets` with complaint payload |
| **Expected Result** | HTTP 200; ticket created with assigned_group = "Financial Fraud Unit" |
| **Actual Result** | ✅ Ticket created with correct auto-routing |
| **Status** | PASS |

### TC-TICK-02: Ticket Assignment (Supervisor Role)
| Field | Detail |
|---|---|
| **Test Case ID** | TC-TICK-02 |
| **Module** | Ticket Management |
| **Priority** | High |
| **Preconditions** | Existing ticket; logged in as supervisor |
| **Test Steps** | 1. PUT `/api/v1/tickets/{id}/assign` with `{"officer_id": "..."}` |
| **Expected Result** | HTTP 200; assigned_officer_id updated |
| **Actual Result** | ✅ Assignment successful |
| **Status** | PASS |

### TC-TICK-03: SLA Breach Detection & Auto-Escalation
| Field | Detail |
|---|---|
| **Test Case ID** | TC-TICK-03 |
| **Module** | SLA Monitoring |
| **Priority** | Critical |
| **Preconditions** | Ticket with sla_deadline in the past |
| **Test Steps** | 1. Call `sla_service.check_sla_breaches(db)` |
| **Expected Result** | Breach count = 1; ticket.is_escalated = True; ActivityTimeline "SLABreach" entry created |
| **Actual Result** | ✅ Escalation triggered; notification logged |
| **Status** | PASS |

### TC-TICK-04: L1 Approval Request Closure
| Field | Detail |
|---|---|
| **Test Case ID** | TC-TICK-04 |
| **Module** | Closure Approvals |
| **Priority** | High |
| **Preconditions** | Existing ticket; logged in as supervisor |
| **Test Steps** | 1. POST `/api/v1/approvals/{id}/request-closure`; 2. POST `/api/v1/approvals/{id}/l1-approve`; 3. POST `/api/v1/approvals/{id}/l2-approve` |
| **Expected Result** | Status progresses: "Closure Requested" → l1_approved → "Closed" |
| **Actual Result** | ✅ Full approval workflow completes; closure notification logged |
| **Status** | PASS |

### TC-TICK-05: L2 Approval Before L1 (Guard Validation)
| Field | Detail |
|---|---|
| **Test Case ID** | TC-TICK-05 |
| **Module** | Closure Approvals |
| **Priority** | High |
| **Preconditions** | Ticket in "Closure Requested" state, L1 not yet approved |
| **Test Steps** | 1. POST `/api/v1/approvals/{id}/l2-approve` |
| **Expected Result** | HTTP 422 — L1 must be approved before L2 |
| **Actual Result** | ✅ HTTP 422 ValidationError |
| **Status** | PASS |

---

## Module 4: Evidence Management

### TC-EVID-01: Evidence Upload Link Generation
| Field | Detail |
|---|---|
| **Test Case ID** | TC-EVID-01 |
| **Module** | Evidence |
| **Priority** | High |
| **Preconditions** | Existing ticket; logged in as investigator |
| **Test Steps** | 1. POST `/api/v1/evidence/{ticket_id}/upload-link` with `{"filename":"evidence.pdf"}` |
| **Expected Result** | HTTP 200; response contains `upload_url` and `file_path` |
| **Actual Result** | ✅ Presigned upload URL returned |
| **Status** | PASS |

### TC-EVID-02: Evidence Metadata Save & Versioning
| Field | Detail |
|---|---|
| **Test Case ID** | TC-EVID-02 |
| **Module** | Evidence |
| **Priority** | High |
| **Preconditions** | Upload link generated |
| **Test Steps** | 1. POST `/api/v1/evidence/{ticket_id}/save` twice with same filename |
| **Expected Result** | First save: version=1; second save: version=2 |
| **Actual Result** | ✅ Versioning increments correctly |
| **Status** | PASS |

### TC-EVID-03: Evidence Bulk ZIP Download
| Field | Detail |
|---|---|
| **Test Case ID** | TC-EVID-03 |
| **Module** | Evidence |
| **Priority** | Medium |
| **Preconditions** | Evidence records exist for ticket |
| **Test Steps** | 1. GET `/api/v1/evidence/{ticket_id}/zip` |
| **Expected Result** | HTTP 200; Content-Type = application/zip; non-empty body |
| **Actual Result** | ✅ ZIP archive returned |
| **Status** | PASS |

---

## Module 5: AI Pipeline & Intelligence

### TC-AI-01: Complaint Category Classification
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AI-01 |
| **Module** | AI Pipeline |
| **Priority** | Critical |
| **Preconditions** | Application running with trained classifier |
| **Test Steps** | 1. Submit complaint with UPI fraud description |
| **Expected Result** | `metadata_json.ai_category_prediction` = "Cyber Financial Fraud"; `ai_language` = "en" |
| **Actual Result** | ✅ Correct category predicted |
| **Status** | PASS |

### TC-AI-02: Low Confidence → Needs Review Flag
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AI-02 |
| **Module** | AI Pipeline |
| **Priority** | High |
| **Preconditions** | Application running |
| **Test Steps** | 1. Submit vague complaint with ambiguous text |
| **Expected Result** | `metadata_json.needs_ai_review` = true |
| **Actual Result** | ✅ Flag set correctly |
| **Status** | PASS |

### TC-AI-03: Similar Ticket Vector Search
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AI-03 |
| **Module** | Vector Search |
| **Priority** | High |
| **Preconditions** | Multiple similar tickets in Qdrant |
| **Test Steps** | 1. GET `/api/v1/tickets/{id}/similar?limit=20` |
| **Expected Result** | Returns list of similar tickets with similarity_score > 50.0 |
| **Actual Result** | ✅ Similar tickets returned with correct scores |
| **Status** | PASS |

### TC-AI-04: AI Explanation Card
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AI-04 |
| **Module** | AI Explainability |
| **Priority** | Medium |
| **Preconditions** | Ticket with AI classification |
| **Test Steps** | 1. GET `/api/v1/tickets/{id}/explain` |
| **Expected Result** | Returns `predicted_category`, `reasoning` mentioning SGDClassifier and extracted entities |
| **Actual Result** | ✅ Explanation card generated correctly |
| **Status** | PASS |

### TC-AI-05: Global Hybrid Search (SQL + Vector)
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AI-05 |
| **Module** | Search |
| **Priority** | High |
| **Preconditions** | Tickets exist with indexed vectors |
| **Test Steps** | 1. GET `/api/v1/tickets/global/search?q=phishing+scam+upi` |
| **Expected Result** | Returns results with `match_type` in [hybrid, semantic, keyword] and score > 20.0 |
| **Actual Result** | ✅ Hybrid search results returned |
| **Status** | PASS |

### TC-AI-06: Investigator AI Summary Card
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AI-06 |
| **Module** | AI Assistant |
| **Priority** | Medium |
| **Preconditions** | Ticket with AI classification and NER entities |
| **Test Steps** | 1. GET `/api/v1/tickets/{id}/ai-summary` |
| **Expected Result** | Returns `category`, `key_facts` (≥2 items), `suggested_next_steps` (≥2 items) |
| **Actual Result** | ✅ Summary card generated with correct content |
| **Status** | PASS |

### TC-AI-07: AI Inference Audit Log
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AI-07 |
| **Module** | AI Audit |
| **Priority** | Medium |
| **Preconditions** | AI inference run |
| **Test Steps** | 1. Read `backend/logs/ai_inference.log` |
| **Expected Result** | Log file exists with ≥3 entries; each entry has `ticket_id`, `predicted_category`, `inference_time_ms` |
| **Actual Result** | ✅ Inference log written correctly |
| **Status** | PASS |

---

## Module 6: Blockchain Audit Chain

### TC-AUDIT-01: Audit Log SHA-256 Hash Chaining
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AUDIT-01 |
| **Module** | Audit |
| **Priority** | Critical |
| **Preconditions** | Audit log entries exist |
| **Test Steps** | 1. GET `/api/v1/audit/logs?limit=10` with auditor token |
| **Expected Result** | HTTP 200; each entry has `current_hash` (SHA-256 hex), `previous_hash` chained correctly |
| **Actual Result** | ✅ Hash chain verified |
| **Status** | PASS |

### TC-AUDIT-02: Chain Integrity Verification
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AUDIT-02 |
| **Module** | Audit |
| **Priority** | Critical |
| **Preconditions** | Audit chain exists |
| **Test Steps** | 1. GET `/api/v1/audit/verify-chain` |
| **Expected Result** | `chain_valid: true`; `gaps: []`; `total_entries > 0` |
| **Actual Result** | ✅ Chain integrity confirmed |
| **Status** | PASS |

### TC-AUDIT-03: Merkle Tree Anchoring
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AUDIT-03 |
| **Module** | Blockchain |
| **Priority** | Medium |
| **Preconditions** | Unanchored audit batch exists |
| **Test Steps** | 1. POST `/api/v1/audit/anchor-batch` |
| **Expected Result** | HTTP 200; `merkle_root` (64-char hex); `anchored_count > 0` |
| **Actual Result** | ✅ Batch anchored with Merkle root |
| **Status** | PASS |

### TC-AUDIT-04: SIEM Event Emission
| Field | Detail |
|---|---|
| **Test Case ID** | TC-AUDIT-04 |
| **Module** | SIEM |
| **Priority** | Medium |
| **Preconditions** | Audit action performed |
| **Test Steps** | 1. Check `backend/logs/siem_events.log` after any audit action |
| **Expected Result** | Log contains JSON with `facility: CCGP-SOC`, `event_type`, `timestamp` |
| **Actual Result** | ✅ SIEM events logged for every audit write |
| **Status** | PASS |

---

## Module 7: Governance & Analytics

### TC-GOV-01: Executive KPI Dashboard
| Field | Detail |
|---|---|
| **Test Case ID** | TC-GOV-01 |
| **Module** | Governance |
| **Priority** | High |
| **Preconditions** | Tickets in database |
| **Test Steps** | 1. GET `/api/v1/governance/kpis` with officer+ token |
| **Expected Result** | Returns `total_tickets`, `solve_rate`, `sla_breach_rate`, `category_distribution`, `officer_workloads` |
| **Actual Result** | ✅ All KPI fields returned |
| **Status** | PASS |

### TC-GOV-02: BI JSON Export
| Field | Detail |
|---|---|
| **Test Case ID** | TC-GOV-02 |
| **Module** | BI Export |
| **Priority** | Medium |
| **Preconditions** | Tickets in database; logged in as security_auditor |
| **Test Steps** | 1. GET `/api/v1/governance/export/json` |
| **Expected Result** | HTTP 200; Content-Type = application/json; downloadable JSON array of ticket records |
| **Actual Result** | ✅ JSON export generated correctly |
| **Status** | PASS |

### TC-GOV-03: BI CSV Export
| Field | Detail |
|---|---|
| **Test Case ID** | TC-GOV-03 |
| **Module** | BI Export |
| **Priority** | Medium |
| **Preconditions** | Tickets in database; logged in as security_auditor |
| **Test Steps** | 1. GET `/api/v1/governance/export/csv` |
| **Expected Result** | HTTP 200; Content-Type = text/csv; CSV with header row and data rows |
| **Actual Result** | ✅ CSV export generated with correct columns |
| **Status** | PASS |

---

## Module 8: Observability & DevOps

### TC-OPS-01: Health Check Endpoint
| Field | Detail |
|---|---|
| **Test Case ID** | TC-OPS-01 |
| **Module** | Health |
| **Priority** | Critical |
| **Preconditions** | Application running with Postgres and Redis |
| **Test Steps** | 1. GET `/api/v1/health` |
| **Expected Result** | HTTP 200; `status: healthy`; `postgres: connected`; `redis: connected` |
| **Actual Result** | ✅ All services healthy |
| **Status** | PASS |

### TC-OPS-02: Prometheus Metrics Endpoint
| Field | Detail |
|---|---|
| **Test Case ID** | TC-OPS-02 |
| **Module** | Prometheus |
| **Priority** | High |
| **Preconditions** | Application running |
| **Test Steps** | 1. GET `/api/v1/metrics` |
| **Expected Result** | HTTP 200; Content-Type contains `text/plain`; contains `ccgp_uptime_seconds`, `ccgp_tickets_total` |
| **Actual Result** | ✅ Prometheus metrics in exposition format returned |
| **Status** | PASS |

### TC-OPS-03: Docker Compose All Services Start
| Field | Detail |
|---|---|
| **Test Case ID** | TC-OPS-03 |
| **Module** | Docker |
| **Priority** | Critical |
| **Preconditions** | Docker installed; docker-compose.yml present |
| **Test Steps** | 1. `docker compose up -d`; 2. `docker compose ps` |
| **Expected Result** | All 8 containers (db, redis, minio, qdrant, backend, frontend, prometheus, grafana) running |
| **Actual Result** | ✅ All containers start and remain healthy |
| **Status** | PASS |

### TC-OPS-04: Docker Compose Config Validation
| Field | Detail |
|---|---|
| **Test Case ID** | TC-OPS-04 |
| **Module** | Docker |
| **Priority** | High |
| **Preconditions** | docker-compose.yml present |
| **Test Steps** | 1. `docker compose config --quiet` |
| **Expected Result** | Exit code 0; no errors |
| **Actual Result** | ✅ Config validates cleanly |
| **Status** | PASS |

---

## Module 9: Frontend & User Experience

### TC-FE-01: Login Page Authentication
| Field | Detail |
|---|---|
| **Test Case ID** | TC-FE-01 |
| **Module** | Frontend - Auth |
| **Priority** | Critical |
| **Preconditions** | Backend running; frontend running on :3000 |
| **Test Steps** | 1. Open http://localhost:3000; 2. Enter officer@ccgp.gov.in / password123; 3. Click Login |
| **Expected Result** | Redirect to /dashboard; JWT stored in localStorage; nav shows username |
| **Actual Result** | ✅ Login succeeds; dashboard loads |
| **Status** | PASS |

### TC-FE-02: Dashboard Loads with KPIs
| Field | Detail |
|---|---|
| **Test Case ID** | TC-FE-02 |
| **Module** | Frontend - Dashboard |
| **Priority** | High |
| **Preconditions** | Logged in successfully |
| **Test Steps** | 1. Navigate to /dashboard |
| **Expected Result** | Ticket stats, charts, analytics visible; no console errors |
| **Actual Result** | ✅ Dashboard renders with all panels |
| **Status** | PASS |

### TC-FE-03: Logout Clears Session
| Field | Detail |
|---|---|
| **Test Case ID** | TC-FE-03 |
| **Module** | Frontend - Auth |
| **Priority** | High |
| **Preconditions** | Logged in |
| **Test Steps** | 1. Click Logout; 2. Navigate to /dashboard |
| **Expected Result** | Redirect to /login; localStorage cleared |
| **Actual Result** | ✅ Session cleared; redirected to login |
| **Status** | PASS |

### TC-FE-04: Invalid Login Rejection
| Field | Detail |
|---|---|
| **Test Case ID** | TC-FE-04 |
| **Module** | Frontend - Auth |
| **Priority** | High |
| **Preconditions** | Application running |
| **Test Steps** | 1. Enter wrong password; 2. Click Login |
| **Expected Result** | Error message displayed; no redirect |
| **Actual Result** | ✅ Error shown; stays on login page |
| **Status** | PASS |

### TC-FE-05: Next.js Production Build
| Field | Detail |
|---|---|
| **Test Case ID** | TC-FE-05 |
| **Module** | Frontend - Build |
| **Priority** | Critical |
| **Preconditions** | Node 20; npm ci completed |
| **Test Steps** | 1. `npm run build` in /frontend |
| **Expected Result** | Build succeeds; 6 static pages generated; no TypeScript errors |
| **Actual Result** | ✅ Build succeeds cleanly |
| **Status** | PASS |

---

## Module 10: CI/CD Pipeline

### TC-CI-01: Backend Tests Job (GitHub Actions)
| Field | Detail |
|---|---|
| **Test Case ID** | TC-CI-01 |
| **Module** | CI/CD |
| **Priority** | Critical |
| **Preconditions** | Code pushed to main/develop branch |
| **Test Steps** | 1. Push commit to main |
| **Expected Result** | Backend Tests & Linting job GREEN; 9/9 tests pass |
| **Actual Result** | ✅ Passes after Qdrant service added and env vars fixed |
| **Status** | PASS |

### TC-CI-02: Frontend Build Job (GitHub Actions)
| Field | Detail |
|---|---|
| **Test Case ID** | TC-CI-02 |
| **Module** | CI/CD |
| **Priority** | Critical |
| **Preconditions** | Code pushed; package-lock.json present |
| **Test Steps** | 1. Push commit to main |
| **Expected Result** | Frontend Build & Type Check job GREEN |
| **Actual Result** | ✅ Next.js build succeeds on CI |
| **Status** | PASS |

### TC-CI-03: Docker Compose Validation Job
| Field | Detail |
|---|---|
| **Test Case ID** | TC-CI-03 |
| **Module** | CI/CD |
| **Priority** | High |
| **Preconditions** | Code pushed; docker-compose.yml present |
| **Test Steps** | 1. Push commit to main |
| **Expected Result** | Docker Compose Config Validation job GREEN |
| **Actual Result** | ✅ docker compose config validates |
| **Status** | PASS |

---

## Module 11: Security

### TC-SEC-01: CORS Preflight (OPTIONS)
| Field | Detail |
|---|---|
| **Test Case ID** | TC-SEC-01 |
| **Module** | CORS |
| **Priority** | Critical |
| **Preconditions** | Backend running |
| **Test Steps** | 1. Send OPTIONS request to `/api/v1/auth/login` from localhost:3000 |
| **Expected Result** | HTTP 200; Access-Control-Allow-Origin includes localhost:3000 |
| **Actual Result** | ✅ CORS preflight returns 200 |
| **Status** | PASS |

### TC-SEC-02: SQL Injection Protection
| Field | Detail |
|---|---|
| **Test Case ID** | TC-SEC-02 |
| **Module** | Security |
| **Priority** | High |
| **Preconditions** | Application running |
| **Test Steps** | 1. POST `/api/v1/auth/login` with `{"email":"admin@ccgp.gov.in' OR '1'='1","password":"x"}` |
| **Expected Result** | HTTP 401 — injection not executed; ORM parameterised queries protect DB |
| **Actual Result** | ✅ HTTP 401 returned; SQLAlchemy ORM prevents injection |
| **Status** | PASS |

### TC-SEC-03: Expired/Tampered JWT Rejection
| Field | Detail |
|---|---|
| **Test Case ID** | TC-SEC-03 |
| **Module** | Security |
| **Priority** | High |
| **Preconditions** | Application running |
| **Test Steps** | 1. Send request with `Authorization: Bearer invalid.tampered.token` |
| **Expected Result** | HTTP 401 |
| **Actual Result** | ✅ HTTP 401 returned |
| **Status** | PASS |

---

## Test Summary

| Module | Total Tests | Passed | Failed | Pending |
|---|---|---|---|---|
| Authentication & Session | 5 | 5 | 0 | 0 |
| Complaint Intake | 4 | 4 | 0 | 0 |
| Ticket Lifecycle | 5 | 5 | 0 | 0 |
| Evidence Management | 3 | 3 | 0 | 0 |
| AI Pipeline | 7 | 7 | 0 | 0 |
| Blockchain Audit | 4 | 4 | 0 | 0 |
| Governance & Analytics | 3 | 3 | 0 | 0 |
| Observability & DevOps | 4 | 4 | 0 | 0 |
| Frontend & UX | 5 | 5 | 0 | 0 |
| CI/CD Pipeline | 3 | 3 | 0 | 0 |
| Security | 3 | 3 | 0 | 0 |
| **TOTAL** | **46** | **46** | **0** | **0** |

**Overall Status: ✅ ALL TESTS PASS**

---

## Seeded Test Credentials

| Role | Email | Password |
|---|---|---|
| System Administrator | admin@ccgp.gov.in | password123 |
| Complaint Operator | operator@ccgp.gov.in | password123 |
| Cyber Cell Officer | officer@ccgp.gov.in | password123 |
| Investigator | investigator@ccgp.gov.in | password123 |
| Supervisor | supervisor@ccgp.gov.in | password123 |
| Security Auditor | auditor@ccgp.gov.in | password123 |
| Citizen | citizen@ccgp.gov.in | password123 |

---

*Document Version: 1.0 | CCGP Enterprise Edition v1.0.0*
