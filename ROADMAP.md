# CCGP V1 — Project Roadmap

> **Single source of truth for all development phases.**
> Updated automatically at the end of every Era.
> ✅ Completed | ⏳ Pending | 🔄 In Progress

---

## ERA 0 — Repository Reset & Master Documents
🔄 **In Progress**

### Phase 0.1 — Repository Cleanup
- ✅ Delete obsolete root-level markdown files (CHANGELOG, CONTRIBUTING, FUNCTIONAL_AUDIT_REPORT, RELEASE_NOTES, ROADMAP, SOFTWARE_TEST_CASES)
- ✅ Delete obsolete frontend source (galaxy homepage, all old components, old pages)
- ✅ Delete backend artifact files (.db files, scratch)
- ✅ Update .gitignore (prevent re-committing artifacts)

### Phase 0.2 — Master Documents
- ✅ Create `brain.md` — permanent project memory
- ⏳ Create `roadmap.md` — this document
- ⏳ Rewrite `README.md` — enterprise-grade
- ⏳ Rewrite `SECURITY.md` — enterprise security policy
- ⏳ Update `.env.example`
- ⏳ Update `docker-compose.yml`

### Phase 0.3 — Era 0 Verification
- ⏳ Backend tests pass
- ⏳ TypeScript check passes
- ⏳ Commit: `chore: Era 0 - complete repository reset and master documents`
- ⏳ Push to GitHub
- ⏳ GitHub Actions green checkmark

---

## ERA 1 — Foundation & Design System
✅ **Completed**

### Phase 1.1 — Design System
- ✅ `tailwind.config.js` with design tokens
- ✅ `globals.css` — complete design system (colors, typography, spacing, components)
- ✅ Root `layout.tsx` with ThemeProvider and AuthProvider

### Phase 1.2 — Reusable UI Components
- ✅ Button, Card, Badge, Input, Select, Textarea
- ✅ Modal, Alert, Avatar, Spinner
- ✅ Pagination, StatusBadge, ThemeToggle, Tooltip

### Phase 1.3 — Public Layout
- ✅ PublicNavbar (CCGP logo, About, Contact, Disclosure, Theme Toggle, Sign In)
- ✅ PublicFooter (links to all footer pages)

### Phase 1.4 — Homepage
- ✅ Hero section (CCGP name, version, tagline)
- ✅ What is CCGP? section
- ✅ How CCGP Works section (complete lifecycle diagram/steps)
- ✅ Enterprise Features section (AI, Threat Intel, Duplicate Detection, Evidence, RBAC, Audit, Security)
- ✅ Why Choose CCGP section
- ✅ Track Your Ticket CTA (links to login)
- ✅ Footer

### Phase 1.5 — Static Pages
- ✅ About page
- ✅ Contact page
- ✅ Disclosure page
- ✅ Privacy Policy page
- ✅ Terms of Service page
- ✅ Cookie Policy page
- ✅ 404 not-found page

### Phase 1.6 — Core Libraries
- ✅ `lib/api.ts` — centralized axios instance with JWT injection
- ✅ `lib/constants.ts` — roles, statuses, categories
- ✅ `lib/utils.ts` — date formatting, ticket number helpers
- ✅ `types/index.ts` — all TypeScript interfaces

### Phase 1.7 — Era 1 Verification
- ✅ `npx tsc --noEmit` — zero errors
- ✅ `npm run build` — compiles without errors
- ✅ All 6 homepage sections visible
- ✅ All footer links navigate correctly
- ✅ Theme toggle works (light ↔ dark)
- ✅ All static pages load
- ✅ Responsive on mobile viewport
- ✅ Update brain.md, roadmap.md, README.md
- ✅ Commit: `feat: Era 1 - Foundation and design system`
- ✅ Push, GitHub Actions green


---

## ERA 2 — Authentication Flows
✅ **Completed**

### Phase 2.1 — Auth Pages
- ✅ Login page (email + password, JWT, role-based redirect)
- ✅ Register page (password strength meter, Zod validation, common password rejection)
- ✅ Email verification page
- ✅ Forgot password page
- ✅ Reset password page

### Phase 2.2 — Auth Infrastructure
- ✅ `useAuth.ts` hook
- ✅ `AuthProvider` context (JWT storage, refresh logic)
- ✅ Route guards at layout level for citizen, officer, admin
- ✅ `lib/auth.ts` — token decode, role check, logout

### Phase 2.3 — Backend Refactors
- ✅ `POST /complaints/submit` — add system_administrator guard
- ✅ `GET /users/list` — raise minimum role to system_administrator
- ✅ `POST /email/receive-mock` — add system_administrator guard
- ✅ `GET /metrics` — add system_administrator guard

### Phase 2.4 — Era 2 Verification
- ✅ Backend tests pass
- ✅ `npx tsc --noEmit` — zero errors
- ✅ Citizen registers → email verification → login → citizen dashboard
- ✅ Invalid password rejected (strength, common passwords)
- ✅ Login redirects by role (citizen/officer/admin)
- ✅ Unauthenticated access redirects to login
- ✅ Citizen cannot access officer/admin routes
- ✅ Forgot/reset password flow complete
- ✅ Update brain.md, roadmap.md, README.md
- ✅ Commit: `feat: Era 2 - Authentication flows`
- ✅ Push, GitHub Actions green

---

## ERA 3 — Citizen Portal
⏳ **Pending**

### Phase 3.1 — Citizen Dashboard
- ⏳ KPI cards (Open, Closed, Under Investigation, Pending Response)
- ⏳ Recent notifications panel
- ⏳ Recent ticket activity
- ⏳ Citizen sidebar navigation

### Phase 3.2 — Raise Complaint
- ⏳ Full complaint form (all fields)
- ⏳ Multi-file upload (images, PDF, docs)
- ⏳ Form validation with Zod
- ⏳ Success screen with ticket number
- ⏳ Acknowledgement email + in-app notification

### Phase 3.3 — Ticket Management
- ⏳ My Tickets list (status filter, search, sort)
- ⏳ Ticket card component
- ⏳ Ticket Detail page
- ⏳ Visual timeline component
- ⏳ Evidence panel (list + upload)
- ⏳ Conversation thread (public messages)
- ⏳ Follow-up message submission
- ⏳ Additional evidence upload

### Phase 3.4 — Notifications & Profile
- ⏳ Notification Center page
- ⏳ Mark as read / mark all read
- ⏳ Notification bell badge (unread count)
- ⏳ Profile page
- ⏳ Settings page (password change, preferences)

### Phase 3.5 — Post-Closure
- ⏳ Feedback modal (rating + comments)
- ⏳ Ticket reopen flow

### Phase 3.6 — New Backend APIs
- ⏳ `GET /api/v1/users/me/stats`
- ⏳ `PUT /api/v1/users/me`
- ⏳ `PUT /api/v1/users/me/password`
- ⏳ `GET /api/v1/users/notifications/unread-count`
- ⏳ `PUT /api/v1/users/notifications/{id}/read`
- ⏳ `PUT /api/v1/users/notifications/read-all`

### Phase 3.7 — Era 3 Verification
- ⏳ Backend tests pass
- ⏳ `npx tsc --noEmit` — zero errors
- ⏳ Complete citizen journey: register → login → complaint → ticket → track → follow-up → notification
- ⏳ Ticket number format correct (CCGP-YYYY-NNNNNN)
- ⏳ Profile, settings, password change all work
- ⏳ No data loss after logout + re-login
- ⏳ Update brain.md, roadmap.md, README.md
- ⏳ Commit: `feat: Era 3 - Citizen portal`
- ⏳ Push, GitHub Actions green

---

## ERA 4 — Officer Portal
⏳ **Pending**

### Phase 4.1 — Officer Dashboard
- ⏳ KPI cards (Assigned, Open, Under Investigation, Pending, Closed, Avg Resolution, SLA)
- ⏳ High priority queue
- ⏳ Officer sidebar navigation

### Phase 4.2 — Ticket Investigation
- ⏳ Assigned Tickets list (role-filtered)
- ⏳ Officer Ticket Detail page
- ⏳ AI Assistant panel
- ⏳ Threat Intelligence panel
- ⏳ Private Notes (officer-only)
- ⏳ Public Conversation thread
- ⏳ Evidence Manager (download, verify, upload)
- ⏳ Status workflow (validated transitions)

### Phase 4.3 — Closure & Approvals
- ⏳ Closure request workflow
- ⏳ Confirmation popup
- ⏳ L1/L2 Approval UI (supervisor view)
- ⏳ PDF report download

### Phase 4.4 — Backend Refactors
- ⏳ `PUT /tickets/{id}/status` — add transition validation matrix
- ⏳ Remove duplicate approval route from tickets.py
- ⏳ `GET /api/v1/officer/dashboard` — new endpoint
- ⏳ `GET /api/v1/tickets/{id}/notes` — implement fetch endpoint

### Phase 4.5 — Era 4 Verification
- ⏳ Backend tests pass
- ⏳ Officer KPI cards load with real data
- ⏳ Officer sees only assigned tickets
- ⏳ AI Assistant, Threat Intel panels work
- ⏳ Private note NOT visible to citizen
- ⏳ Public reply visible to citizen + notification triggered
- ⏳ Closure → L1 approval → L2 approval → closed (full flow)
- ⏳ Citizen receives closure notification
- ⏳ Update brain.md, roadmap.md, README.md, SECURITY.md
- ⏳ Commit: `feat: Era 4 - Officer portal`
- ⏳ Push, GitHub Actions green

---

## ERA 5 — Admin Portal
⏳ **Pending**

### Phase 5.1 — Admin Dashboard & Navigation
- ⏳ Admin KPI cards (platform-wide stats)
- ⏳ Admin sidebar navigation

### Phase 5.2 — User & Officer Management
- ⏳ User Management page (CRUD, role assignment)
- ⏳ Officer Management page (performance, assignments)

### Phase 5.3 — Configuration
- ⏳ Assignment Rules configuration
- ⏳ Email Directory management
- ⏳ Notification Templates management
- ⏳ System Configuration (SLA rules, categories)

### Phase 5.4 — Monitoring & Compliance
- ⏳ System Health page (all 6 services)
- ⏳ Audit Log viewer (hash chain, integrity check)
- ⏳ Analytics page (trends, performance, satisfaction)

### Phase 5.5 — New Backend APIs
- ⏳ `GET /api/v1/admin/dashboard`
- ⏳ `GET /api/v1/admin/users`
- ⏳ `PUT /api/v1/admin/users/{id}`
- ⏳ `GET /api/v1/admin/system-health` (extended)
- ⏳ Fix `GET /governance/kpis` hardcoded mock data

### Phase 5.6 — Era 5 Verification
- ⏳ Backend tests pass
- ⏳ Admin platform stats show real data
- ⏳ User management CRUD works
- ⏳ System health shows correct status for all services
- ⏳ Audit logs display with hash chain
- ⏳ Generate System Architecture Document (SAD) in docs/system_architecture_document.md
- ⏳ Update brain.md, roadmap.md, README.md, SECURITY.md
- ⏳ Commit: `feat: Era 5 - Admin portal`
- ⏳ Push, GitHub Actions green

---

## ERA 6 — Backend Polish & AI Modules
⏳ **Pending**

### Phase 6.1 — AI Module Verification
- ⏳ Classification module verified
- ⏳ Entity extraction verified
- ⏳ Severity engine verified
- ⏳ Duplicate detection verified
- ⏳ Investigator assistant verified
- ⏳ Language detection verified
- ⏳ Confidence scoring verified

### Phase 6.2 — Enterprise Modules
- ⏳ Threat Intelligence integrations verified
- ⏳ Email automation engine verified
- ⏳ SLA engine verified
- ⏳ Notification engine verified
- ⏳ Evidence integrity (hash, versioning) verified
- ⏳ Search engine verified
- ⏳ PDF reporting verified

### Phase 6.3 — Admin API Module
- ⏳ `backend/app/api/v1/endpoints/admin.py` complete
- ⏳ Governance KPI endpoint fixed (no mock data)

### Phase 6.4 — Era 6 Verification
- ⏳ All backend tests pass (100%)
- ⏳ E2E functional test suite passes
- ⏳ AI pipeline processes test complaint correctly
- ⏳ Evidence upload → hash → download → verified
- ⏳ Celery offline — application still functions
- ⏳ Generate API Documentation document in docs/api_documentation.md
- ⏳ Update brain.md, roadmap.md, README.md
- ⏳ Commit: `feat: Era 6 - Backend polish and AI modules`
- ⏳ Push, GitHub Actions green

---

## ERA 7 — Testing, CI/CD & Final Documentation
⏳ **Pending**

### Phase 7.1 — Test Suite
- ⏳ Review all existing tests for gaps
- ⏳ Add missing unit tests
- ⏳ Add missing integration tests
- ⏳ All tests pass with no warnings

### Phase 7.2 — CI/CD
- ⏳ Update `.github/workflows/ci.yml` for new structure
- ⏳ Frontend build check in CI
- ⏳ Backend tests in CI

### Phase 7.3 — Final Documentation
- ⏳ `README.md` final pass (screenshots, full API docs)
- ⏳ `brain.md` all sections current
- ⏳ `roadmap.md` all eras marked complete
- ⏳ `SECURITY.md` final review

### Phase 7.4 — Final Verification
- ⏳ Complete localhost walkthrough: citizen → officer → admin full journey
- ⏳ No TypeScript errors
- ⏳ No ESLint errors
- ⏳ All links work
- ⏳ All forms validate correctly
- ⏳ No hardcoded URLs anywhere
- ⏳ Commit: `feat: Era 7 - Complete testing and documentation`
- ⏳ Push, GitHub Actions green

---

## Future Expansion (Post V1)

- LLM integration for deeper complaint analysis
- OCR for evidence document extraction
- Voice complaint intake (speech-to-text)
- Mobile application (React Native)
- SMS and WhatsApp notification channels
- Predictive analytics and fraud pattern detection
- Network graph analysis (relationship mapping between complainants/suspects)
- Multi-language complaint support
- Blockchain anchoring for audit logs
- Multi-tenancy (multiple cyber departments)
- API gateway for external integrations

---

*Last updated: Era 2 — Authentication Flows*
