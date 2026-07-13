"""
CCGP Era 6 — Performance Metrics Analysis Script
=================================================
Benchmarks the five newly implemented Era 6 features:
  1. Threat Intelligence Service (IP, domain, file-hash lookups)
  2. Email Attachment Parser & Evidence Registration
  3. Least-Workload Investigator Auto-Assignment
  4. Hybrid Search Engine (UUID, name, email queries)
  5. Supervisor Rejection Workflow & Notification Dispatch

Outputs:
  - ASCII results table in stdout
  - JSON report to backend/logs/perf_metrics.json

Usage (from backend/ directory):
  .\\venv\\Scripts\\python app\\scripts\\analyze_performance.py
"""

import os, sys, time, json, statistics, uuid

# ── Bootstrap: force testing environment before any app imports ──────────────
os.environ["ENVIRONMENT"] = "testing"
os.environ.setdefault("MLFLOW_TRACKING_URI", "sqlite:///mlflow_test.db")
os.environ.setdefault("QDRANT_HOST", "localhost")
os.environ.setdefault("QDRANT_PORT", "6333")
os.environ.setdefault("QDRANT_URL", "http://localhost:6333")
os.environ.setdefault("MINIO_ENDPOINT", "localhost:9000")
os.environ.setdefault("MINIO_ACCESS_KEY", "minioadmin")
os.environ.setdefault("MINIO_SECRET_KEY", "minioadmin")
os.environ.setdefault("MINIO_BUCKET_NAME", "ccgp-evidence")
os.environ.setdefault("JWT_SECRET", "perf_test_secret_key")

# ── SQLAlchemy in-memory SQLite test DB ──────────────────────────────────────
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.ticket import Complaint, Ticket, Comment, ActivityTimeline  # noqa
from app.models.user import User, EmailVerificationToken  # noqa
from app.models.evidence import Evidence  # noqa
from app.models.notification import InAppNotification, NotificationLog  # noqa
from app.models.threat_intel import ExtractedEntityIndex  # noqa
from app.models.audit import AuditLog  # noqa
from app.models.config import SystemConfig  # noqa

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

# ── Service imports ───────────────────────────────────────────────────────────
from app.services.threat_intel import threat_intel_service
from app.services.ticket import ticket_service
from app.services.search import unified_search_service
from app.services.approval import approval_service
from app.services.email_listener import email_listener_service
from app.core.security import hash_password


# ═════════════════════════════════════════════════════════════════════════════
# Helpers
# ═════════════════════════════════════════════════════════════════════════════

ITERATIONS = 30  # Runs per benchmark (reduced so script completes quickly)


def bench(fn, iterations: int = ITERATIONS) -> dict:
    """Time `fn()` for `iterations` runs and return statistics (ms)."""
    latencies = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        fn()
        latencies.append((time.perf_counter() - t0) * 1000)
    return {
        "iterations": iterations,
        "min_ms": round(min(latencies), 3),
        "max_ms": round(max(latencies), 3),
        "mean_ms": round(statistics.mean(latencies), 3),
        "stddev_ms": round(statistics.stdev(latencies) if len(latencies) > 1 else 0.0, 3),
        "throughput_ops_per_sec": round(1000 / statistics.mean(latencies), 1),
    }


def fresh_db():
    """Return a fresh, isolated session (tables already created on module init)."""
    return TestingSessionLocal()


def make_investigator(db, email: str) -> User:
    u = User(
        email=email,
        hashed_password=hash_password("Secure@2026"),
        name="Perf Investigator",
        role="investigator",
        is_active=True,
        email_verified=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def print_table(results: dict):
    """Print a formatted ASCII results table."""
    col_w = [38, 6, 8, 8, 8, 8, 14]
    headers = ["Feature", "Iter", "Min ms", "Max ms", "Mean ms", "Std ms", "Ops/sec"]
    sep = "+" + "+".join("-" * w for w in col_w) + "+"

    def row(cells):
        return "|" + "|".join(
            str(c).center(col_w[i]) for i, c in enumerate(cells)
        ) + "|"

    print("\n" + sep)
    print(row(headers))
    print(sep)
    for name, stats in results.items():
        print(row([
            name[:36],
            stats["iterations"],
            stats["min_ms"],
            stats["max_ms"],
            stats["mean_ms"],
            stats["stddev_ms"],
            stats["throughput_ops_per_sec"],
        ]))
    print(sep + "\n")


# ═════════════════════════════════════════════════════════════════════════════
# Benchmark 1 — Threat Intelligence Service
# ═════════════════════════════════════════════════════════════════════════════

def bench_threat_intel_ip():
    threat_intel_service.lookup_ip_reputation("192.168.1.100")

def bench_threat_intel_domain():
    threat_intel_service.lookup_domain_reputation("phishing-scam-site.com")

def bench_threat_intel_hash():
    threat_intel_service.scan_file_hash("abc123deadbeef" + uuid.uuid4().hex[:8])


# ═════════════════════════════════════════════════════════════════════════════
# Benchmark 2 — Email Attachment Parser
# ═════════════════════════════════════════════════════════════════════════════

_email_db = fresh_db()

def bench_email_parser():
    attachments = [("invoice.pdf", b"%PDF-1.4 " + os.urandom(512))]
    ticket, _ = email_listener_service.receive_mock_email(
        _email_db,
        sender=f"citizen_{uuid.uuid4().hex[:6]}@example.com",
        subject=f"UPI Scam Report {uuid.uuid4().hex[:4]}",
        body="I was defrauded of 75000 rupees via UPI payment scam.",
        attachments=attachments,
    )
    _email_db.expunge_all()  # clear session cache between runs


# ═════════════════════════════════════════════════════════════════════════════
# Benchmark 3 — Auto-Assignment (Least-Workload Routing)
# ═════════════════════════════════════════════════════════════════════════════

_assign_db = fresh_db()
# Pre-create investigators once
_inv_a = make_investigator(_assign_db, f"inv_a_{uuid.uuid4().hex[:6]}@ccgp.gov.in")
_inv_b = make_investigator(_assign_db, f"inv_b_{uuid.uuid4().hex[:6]}@ccgp.gov.in")

def bench_auto_assignment():
    ticket = ticket_service.create_complaint_and_ticket(
        _assign_db,
        title=f"Perf Test Case {uuid.uuid4().hex[:6]}",
        description="Benchmarking least-workload investigator routing algorithm.",
        source="portal",
        reporter_name="Perf Citizen",
        reporter_email=f"perf_{uuid.uuid4().hex[:6]}@example.com",
    )
    _assign_db.expunge_all()


# ═════════════════════════════════════════════════════════════════════════════
# Benchmark 4 — Hybrid Search
# ═════════════════════════════════════════════════════════════════════════════

_search_db = fresh_db()
# Pre-create one ticket to search against
_seed_ticket = ticket_service.create_complaint_and_ticket(
    _search_db,
    title="Seed Hybrid Search Ticket",
    description="Used for hybrid search benchmarking.",
    source="portal",
    reporter_name="SearchBench User",
    reporter_email="searchbench@example.com",
)
_search_ticket_id = str(_seed_ticket.id)

def bench_hybrid_search_uuid():
    unified_search_service.hybrid_search(_search_db, query_text=_search_ticket_id)

def bench_hybrid_search_name():
    unified_search_service.hybrid_search(_search_db, query_text="SearchBench")

def bench_hybrid_search_email():
    unified_search_service.hybrid_search(_search_db, query_text="searchbench@example")


# ═════════════════════════════════════════════════════════════════════════════
# Benchmark 5 — Rejection Workflow
# ═════════════════════════════════════════════════════════════════════════════

def bench_rejection_workflow():
    """Full rejection cycle: create → set Under Investigation → request closure → L1 approve → reject."""
    db = fresh_db()
    try:
        sup = make_investigator(db, f"sup_{uuid.uuid4().hex[:8]}@ccgp.gov.in")
        inv = make_investigator(db, f"inv_{uuid.uuid4().hex[:8]}@ccgp.gov.in")
        sup.role = "supervisor"
        db.add(sup)
        db.commit()

        ticket = ticket_service.create_complaint_and_ticket(
            db,
            title="Rejection Workflow Benchmark",
            description="Benchmarking complete rejection workflow end-to-end.",
            source="portal",
            reporter_name="Reject Bench",
            reporter_email=f"reject_{uuid.uuid4().hex[:6]}@example.com",
        )
        ticket.assigned_officer_id = inv.id
        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        ticket.complaint.status = "Under Investigation"
        db.add(ticket.complaint)
        db.commit()
        db.refresh(ticket)

        approval_service.request_closure(db, ticket_id=ticket.id, actor_id=inv.id, reason="Perf test.")
        approval_service.submit_l1_approval(db, ticket_id=ticket.id, actor_id=sup.id, comment_text="L1 perf test.")
        approval_service.reject_closure(db, ticket_id=ticket.id, actor_id=sup.id, comment_text="Rejected for perf test.")
    finally:
        db.close()


# ═════════════════════════════════════════════════════════════════════════════
# Main Runner
# ═════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 70)
    print("  CCGP Era 6 — Performance Metrics Analysis")
    print(f"  Iterations per benchmark: {ITERATIONS}")
    print("=" * 70)

    results = {}

    benchmarks = [
        ("Threat Intel: IP Lookup",         bench_threat_intel_ip),
        ("Threat Intel: Domain Lookup",      bench_threat_intel_domain),
        ("Threat Intel: Hash Scan",          bench_threat_intel_hash),
        ("Email Parser: Attachment + SHA256",bench_email_parser),
        ("Auto-Assign: Least Workload",      bench_auto_assignment),
        ("Hybrid Search: UUID",              bench_hybrid_search_uuid),
        ("Hybrid Search: Name Substring",    bench_hybrid_search_name),
        ("Hybrid Search: Email Substring",   bench_hybrid_search_email),
        ("Rejection Workflow: Full Cycle",   bench_rejection_workflow),
    ]

    for label, fn in benchmarks:
        print(f"  >> Benchmarking: {label} ...", end=" ", flush=True)
        stats = bench(fn)
        results[label] = stats
        print(f"mean={stats['mean_ms']}ms  throughput={stats['throughput_ops_per_sec']} ops/s")

    print_table(results)

    # Save JSON report
    logs_dir = os.path.join(os.path.dirname(__file__), "..", "..", "logs")
    os.makedirs(logs_dir, exist_ok=True)
    report_path = os.path.join(logs_dir, "perf_metrics.json")
    with open(report_path, "w") as f:
        json.dump(
            {
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "iterations_per_benchmark": ITERATIONS,
                "results": results,
            },
            f,
            indent=2,
        )
    print(f"  OK  JSON report saved to: {os.path.abspath(report_path)}\n")


if __name__ == "__main__":
    main()
