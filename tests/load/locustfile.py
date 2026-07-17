"""
SentraDesk Platform Load Testing Suite — Phase 98
Simulates realistic production load across all major API surfaces.
Target: < 200ms p95 latency under 50 concurrent users.

Usage:
  locust -f locustfile.py --host=http://localhost:8000 --users=50 --spawn-rate=5 --run-time=120s --headless
"""
import json
import random
from locust import HttpUser, task, between, events

# Shared bearer token from login
_TOKEN_CACHE: dict = {}


def get_token(client, role_email: str = "officer@sentradesk.gov.in", password: str = "password123") -> str:
    cache_key = role_email
    if cache_key not in _TOKEN_CACHE:
        with client.post(
            "/api/v1/auth/login",
            json={"email": role_email, "password": password},
            name="[AUTH] Login",
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                _TOKEN_CACHE[cache_key] = data.get("data", {}).get("access_token", "")
            else:
                _TOKEN_CACHE[cache_key] = ""
    return _TOKEN_CACHE[cache_key]


class SentraDeskOfficerUser(HttpUser):
    """Simulates a cyber cell officer performing typical daily operations."""
    wait_time = between(1, 3)
    token: str = ""

    def on_start(self):
        self.token = get_token(self.client, "officer@sentradesk.gov.in", "password123")

    def auth_headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    @task(5)
    def list_tickets(self):
        """GET /api/v1/tickets — most common operation."""
        with self.client.get(
            "/api/v1/tickets?limit=20",
            headers=self.auth_headers(),
            name="[TICKET] List tickets",
            catch_response=True
        ) as resp:
            if resp.status_code not in (200, 401, 403):
                resp.failure(f"Unexpected status: {resp.status_code}")

    @task(2)
    def health_check(self):
        """GET /api/v1/health — uptime monitoring."""
        self.client.get("/api/v1/health", name="[HEALTH] Health check")

    @task(2)
    def global_search(self):
        """GET /api/v1/tickets/global/search — hybrid search."""
        terms = ["fraud", "phishing", "hacking", "wallet", "bank"]
        q = random.choice(terms)
        with self.client.get(
            f"/api/v1/tickets/global/search?q={q}&limit=10",
            headers=self.auth_headers(),
            name="[SEARCH] Global hybrid search",
            catch_response=True
        ) as resp:
            if resp.status_code not in (200, 401, 403):
                resp.failure(f"Unexpected status: {resp.status_code}")

    @task(1)
    def governance_kpis(self):
        """GET /api/v1/governance/kpis — executive analytics."""
        with self.client.get(
            "/api/v1/governance/kpis",
            headers=self.auth_headers(),
            name="[GOVERNANCE] KPI dashboard",
            catch_response=True
        ) as resp:
            if resp.status_code not in (200, 401, 403):
                resp.failure(f"Unexpected status: {resp.status_code}")

    @task(1)
    def metrics_endpoint(self):
        """GET /api/v1/metrics — Prometheus scrape simulation."""
        self.client.get("/api/v1/metrics", name="[OPS] Prometheus metrics")


class SentraDeskCitizenUser(HttpUser):
    """Simulates a citizen submitting complaints via the public portal."""
    wait_time = between(3, 8)

    @task(3)
    def submit_complaint(self):
        """POST /api/v1/complaints — public complaint submission (no auth)."""
        payload = {
            "title": f"Cyber Fraud Report #{random.randint(1000, 9999)}",
            "description": "I received a phishing email requesting my bank credentials and I lost money.",
            "reporter_name": f"Test Citizen {random.randint(1, 999)}",
            "reporter_email": f"test{random.randint(1,999)}@example.com",
            "reporter_phone": f"98{random.randint(10000000, 99999999)}",
            "metadata_json": {
                "category": "Cyber Financial Fraud",
                "amount": random.randint(500, 50000)
            }
        }
        with self.client.post(
            "/api/v1/complaints",
            json=payload,
            name="[PUBLIC] Submit complaint",
            catch_response=True
        ) as resp:
            if resp.status_code not in (200, 201, 422):
                resp.failure(f"Unexpected status: {resp.status_code}")

    @task(1)
    def health_check(self):
        self.client.get("/api/v1/health", name="[HEALTH] Health check")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("🚀 SentraDesk Load Test Starting — Target: <200ms p95 under 50 concurrent users")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    stats = environment.runner.stats.total
    print(f"\n✅ Load Test Complete:")
    print(f"   Requests: {stats.num_requests}")
    print(f"   Failures: {stats.num_failures}")
    print(f"   Avg Response: {stats.avg_response_time:.1f}ms")
    print(f"   p95 Response: {stats.get_response_time_percentile(0.95):.1f}ms")
    print(f"   RPS: {stats.total_rps:.1f}")
