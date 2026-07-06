# CCGP Complete Functional Audit Report

This report presents a thorough audit of the Cyber Complaint Governance Platform (CCGP) Enterprise Edition. It details the implemented feature inventory, role permissions matrix, cryptographic security mechanisms, AI pipeline features, and service API endpoints.

---

## 1. Cybersecurity Features Inventory

The CCGP platform implements robust security safeguards across data persistence, session management, auditing, and threat analysis layers:

1.  **JWT Authentication Infrastructure:** Uses `HMAC-SHA256` signatures to sign and verify session tokens. Implements secure password verification using `bcrypt` salting and hashing (`app.core.security`).
2.  **Refresh Token Rotation & Session Invalidation:** Actively tracks refresh tokens and sessions in a dedicated relational database schema. Rotates refresh tokens on each update, and uses Redis to blacklist/deny access to logged-out tokens (`app.services.auth`).
3.  **Hierarchical Role-Based Access Control (RBAC):** Utilizes custom route dependencies (`RoleRequirement`) to enforce hierarchical access rights. Role levels are mapped numerically:
    *   `citizen` = 1
    *   `complaint_operator` = 2
    *   `cyber_cell_officer` = 3
    *   `investigator` = 4
    *   `senior_investigator` = 5
    *   `supervisor` = 6
    *   `security_auditor` = 6
    *   `state_administrator` = 7
    *   `system_administrator` = 8
4.  **Row-Level Cryptographic Audit Chaining:** Implements a tamper-evident audit logger. Each database action logs user metadata, and sequentially links rows by hashing the current row's content combined with the parent row's SHA-256 signature (`app.models.audit`, `app.services.audit`).
5.  **Chain Integrity Auditing Engine:** Provides an endpoint (`/api/v1/audit/verify`) that sequentially checks hash signatures and N-1 predecessors to detect deleted rows, gap insertions, or tampered columns.
6.  **Merkle Tree Anchoring:** Compiles batches of unanchored audit logs, recursively generates a single Merkle Root hash, and anchors it via transaction hash index to a mock Hyperledger node.
7.  **Syslog-Format SIEM Event Logging:** Emits structured JSON events flagged with `facility: CCGP-SOC` to syslog channels and persists logs under `backend/logs/siem_events.log`.
8.  **Threat Intelligence Indicators Registry:** Implements local caching of Indicators of Compromise (IoC) such as malicious IPs, domains, phishing email templates, UPI tags, and cryptocurrency wallets.
9.  **IoC Reputation Lookup:** Offlines mock lookups against OTX AlienVault and AbuseIPDB API endpoints using pattern matching algorithms (IP, UPI, Domain, PAN, Crypto wallet).
10. **Malware Hash Reputation Check:** Validates uploaded evidence file hashes against a simulated VirusTotal scanner, checking for dangerous extensions (e.g. `.exe`, `.bat`, `.vbs`, `.zip`) and malicious keywords.
11. **SQL Injection Prevention:** Implements parameterized queries natively via the SQLAlchemy ORM layer.

---

## 2. Artificial Intelligence Features Inventory

The CCGP platform incorporates an advanced AI triage, classification, and extraction pipeline:

1.  **Complaint Classification Model:** Implements an offline TF-IDF Vectorizer + SGDClassifier machine learning pipeline. The model trains automatically on server startup using an integrated seed corpus to predict complaint categories (`app.services.ai_pipeline`).
2.  **Named Entity Recognition (NER) Extractor:** Regex-based heuristic parser that isolates phone numbers, emails, UPI handles, bank accounts, PAN cards, IFSC codes, and crypto wallets from incident descriptions, indexing them as searchable indicators.
3.  **Severity & Risk Scorer:** Implements heuristic risk score calculations (0-100) combining ML category weights, financial loss thresholds (INR), and high-risk description keyword amplifiers. Automatically maps final scores to severity tiers:
    *   $\ge 75$: `Critical`
    *   $\ge 50$: `High`
    *   $\ge 25$: `Medium`
    *   $< 25$: `Low`
4.  **Vector Search Similarity (Qdrant):** Generates 200-dimensional TF-IDF embedding vectors and upserts them into a Qdrant collection on complaint submission. Enables high-speed semantic similarity matching for duplicate detection.
5.  **AI Prediction Explanation Card:** Explains categorization decisions to investigators, detailing prediction confidence, risk calculation details, and a breakdown of extracted indicators.
6.  **Investigator AI Summary Assistant Card:** Synthesizes case facts and suggests next-step tasks adapted to the ticket's category (e.g., advising freezing UPI transfers for financial fraud).
7.  **Unified Hybrid Search (SQL + Vector):** Combines SQL text pattern matching with Qdrant vector semantic similarity results to output a single, sorted relevance feed.
8.  **Language Detection:** Implements automatic ISO language code detection on intake descriptions using the `langdetect` package.

---

## 3. Comprehensive Feature Inventory Table

| Feature Name | Purpose | Implemented | Working | Roles | Backend Endpoint | Remarks |
|---|---|---|---|---|---|---|
| **User Registration** | Creates a new user profile with a hashed password. | Yes | Yes | Public | `POST /api/v1/users/register` | Stores pass in bcrypt. |
| **Authentication / Login** | Validates credentials and returns JWT keys. | Yes | Yes | Public | `POST /api/v1/auth/login` | Returns access and refresh keys. |
| **JWT Token Refresh** | Rotates refresh token and issues new access token. | Yes | Yes | Public | `POST /api/v1/auth/refresh` | Single-use rotation checks. |
| **Session Logout** | Revokes DB refresh token and blacklists access token in Redis. | Yes | Yes | Authenticated Users | `POST /api/v1/auth/logout` | Prevents token reuse. |
| **Get Current User** | Retrieves details of currently logged-in profile. | Yes | Yes | Authenticated Users | `GET /api/v1/users/me` | Fetches active session claims. |
| **List Users** | Lists registered system users. | Yes | Yes | Supervisor+ | `GET /api/v1/users/list` | Used for ticket assignment dropdowns. |
| **Complaint Intake (Public)** | Submits citizen complaint without login header. | Yes | Yes | Public (Citizen) | `POST /api/v1/complaints/submit` | Generates sequential ticket tag. |
| **Complaint Intake (Operator)** | Operator submits citizen complaints inside dashboard. | Yes | Yes | Operator | `POST /api/v1/tickets` | Gated to operator permissions. |
| **Incident Queue & Filter** | Lists system tickets applying filters (status, severity, search). | Yes | Yes | Officer+ | `GET /api/v1/tickets` | Gated strictly to level $\ge 3$. |
| **Incident Details** | Retrieves ticket, comments, timeline logs, and files. | Yes | Yes | Officer+ | `GET /api/v1/tickets/{id}` | Returns comprehensive metadata. |
| **SLA Monitoring Engine** | Scans open tickets, marks breaches, alerts supervisors. | Yes | Yes | Celery Worker (Task) | Runs automatically via Celery Beat | Triggered every minute. |
| **Ticket Assignment** | Routes ticket to specific investigator. | Yes | Yes | Supervisor | `PUT /api/v1/tickets/{id}/assign` | Tracks personnel workloads. |
| **Ticket Status Change** | Updates ticket states within lifecycle flow constraints. | Yes | Yes | Officer+ | `PUT /api/v1/tickets/{id}/status` | Enforces state machine guard validations. |
| **Case Closure Requests** | Investigator requests supervisor resolution approval. | Yes | Yes | Investigator | `POST /api/v1/approvals/{ticket_id}/request-closure` | Status changed to "Closure Requested". |
| **L1 Supervisor Clearance** | Register supervisor first-tier clearance signature. | Yes | Yes | Supervisor | `POST /api/v1/approvals/{ticket_id}/l1-approve` | Updates `l1_approved=True`. |
| **L2 Supervisor Final Close** | Senior supervisor closes case, resolving the incident. | Yes | Yes | Supervisor | `POST /api/v1/approvals/{ticket_id}/l2-approve` | Requires L1 check; updates status to "Closed". |
| **Duplicate Merging** | Merges duplicate ticket into primary, closing duplicate record. | Yes | Yes | Supervisor | `POST /api/v1/tickets/merge` | Links record in metadata JSON. |
| **Evidence Upload link** | Generates secure pre-signed MinIO upload URLs. | Yes | Yes | Investigator+ | `POST /api/v1/evidence/{ticket_id}/upload-link` | Direct client-to-storage upload. |
| **Evidence Save & Versioning** | Commits evidence file metadata, versioning identical filenames. | Yes | Yes | Authenticated Users | `POST /api/v1/evidence/{ticket_id}/save` | Tracks SHA-256 signatures. |
| **Evidence Retrieval** | Generates secure, short-lived pre-signed download URLs. | Yes | Yes | Investigator+ | `GET /api/v1/evidence/download/{evidence_id}` | Gated by investigator roles. |
| **Bulk Evidence Zip** | Packages all ticket evidence assets into a ZIP file. | Yes | Yes | Investigator+ | `GET /api/v1/evidence/{ticket_id}/zip` | Dynamic zip streaming buffer. |
| **AI Similar Ticket Search** | Matches similar incidents using Qdrant vector database. | Yes | Yes | Officer+ | `GET /api/v1/tickets/{id}/similar` | Uses cosine distance scoring. |
| **AI Explanation Card** | Returns explanation metrics and prediction text reasonings. | Yes | Yes | Officer+ | `GET /api/v1/tickets/{id}/explain` | Outlines TF-IDF + SGDClassifier outputs. |
| **Investigator AI Summary** | Synthesizes case facts and suggests next-step check actions. | Yes | Yes | Officer+ | `GET /api/v1/tickets/{id}/ai-summary` | Adapts steps to ticket category. |
| **Unified Search** | Hybrid keyword + vector semantic global search. | Yes | Yes | Officer+ | `GET /api/v1/tickets/global/search` | Combines SQL, index, and semantic matches. |
| **Email Intake Automation** | Mock parser and manual IMAP mailbox poll checks. | Yes | Yes | Celery Worker / Admin | `POST /api/v1/email/receive-mock` and `POST /api/v1/email/poll` | Matches Subject/References headers to threads. |
| **SMTP Notification Engine** | Sends HTML alert emails and records delivery logs. | Yes | Yes | Internal Service | Triggered on event changes | Relies on SMTP config values. |
| **Cryptographic Audit Logs** | Lists audit records linked to row-level signatures. | Yes | Yes | Security Auditor | `GET /api/v1/audit/logs` | Displays hash-chain values. |
| **Audit Chain Integrity** | Audits hash signature continuity, detecting row modifications. | Yes | Yes | Security Auditor | `GET /api/v1/audit/verify` | Identifies gaps or deleted log IDs. |
| **Merkle Tree Anchoring** | Recursively hashes audit logs to anchor to Hyperledger node. | Yes | Yes | Security Auditor | `POST /api/v1/audit/anchor` | Submits transactions to mock node. |
| **Audit PDF Exporter** | Generates ReportLab PDF document containing audit logs. | Yes | Yes | Security Auditor | `GET /api/v1/audit/export/pdf` | Incorporates verification hashes. |
| **Executive KPIs** | Aggregates solving rate, workloads, categories, regions. | Yes | Yes | Officer+ | `GET /api/v1/governance/kpis` | Feeds visual charting layouts. |
| **BI Data Ingestion Export** | JSON/CSV raw data extraction of incidents. | Yes | Yes | Security Auditor | `GET /api/v1/governance/export/json` and `GET /api/v1/governance/export/csv` | Custom content-disposition layouts. |
| **DevOps Backup Engine** | Gzip database backups and MinIO directory mirrors. | Yes | Yes | Celery Worker (Task) | Runs automatically via Celery Beat | Writes to `/backups` volumes. |
| **Diagnostics / Health** | Evaluates Postgres and Redis connection states. | Yes | Yes | Public | `GET /api/v1/health` | Active server pings. |
| **Prometheus Metrics exposition**| Exports counters and row gauges in text format. | Yes | Yes | Public | `GET /api/v1/metrics` | Integrated with prometheus monitoring. |
| **Threat IoC Blacklist** | Registers and lists Indicators of Compromise. | Yes | Yes | Officer+ | `POST /api/v1/threat-intel/indicators` and `GET /api/v1/threat-intel/indicators` | Local cache db. |
| **IoC Reputation Lookup** | Checks OTX & AbuseIPDB offline reputation scores. | Yes | Yes | Officer+ | `GET /api/v1/threat-intel/lookup` | Parses matching indicators patterns. |
| **VT Malware Hash Scan** | Verifies evidence SHA-256 hashes against VT indicators. | Yes | Yes | Officer+ | `GET /api/v1/threat-intel/scan-file/{evidence_id}` | Heuristics flags dangerous files. |
| **HTML Incident Exporter** | ReportLab PDF of citizen sheet and investigation case notes. | Yes | Yes | Officer+ | `GET /api/v1/tickets/{id}/report/complaint` and `GET /api/v1/tickets/{id}/report/case` | Multi-page report layout. |
| **Holographic UI / Dashboard**| Web dashboard, charts, queues, filters, and forms. | Yes | Yes | All Roles | Frontend View `/dashboard` | Rich CSS dark-theme layout. |
| **Planetary Orbital Canvas** | 3D WebGL Earth planet representation with audio sound loop. | Yes | Yes | Public | Frontend View `/` | Custom dynamic Three.js canvas. |

---

*Functional Audit Document Version: 1.0.0 | Cyber Complaint Governance Platform*
