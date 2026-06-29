# Security Policy

## Supported Versions

Only the active milestone development branches are supported for security updates:

| Version | Supported |
| --- | --- |
| 1.0.x-milestone1 | Yes ✅ |
| < 1.0.0 | No ❌ |

---

## 🔒 Security Baselines

The CCGP platform implements state-level cybersecurity specifications:
1. **Zero-Trust Access Control:** All private API routers require validation checks via auth middleware dependency filters.
2. **Cryptographic Storage:** User credentials are encrypted using `bcrypt`. Evidence documents stored in MinIO must be verified against database integrity hashes on retrieval.
3. **Data Protection:** Personal Identifiable Information (PII) must be filtered or encrypted in PostgreSQL tables when storing complainant records.
4. **Rate Limiting:** Protect endpoint vectors from brute force attacks using Redis-backed request limit pools.

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please email the security audit lead at `security@ccgp.gov.in` instead of opening a public issue. We aim to respond within 24 hours and patch issues within 5 business days.
