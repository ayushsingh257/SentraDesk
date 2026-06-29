# 🚀 Cyber Complaint Governance Platform (CCGP)

[![CI Build Status](https://github.com/ayushsingh257/Cyber-Complaint-Governance-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/ayushsingh257/Cyber-Complaint-Governance-Platform/actions)
[![Security Policy](https://img.shields.io/badge/Security-ASVS%20v4-blue)](/SECURITY.md)
[![License](https://img.shields.io/badge/License-MIT-green)](/LICENSE)

An enterprise-grade, AI-powered **Ticket Management & Cyber Complaint Governance Platform** designed for state-level cyber cells. CCGP automates the intake, triage, classification, routing, and lifecycle supervision of cybercrime complaints while securing critical personal data under strict zero-trust standards.

---

## 🏛️ System Architecture

CCGP adopts a **Clean Architecture** design separating routing layers, business services, repository models, and data adapters.

```
                          ┌──────────────────────┐
                          │   Next.js Frontend   │
                          └──────────┬───────────┘
                                     │ (REST API)
                                     ▼
                          ┌──────────────────────┐
                          │   FastAPI Gateway    │
                          └──────────┬───────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Business Logic   │       │    AI Engine     │       │   Email Engine   │
│  (SQLAlchemy)    │       │     (Qdrant)     │       │    (Celery)      │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                           │                           │
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ PostgreSQL DB    │       │ Qdrant Vector DB │       │ Redis Cache & Q  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| --- | --- | --- |
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS | High-performance, modern user interface. |
| **Backend** | FastAPI, Python 3.13 | High-throughput, async REST API server. |
| **Database** | PostgreSQL 16, SQLAlchemy 2.0 ORM | Relational database with Alembic migration manager. |
| **Caching/Queue**| Redis, Celery | Session token management and background task queues. |
| **Object Store** | MinIO | Secure evidence document and PDF reports repository. |
| **Vector DB** | Qdrant | Fast vector search for duplicate complaint detection. |
| **Security** | JWT, bcrypt, RBAC | State-level authorization with 8 granular roles. |
| **DevOps** | Docker, Compose, GitHub Actions | Isolated local stack and automated CI workflows. |

---

## 📂 Repository Directory Layout

```
CCGP/
├── .github/workflows/      # CI/CD action pipelines
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Versioned routes & endpoints
│   │   ├── core/           # Configuration, security, exceptions handlers
│   │   ├── models/         # SQLAlchemy schemas
│   │   ├── repositories/   # Data-layer queries
│   │   ├── services/       # Core business logic handlers
│   │   └── main.py         # App entrypoint
│   ├── alembic/            # Database migrations folder
│   ├── requirements.txt    # Python packages list
│   └── Dockerfile          # Multi-stage Python build
├── frontend/
│   ├── app/                # Next.js pages router & components
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Frontend container definition
├── docker-compose.yml      # Local stack orchestration configuration
├── README.md               # Overview documentation
└── ROADMAP.md              # 100-phase roadmap
```

---

## ⚡ Core Enterprise Features

1. **Multi-Channel Intake:** Native API support for Portal, Email, Mobile, Helpline, and Police Station entries.
2. **State-Machine Ticketing:** Strict state transitions preventing incorrect flow progressions.
3. **Role-Based Guards (RBAC):** Strict security checks for Citizen, Operator, Officer, Investigator, Senior Investigator, Supervisor, Admin, and Auditor.
4. **SLA Management:** Automated timers based on ticket severity, with active escalations.
5. **AI Duplicates Spotting:** Qdrant-backed similarity scoring matching newly submitted claims to existing files.
6. **Immutable Audit Ledger:** Hash-chain linkages of action tables anchored cryptographically.

---

## 🚀 Local Quickstart Guide

### Prerequisites
* Docker Desktop & Compose
* Git

### 1. Clone & Set Configuration Env
Clone the repository and copy the environment template:
```bash
cp .env.example .env
```

### 2. Launch Local Environment
Fire up all containers (FastAPI backend, Next.js frontend, PostgreSQL, Redis, MinIO, and Qdrant) in detached mode:
```bash
docker compose up -d --build
```

### 3. Apply Database Migrations
Initialize the tables structure in PostgreSQL:
```bash
docker compose exec backend alembic upgrade head
```

### 4. Seed Seed Data
Populate default roles and administrative users:
```bash
docker compose exec backend python -m app.utils.seed
```

Services are now available at:
* **Frontend Portal:** [http://localhost:3000](http://localhost:3000)
* **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Qdrant Dashboard:** [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

---

## 🛡️ Development & Guidelines

* **Coding Standards:** Python code is checked using `ruff` and formatted via `black`. Frontend files are strictly typed and audited through `eslint`.
* **Branch Strategy:** We follow standard Git branch flows: `main` (production), `develop` (staging), and `feature/*` (development).
* **Commit Conventions:** Form messages as `feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`, `security: ...`.

---

## 📈 Milestone Progress Track

Check the current milestone development progress inside [ROADMAP.md](/ROADMAP.md).
Current Status: **Milestone 1 Completed** (Phases 0 - 32)
