# Changelog

All notable changes to the Cyber Complaint Governance Platform (CCGP) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
