# CCGP — Enterprise Security Policy

**Cyber Complaint Governance Platform | Version 1**

> This document defines the security architecture, policies, and standards for the CCGP platform. It must be reviewed and updated whenever security-relevant changes are made to the system.

---

## Supported Versions

| Version | Security Support |
|---|---|
| 1.x (current) | ✅ Actively supported |
| < 1.0 | ❌ Not supported |

---

## 1. Security Architecture Overview

CCGP implements a layered security model:

```
Internet
    ↓
[Nginx Reverse Proxy] — TLS termination, rate limiting
    ↓
[FastAPI Backend] — JWT auth, RBAC, input validation
    ↓
[Business Services] — Role enforcement, audit logging
    ↓
[Data Layer] — PostgreSQL (encrypted at rest), MinIO (hashed evidence), Redis (session denylist)
```

**Security Principles:**
- **Zero Trust** — Every API request is authenticated and authorized independently
- **Least Privilege** — Each role has only the permissions it absolutely requires
- **Defense in Depth** — Multiple security layers; compromise of one does not expose all
- **Audit Everything** — All significant actions create a tamper-evident audit record
- **Fail Secure** — On error, the system denies access rather than allowing it

---

## 2. Authentication & Session Policy

### JWT Token Architecture
| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| Access Token | 30 minutes | Client memory / secure storage | API authorization |
| Refresh Token | 7 days | PostgreSQL (hashed) | Access token rotation |

### Session Security
- Access tokens added to **Redis denylist** on logout — cannot be reused even if intercepted
- Refresh tokens stored in PostgreSQL with `is_revoked` flag
- **All refresh tokens invalidated** on password change
- Refresh token rotation on every use (old token revoked, new token issued)
- Token payloads contain: `sub` (user UUID), `role`, `type`, `exp`, `jti`

### Login Security
- Failed login attempts do not reveal whether email exists or password is wrong
- Rate limiting on login endpoint via Redis (configurable per environment)
- IP-based rate limiting on authentication endpoints

---

## 3. Password Policy

All passwords must meet the following requirements:

| Requirement | Value |
|---|---|
| Minimum length | 12 characters |
| Maximum length | 128 characters |
| Uppercase letter | At least one (A-Z) |
| Lowercase letter | At least one (a-z) |
| Digit | At least one (0-9) |
| Special character | At least one (!@#$%^&*...) |
| Common passwords | Rejected |
| Storage | bcrypt hash (rounds=12), never plaintext |
| Reset | Secure token (32 bytes, URL-safe, 1-hour expiry, one-time use) |
| On change | All existing sessions invalidated |

### Common Password Blacklist (Examples)
`password`, `password123`, `12345678`, `123456789`, `qwerty`, `qwerty123`, `admin`, `admin123`, `welcome`, `letmein`, `abc123`, `test123`, `changeme`, `iloveyou`, `sunshine`, `master`, `pass1234`, `ccgp123`, `cyber123`

Frontend displays a real-time password strength meter during registration and password change.

---

## 4. Role-Based Access Control (RBAC)

### Role Hierarchy

| Role | Level | Description |
|---|---|---|
| `citizen` | 1 | End users filing cyber complaints |
| `complaint_operator` | 2 | Complaint intake and basic management |
| `cyber_cell_officer` | 3 | Full investigation access |
| `investigator` | 4 | Investigation + closure requests |
| `senior_investigator` | 5 | Senior investigation privileges |
| `supervisor` | 6 | Assignment + L1/L2 approvals |
| `security_auditor` | 6 | Audit logs + compliance export |
| `state_administrator` | 7 | State-level management |
| `system_administrator` | 8 | Full system access |

### Permission Matrix

| Resource | Citizen | Officer | Investigator | Supervisor | SysAdmin |
|---|---|---|---|---|---|
| Own tickets | ✅ | — | — | — | ✅ |
| All tickets | ❌ | ✅ | ✅ | ✅ | ✅ |
| Private notes | ❌ | ✅ | ✅ | ✅ | ✅ |
| Assign tickets | ❌ | ❌ | ❌ | ✅ | ✅ |
| Request closure | ❌ | ❌ | ✅ | ✅ | ✅ |
| L1/L2 approval | ❌ | ❌ | ❌ | ✅ | ✅ |
| Audit logs | ❌ | ❌ | ❌ | ❌ | Auditor ✅ |
| User management | ❌ | ❌ | ❌ | ❌ | ✅ |
| System health | ❌ | ❌ | ❌ | ❌ | ✅ |

### RBAC Enforcement
- Every API endpoint declares its minimum required role via `Depends(RoleRequirement("role"))`
- Role levels are additive — a supervisor can do everything a citizen can
- Role checks are **server-side only** — frontend role checks are UI convenience, never security
- RBAC violations are logged in the audit trail

---

## 5. Data Protection & Privacy

### Personal Identifiable Information (PII)
- Citizen PII (name, email, phone) is stored in PostgreSQL
- PII is only accessible to the citizen who owns it and authorized officers
- Officers cannot access PII for tickets not assigned to them
- Admin role does not expose complaint content by default

### Data at Rest
- PostgreSQL database: OS-level encryption (AES-256 in production deployments)
- MinIO evidence storage: server-side encryption (SSE-S3)
- Redis: sensitive session data is short-lived (30 min TTL for access token denylist entries)

### Data in Transit
- All production traffic via TLS 1.2+ (Nginx termination)
- Internal service-to-service communication within Docker network
- No plaintext credentials in any log file

---

## 6. Evidence Integrity

Every piece of uploaded evidence undergoes:

1. **Upload** — File sent directly to MinIO via presigned URL
2. **Hashing** — SHA-256 computed on the client
3. **Storage** — Hash stored in PostgreSQL `evidence` table alongside metadata
4. **Verification** — On download, hash can be recomputed and compared to stored value
5. **Chain of Custody** — Every upload and download logged in `activity_timeline`
6. **Versioning** — Re-uploads increment version number; old versions soft-deleted not removed

**Tampering Detection:** If SHA-256 hash mismatch on download → evidence integrity alert raised.

---

## 7. Rate Limiting Policy

Redis-backed rate limiting applied to:

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 10 attempts / 15 minutes per IP |
| `POST /users/register` | 5 registrations / hour per IP |
| `POST /auth/forgot-password` | 3 requests / hour per email |
| `POST /auth/reset-password` | 5 attempts / hour per token |

Rate limits are configurable in application settings. Exceeding limits returns HTTP 429.

---

## 8. Audit Trail Policy

### What is Logged
Every significant system action creates an `AuditLog` record:

| Category | Events Logged |
|---|---|
| Authentication | Login, logout, failed login, password change, password reset |
| Tickets | Created, status changed, assigned, closed, reopened |
| Evidence | Uploaded, downloaded, hash verified |
| Approvals | Closure requested, L1 approved, L2 approved |
| Administration | User created, user disabled, role changed |
| Configuration | Assignment rules changed, SLA rules changed |
| Security | RBAC violation, token revoked, rate limit exceeded |

### Hash Chain Integrity
- Each audit log entry contains a SHA-256 hash of its content
- Hash is chained: each entry includes the hash of the previous entry
- `SecurityAuditChain` table stores current and previous hashes
- Integrity check API (`GET /audit/verify`) detects tampering or deleted records
- Batch anchoring to immutable store (`POST /audit/anchor`)

### Retention
- Audit logs are never deleted
- Evidence metadata is soft-deleted only
- Complaint data is retained indefinitely

---

## 9. Input Validation & Output Safety

- All API inputs validated by **Pydantic v2** schemas — schema violations return structured 422 errors
- SQL injection prevented by SQLAlchemy parameterized queries — raw SQL never used with user input
- File uploads validated: MIME type checked, size limited, path sanitized before MinIO storage
- API responses never include stack traces, internal paths, or raw exception messages
- Output sanitized — no SQL or system internals exposed in error responses

---

## 10. Secure Headers

In production (Nginx configuration):
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 11. Incident Response

### Severity Classification

| Severity | Definition | Response SLA |
|---|---|---|
| **Critical** | Authentication bypass, data breach, privilege escalation | 2 hours |
| **High** | Unauthorized data access, evidence tampering | 8 hours |
| **Medium** | Audit log anomaly, rate limit bypass | 24 hours |
| **Low** | Minor security misconfiguration, informational | 5 business days |

### Response Process
1. **Detection** — Audit logs, monitoring alerts, or external report
2. **Triage** — Classify severity, identify affected systems
3. **Containment** — Revoke tokens, disable accounts, block IPs as needed
4. **Investigation** — Use audit log hash chain to trace full impact
5. **Remediation** — Patch, deploy, verify
6. **Post-Mortem** — Document in security changelog

---

## 12. Compliance Alignment

- **IT Act 2000 (India)** — Section 43, 66, 66C, 66D compliance for cyber complaint handling
- **IT (Amendment) Act 2008** — Cyber crime reporting and investigation procedures
- **CERT-In Guidelines** — Incident reporting within 6 hours for critical events
- **Data Localisation** — All data stored within deployment jurisdiction by default
- **Audit Trail** — Meets evidentiary requirements for cyber crime investigations

---

## Reporting a Vulnerability

If you discover a security vulnerability in CCGP:

1. **Do NOT** open a public GitHub issue
2. Email: `security@ccgp.gov.in`
3. Include: description, reproduction steps, impact assessment, suggested fix
4. Response within **24 hours**
5. Patch target: **5 business days** for critical/high, **30 days** for medium/low

We follow responsible disclosure and will acknowledge your contribution.

---

*Last updated: Era 7 — Final Testing, CI/CD & Production Readiness*  
*Maintainer: CCGP Security Team*
