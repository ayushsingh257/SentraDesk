# Contributing to CCGP

Thank you for contributing to the Cyber Complaint Governance Platform (CCGP)! To maintain enterprise code standards, please follow the guidelines below.

## 🌿 Git Branching Strategy

We follow a structured branching system:
* `main`: Represents production-ready code. Commits are pushed here only at milestone signoffs.
* `develop`: Integration branch for active developer features.
* `feature/*`: Work-in-progress branches for specific roadmap phases (e.g. `feature/phase-10-auth`).

---

## 📝 Commit Conventions

We enforce standard semantic commit message headers:
* `feat:` — Introducing a new feature or phase logic.
* `fix:` — Correcting a code bug or logical issue.
* `refactor:` — Modifying code without changing outputs or adding features.
* `docs:` — Writing README, diagrams, code comments, or inline documentations.
* `style:` — Layout edits, formatting (Black/Prettier), and cleanup of unused variables.
* `security:` — Implementing security patches, headers, or RBAC controls.

Format:
```bash
feat(auth): implement refresh token rotation and rotation tests
```

---

## 🛡️ Coding Standards & Tooling

### Python (Backend)
* **Formatting:** Use `black` to format Python files.
* **Linting:** Use `ruff` to audit imports sorting and clean syntax.
* **Type Hints:** Strict typing constraints are required for all function arguments and outputs.

### TypeScript (Frontend)
* **Strict Mode:** TypeScript `strict` must be enabled.
* **Linting:** Code must pass local `eslint` checks before pull request submissions.
* **CSS:** Tailwind CSS classes only; avoid ad-hoc style attributes in component models.
