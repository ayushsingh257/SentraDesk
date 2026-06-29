# Changelog

All notable changes to the Cyber Complaint Governance Platform (CCGP) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0-milestone3_era7] - 2026-06-29

### Added
- **AI Intelligence Era (Phases 56-67):** Introduced core MLflow tracking local integration (backed by SQLite database), language detection offline service, offline text classification training pipeline (TF-IDF + SGDClassifier seed corpus), Named Entity Recognition (NER) regex-based extraction engine for technical indicators (phone, email, UPI, crypto wallets, bank accounts, PAN/IFSC), dynamic severity and risk scoring engine (0-100), Qdrant collection vector schema auto-initialization, cosine similarity duplicate check queries via HTTP search_points, similar complaints retrieval APIs, human-in-the-loop low-confidence review queue, explainability API endpoint tracing predictions, and Investigator AI Assistant summary card generation.
- **Inference Logs Auditing:** Structured SIEM-compatible file auditing (`logs/ai_inference.log`) recording latency statistics, model predictions, confidence levels, and risk metrics.
- **AI Integration Tests:** End-to-end integration tests validating classification, entity extraction, similarity matches, explainability, review queues, and inference logging.

## [1.1.0-milestone2] - 2026-06-29

### Added
- **Email Automation Era (Phases 33-41):** IMAP email polling integration, MIME parser with headers, body decoders and regex financial amount parser, email threading based on subject/references, auto ticket creation, SMTP notifications dispatcher, Jinja2 template folder rendering engine, and Celery reliability retry worker queues.
- **Workflow & SLA Era (Phases 42-49):** Dynamic SLA policies by severity, countdown timer engine, cron-based deadline breach detector, automatic priority escalations and supervisor email alerts, and two-layer supervisor approvals (L1/L2) state machine transitions.
- **Evidence & Storage Era (Phases 50-55):** MinIO object storage service, upload presigned PUT URLs, download presigned GET URLs, automatic uploaded file SHA-256 cryptographic hashes, evidence versioning history logs, and bulk downloads zipping module.
- **Tests & UI:** Integrated unit test suite covering full flows (email intake, threading, SLA breacher, L1/L2 approval transitions, evidence uploads versioning/zipping), dynamic React count-down timer, files upload-picker UI, and approvals panel.
- **Premium UI/UX Redesign:** Implemented cinematic and immersive SOC dashboard, terminal-style auth gateway, and landing page with custom 3D WebGL particle neural network (Three.js/R3F), Lenis smooth scrolling, GSAP startup boot sequence, cursor glow trails, HUD panels, and hover/micro-interaction designs. Fully sanitized of legacy branding.
- **Seeded Accounts Verification Script:** Added `backend/tests/verify_functional_e2e.py` to systematically test and confirm login, permissions, state machine, evidence, linking, and approvals across all 7 default user roles.

### Fixed
- **Next.js & React 19 Dependency Conflict:** Upgraded Next.js and `eslint-config-next` to `15.1.0` and aligned React/React-DOM to stable `19.0.0` to natively resolve the peer dependency constraints of `@react-three/fiber` and `@react-three/drei` without using `--legacy-peer-deps` or `--force`.
- **SQLAlchemy JSON Mutability (Merging Fix):** Resolved a bug in ticket merge logic where primary/duplicate references in `metadata_json` were not persisted to PostgreSQL due to SQLAlchemy dict-in-place change detection. Fixed by passing copies `dict(metadata_json)`.

## [1.0.0-milestone1] - 2026-06-29

### Added
- **Foundation Era (Phases 0-9):** Project structure, FastAPI backend config, Next.js frontend scaffolding, multi-container Docker Compose config (Postgres, Redis, MinIO, Qdrant), logging and unified exception handling middleware.
- **Security Foundation Era (Phases 10-19):** JWT token authentication, bcrypt password hashing, active refresh sessions database tracker, Redis-backed token denylists, granular Role-Based Access Control (RBAC) with 8 system roles, and request-wide audit logging.
- **Intake & Ticket Management Era (Phases 20-32):** Schema models supporting multiple intake channels, state-machine ticket logic, ticket history log, rule-based automatic assignment filters, teams and distribution groups, comments, internal private notes, activity history feed generator, advanced filtering search, and dashboard views.

### Fixed
- Fixed backend local test runner package imports by creating `pytest.ini` with `pythonpath = .`.
- Fixed frontend dependency resolution failure by pinning React and React DOM to Next.js 15.0.3 compatible release `19.0.0-rc-66855b96-20241106`.
- Upgraded `lucide-react` dependency to support React 19 peer dependencies.
- Fixed Docker Compose Qdrant health check loop failure by removing `curl` requirement and routing via `service_started` state.
- Fixed Docker Compose frontend image generation copy error by adding placeholder `frontend/public/.gitkeep` template.
- Fixed Alembic execution failures inside Docker by resolving `loggers` import syntax typo and plural logger config section key errors in `alembic.ini`.
