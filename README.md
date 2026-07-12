# CCGP — Cyber Complaint Governance Platform

<div align="center">

**An Enterprise AI-Powered Cyber Complaint Management System**

Version 1.0 | Production-Oriented | Government-Grade Security

[![CI](https://github.com/ayushsingh257/Cyber-Complaint-Governance-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/ayushsingh257/Cyber-Complaint-Governance-Platform/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.13+](https://img.shields.io/badge/Python-3.13+-blue.svg)](https://python.org)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green.svg)](https://fastapi.tiangolo.com)

</div>

---

## Overview

CCGP is a production-oriented, AI-assisted cyber complaint governance platform designed for cyber crime departments and government organizations. It provides a complete complaint management lifecycle — from citizen submission through AI classification, officer investigation, evidence management, multi-tier approval, and final resolution.

> **Core Philosophy:** The engine is more important than the car's exterior. CCGP prioritizes backend correctness, data integrity, security, and auditability over visual effects.

### What CCGP Provides

| Role | Capability |
|---|---|
| **Citizen** | File cyber complaints, track status, communicate with officers, upload evidence, receive notifications |
| **Officer / Investigator** | AI-assisted investigation, evidence management, threat intelligence, internal collaboration, approval workflow |
| **Administrator** | User management, system health monitoring, audit logs, analytics, configuration |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│            PRESENTATION LAYER                │
│    Next.js 15 + React 19 + TypeScript        │
│  Citizen │ Officer │ Admin Portals           │
└──────────────────┬──────────────────────────┘
                   │ REST API (JWT)
┌──────────────────▼──────────────────────────┐
│              API LAYER                       │
│         FastAPI + Uvicorn                    │
│         /api/v1/ versioned endpoints         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           BUSINESS SERVICES                  │
│  Auth │ Tickets │ AI Pipeline │ Evidence     │
│  Notifications │ Approval │ Audit │ SLA      │
│  Threat Intel │ Search │ Reporting           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              DATA LAYER                      │
│  PostgreSQL │ Redis │ MinIO │ Qdrant         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         BACKGROUND PROCESSING                │
│         Celery (email, SLA, cleanup)         │
└─────────────────────────────────────────────┘
```

---

## Features

### Citizen Portal
- Professional complaint submission with full fraud details
- AI-powered ticket creation (classification, severity, duplicate detection)
- Real-time ticket tracking with visual timeline
- Evidence upload with SHA-256 integrity verification
- Conversation thread with investigating officer
- In-app notification center + email notifications
- Post-resolution feedback and rating system

### Officer Portal
- Investigation dashboard with KPI cards
- AI Assistant panel per ticket (summary, extracted entities, suggested steps)
- Threat Intelligence scanning (IPs, URLs, domains, file hashes)
- Private investigation notes (citizen-isolated)
- Public correspondence with citizens
- Evidence management (download, verify, upload)
- Validated status transition workflow
- Multi-tier closure approval (L1 + L2 supervisor)
- PDF investigation report generation

### Admin Portal
- Platform-wide analytics and governance KPIs
- User management (create, enable, disable, role assignment)
- System health monitoring (all 6 services)
- Cryptographic audit log viewer with hash chain integrity
- Assignment rules configuration
- Email directory management
- SLA configuration by severity

### AI Engine (7 Modules)
1. **Complaint Classification** — SGDClassifier predicts fraud category with confidence score
2. **Entity Extraction** — Regex extracts phones, emails, UPI IDs, bank accounts, URLs, IPs, wallets
3. **Severity Engine** — Risk scoring based on amount, keywords, indicators → Critical/High/Medium/Low
4. **Duplicate Detection** — Vector similarity search via Qdrant to detect related complaints
5. **Investigator Assistant** — Per-ticket AI summary, key facts, and investigation recommendations
6. **Language Detection** — Automatic language identification for future multilingual support
7. **Confidence Scoring** — Low-confidence predictions routed to human review queue

### Enterprise Modules
- **Evidence Management** — Presigned MinIO URLs, SHA-256 hashing, versioning, chain of custody
- **SLA Engine** — Deadline tracking by severity with automatic escalation
- **Notification Engine** — Email + in-app notifications for all major ticket events
- **Approval Workflow** — Two-tier supervisor approval for complaint closure
- **Audit Trail** — Cryptographic SHA-256 hash chain with tamper detection
- **Search Engine** — Hybrid keyword + semantic vector search across all tickets
- **Email Automation** — IMAP polling, email-to-ticket conversion, threading

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, Framer Motion (subtle transitions only) |
| Icons | Lucide Icons |
| Form Validation | React Hook Form + Zod |
| HTTP Client | Axios (centralized in `lib/api.ts`) |
| Backend Framework | FastAPI, Python 3.13+ |
| ORM | SQLAlchemy 2.0, Alembic |
| Data Validation | Pydantic v2 |
| ASGI Server | Uvicorn |
| Primary Database | PostgreSQL |
| Cache & Sessions | Redis |
| Object Storage | MinIO |
| Vector Database | Qdrant |
| Background Jobs | Celery |
| Authentication | JWT (access + refresh token) |
| Password Hashing | bcrypt |
| ML Classification | scikit-learn (SGDClassifier) |
| PDF Generation | reportlab |
| Containerization | Docker, Docker Compose |

---

## Folder Structure

```
CCGP/
  brain.md              ← Permanent project memory
  roadmap.md            ← Era/Phase/Task roadmap
  README.md             ← This file
  SECURITY.md           ← Enterprise security policy
  .env.example          ← Environment variables template
  docker-compose.yml    ← Full stack Docker configuration
  LICENSE

  backend/
    app/
      api/v1/endpoints/ ← All REST API endpoints
      core/             ← Config, database, security, logging
      models/           ← SQLAlchemy ORM models
      schemas/          ← Pydantic request/response schemas
      repositories/     ← Database query abstraction
      services/         ← Business logic layer
      tasks/            ← Celery async tasks
      utils/            ← Helpers, seed data
    alembic/            ← Database migrations
    tests/              ← Pytest test suite
    requirements.txt
    Dockerfile

  frontend/
    app/
      (public)/         ← Homepage, auth pages, static pages
      (citizen)/        ← Citizen portal (protected)
      (officer)/        ← Officer portal (protected)
      (admin)/          ← Admin portal (protected)
    components/
      ui/               ← Atomic reusable components
      layout/           ← Navigation, sidebars, layouts
      homepage/         ← Homepage sections
      citizen/          ← Citizen-specific components
      officer/          ← Officer-specific components
      admin/            ← Admin-specific components
    hooks/              ← Custom React hooks
    lib/                ← API client, auth, constants, utils
    types/              ← TypeScript type definitions
    services/           ← API service functions

  infra/
    grafana/            ← Grafana dashboards
    nginx/              ← Nginx configuration
    prometheus/         ← Prometheus configuration

  .github/workflows/    ← GitHub Actions CI/CD
```

---

## User Roles

| Role | Level | Access |
|---|---|---|
| `citizen` | 1 | Own tickets, complaints, notifications, profile |
| `complaint_operator` | 2 | Complaint intake, basic ticket management |
| `cyber_cell_officer` | 3 | All tickets, evidence, investigation tools |
| `investigator` | 4 | Full investigation, closure requests |
| `senior_investigator` | 5 | Senior investigation privileges |
| `supervisor` | 6 | Ticket assignment, L1/L2 approvals |
| `security_auditor` | 6 | Audit logs, compliance, export |
| `state_administrator` | 7 | State-level management |
| `system_administrator` | 8 | Full system access |

---

## Local Development Setup

### Prerequisites
- Python 3.13+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- MinIO (or Docker)
- Qdrant (or Docker)

### 1. Clone the Repository
```bash
git clone https://github.com/ayushsingh257/Cyber-Complaint-Governance-Platform.git
cd Cyber-Complaint-Governance-Platform
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example ../.env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Seed default user accounts
python -m app.utils.seed

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local

# Start development server
npm run dev
```

### 4. Access the Application
| URL | Service |
|---|---|
| `http://localhost:3000` | Frontend |
| `http://localhost:8001` | Backend API |
| `http://localhost:8001/docs` | Swagger UI |
| `http://localhost:8001/redoc` | ReDoc |

### Default Seeded Accounts
| Role | Email | Password |
|---|---|---|
| System Administrator | admin@ccgp.gov.in | (set at seed) |
| Supervisor | supervisor@ccgp.gov.in | (set at seed) |
| Cyber Officer | officer@ccgp.gov.in | (set at seed) |
| Investigator | investigator@ccgp.gov.in | (set at seed) |
| Security Auditor | auditor@ccgp.gov.in | (set at seed) |
| Citizen | citizen@ccgp.gov.in | (set at seed) |

---

## Docker Setup (Full Stack)

```bash
# Copy environment file
cp .env.example .env
# Edit .env with production credentials

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# Seed data
docker-compose exec backend python -m app.utils.seed
```

---

## API Overview

All APIs follow this response format:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

**Base URL:** `/api/v1/`

**Authentication:** `Authorization: Bearer <access_token>`

Key endpoint groups:
- `/auth/` — Login, register, logout, refresh, password reset
- `/users/` — Profile, notifications, stats
- `/tickets/` — Complete ticket lifecycle
- `/evidence/` — File management with integrity verification
- `/approvals/` — Multi-tier closure approval
- `/audit/` — Cryptographic audit logs
- `/governance/` — Analytics and reporting
- `/threat-intel/` — Threat intelligence scanning

Full API documentation available at `http://localhost:8001/docs`

---

## Security

See [SECURITY.md](SECURITY.md) for the complete enterprise security policy, including:
- Password policy requirements
- JWT session management
- Role-based access control matrix
- Evidence integrity verification
- Audit trail policy
- Vulnerability reporting process

---

## Roadmap Summary

| Era | Description | Status |
|---|---|---|
| Era 0 | Repository Reset & Master Documents | 🔄 In Progress |
| Era 1 | Foundation & Design System | ⏳ Pending |
| Era 2 | Authentication Flows | ⏳ Pending |
| Era 3 | Citizen Portal | ⏳ Pending |
| Era 4 | Officer Portal | ⏳ Pending |
| Era 5 | Admin Portal | ⏳ Pending |
| Era 6 | Backend Polish & AI Modules | ⏳ Pending |
| Era 7 | Testing, CI/CD & Final Documentation | ⏳ Pending |

See [roadmap.md](roadmap.md) for the complete phase-by-phase development plan.

---

## Screenshots

> 📸 Screenshots will be added as each Era is completed.

---

## Contributing

This project follows an Era-based development workflow. See [brain.md](brain.md) for architecture and development rules. Each contribution must:

1. Follow the project's coding standards
2. Include tests
3. Pass all CI checks
4. Update documentation where applicable

---

## License

[MIT License](LICENSE) — See LICENSE file for details.

---

<div align="center">
Built for enterprise use in cyber crime departments.
</div>
