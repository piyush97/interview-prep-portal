"""Tests for the FastAPI server."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import os

import pytest
from fastapi.testclient import TestClient

from backend.agents import AgentResponse
from backend.profile import profile_from_dict
from backend.server import create_app


@dataclass
class FakeBackend:
    name: str = "fake"
    canned_text: str = "FAKE"

    def call(self, system: str, user: str, *, model=None, max_tokens: int = 4000) -> AgentResponse:
        return AgentResponse(text=self.canned_text, model=model or "fake", duration_ms=10)


@pytest.fixture
def profile_file(tmp_path, monkeypatch):
    p = tmp_path / "profile.yaml"
    monkeypatch.setenv("PREP_PROFILE_PATH", str(p))
    return p


@pytest.fixture
def client(profile_file):
    """Test client with the fake backend wired into the app."""
    from backend import server as server_module
    app = create_app(agent_factory=lambda: FakeBackend(canned_text="test response"))
    return TestClient(app)


class TestHealth:
    def test_returns_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["ok"] is True
        assert "version" in body


class TestProfile:
    def test_get_returns_empty_profile(self, client):
        r = client.get("/profile")
        assert r.status_code == 200
        body = r.json()
        assert body["identity"]["name"] == ""

    def test_put_updates_profile(self, client):
        r = client.put("/profile", json={
            "identity": {"name": "Bob"},
            "career": {"current_title": "Nurse", "level": "Senior", "years_experience": 5},
        })
        assert r.status_code == 200
        assert r.json()["identity"]["name"] == "Bob"

    def test_put_persists_to_disk(self, client, profile_file):
        client.put("/profile", json={"identity": {"name": "Alice"}})
        assert profile_file.exists()
        # Read it back
        r = client.get("/profile")
        assert r.json()["identity"]["name"] == "Alice"

    def test_put_rejects_invalid_data(self, client):
        # years_experience must be >= 0
        r = client.put("/profile", json={"career": {"years_experience": -5}})
        assert r.status_code == 422

    def test_get_schema(self, client):
        r = client.get("/profile/schema")
        assert r.status_code == 200
        schema = r.json()
        # Should be a JSON schema with our fields
        assert "properties" in schema
        assert "identity" in schema["properties"]


class TestEvaluateJD:
    def test_basic(self, client):
        r = client.post("/api/evaluate_jd", json={"jd_text": "Software Engineer at Acme"})
        assert r.status_code == 200
        body = r.json()
        assert "evaluation" in body
        assert body["evaluation"] == "test response"
        assert "agent" in body

    def test_requires_jd_text_or_url(self, client):
        r = client.post("/api/evaluate_jd", json={})
        # Either 400 or 422 — depends on how we validate
        assert r.status_code >= 400


class TestCoverLetter:
    def test_basic(self, client):
        r = client.post("/api/cover_letter", json={"company": "Acme", "role": "Nurse"})
        assert r.status_code == 200
        body = r.json()
        assert "cover_letter" in body
        assert body["company"] == "Acme"

    def test_requires_company_and_role(self, client):
        r = client.post("/api/cover_letter", json={"company": "Acme"})
        assert r.status_code == 422


class TestResearchCompany:
    def test_basic(self, client):
        r = client.post("/api/research_company", json={"company": "Anthropic"})
        assert r.status_code == 200
        assert "research" in r.json()


class TestScanJobs:
    def test_basic(self, client):
        r = client.post("/api/scan_jobs", json={"search_terms": "Nurse", "location": "Toronto"})
        assert r.status_code == 200
        assert "listings" in r.json()


class TestInterviewStories:
    def test_basic(self, client):
        r = client.post("/api/interview_stories", json={"focus": "leadership"})
        assert r.status_code == 200
        assert "stories" in r.json()


class TestNegotiation:
    def test_basic(self, client):
        r = client.post("/api/negotiation_script", json={"offer_details": "Offer: $80k"})
        assert r.status_code == 200
        assert "script" in r.json()


class TestProfileFromYAML:
    """POST /profile/from_yaml — Onboarding wizard sends YAML text and gets back a parsed Profile."""

    def test_basic(self, client):
        yaml_text = (
            "schema_version: 1\n"
            "identity:\n"
            "  name: Test Nurse\n"
            "  location: Toronto\n"
            "  work_authorization: Canadian PR\n"
            "career:\n"
            "  current_title: ICU Nurse\n"
            "  years_experience: 5\n"
            "  level: Senior\n"
            "target_roles: [Nurse Practitioner]\n"
            "skills:\n"
            "  core: [ACLS, BLS]\n"
            "agent:\n"
            "  backend: offline\n"
        )
        resp = client.post("/profile/from_yaml", json={"yaml_text": yaml_text})
        assert resp.status_code == 200
        data = resp.json()
        assert data["identity"]["name"] == "Test Nurse"
        assert data["career"]["current_title"] == "ICU Nurse"
        assert data["skills"]["core"] == ["ACLS", "BLS"]

    def test_invalid_yaml(self, client):
        resp = client.post("/profile/from_yaml", json={"yaml_text": "not: valid: yaml: [{"})
        assert resp.status_code == 422

    def test_empty(self, client):
        resp = client.post("/profile/from_yaml", json={"yaml_text": ""})
        # Empty string is invalid YAML for a profile mapping
        assert resp.status_code == 422

