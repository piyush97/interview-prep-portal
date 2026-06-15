"""Tests for career-prep plugin tool handlers (v1.4.0).

The plugin is now a thin HTTP client that talks to the local
backend at http://localhost:8766. Tests mock the HTTP layer
(urllib.request.urlopen) instead of subprocess.
"""
import json
import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Locate plugin
_candidates = [
    Path.home() / ".hermes/plugins/career-prep",
    Path(__file__).resolve().parent.parent / "plugin/career-prep",
]
PLUGIN_DIR = next((p for p in _candidates if (p / "tools.py").exists()), None)
if not PLUGIN_DIR:
    raise FileNotFoundError("Could not find career-prep plugin in any known location")

import importlib.util
_spec = importlib.util.spec_from_file_location("career_prep_tools", PLUGIN_DIR / "tools.py")
tools = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tools)


class FakeHTTPResponse:
    """Mimics urllib's response context manager."""
    def __init__(self, body: dict, status: int = 200):
        self.body = json.dumps(body).encode("utf-8")
        self.status = status

    def read(self) -> bytes:
        return self.body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def _mock_backend(responses: dict):
    """Patch urllib.request.urlopen to return canned responses by path.

    responses: { "/api/foo": {"key": "value"}, ... }
    """
    def fake_urlopen(req, **kwargs):
        url = req.full_url if hasattr(req, "full_url") else req
        # Match the longest path prefix
        for path in sorted(responses.keys(), key=len, reverse=True):
            if path in url:
                return FakeHTTPResponse(responses[path])
        # Default: error
        return FakeHTTPResponse({"error": f"No mock for {url}"})

    import urllib.request as _ur; return patch.object(_ur, "urlopen", fake_urlopen)


# ─── evaluate_jd ─────────────────────────────────────────

def test_evaluate_jd_returns_evaluation():
    with _mock_backend({"/api/evaluate_jd": {"evaluation": "A) Summary\nB) 4/5 match"}}):
        out = tools.handle_evaluate_jd({"url_or_text": "Senior Engineer at Anthropic"})
    data = json.loads(out)
    assert "evaluation" in data
    assert "4/5" in data["evaluation"]


def test_evaluate_jd_empty_returns_error():
    out = tools.handle_evaluate_jd({"url_or_text": ""})
    data = json.loads(out)
    assert "error" in data


# ─── cover letter ────────────────────────────────────────

def test_cover_letter_returns_letter():
    with _mock_backend({"/api/cover_letter": {"cover_letter": "Dear Hiring Manager..."}}):
        out = tools.handle_generate_cover_letter({"company": "Anthropic", "role": "AI Engineer"})
    data = json.loads(out)
    assert "cover_letter" in data
    assert data.get("company") == "Anthropic"


def test_cover_letter_missing_company_returns_error():
    out = tools.handle_generate_cover_letter({"company": "", "role": "SWE"})
    data = json.loads(out)
    assert "error" in data


# ─── research_company ────────────────────────────────────

def test_research_returns_brief():
    with _mock_backend({"/api/research_company": {"research": "# OpenAI\nFounded 2015..."}}):
        out = tools.handle_research_company({"company": "OpenAI"})
    data = json.loads(out)
    assert "research" in data
    assert "OpenAI" in data["research"]


# ─── interview_stories ───────────────────────────────────

def test_stories_focus_default():
    with _mock_backend({"/api/interview_stories": {"stories": "### Story 1: ..."}}):
        out = tools.handle_interview_stories({})
    data = json.loads(out)
    assert "stories" in data


# ─── negotiation ─────────────────────────────────────────

def test_negotiation_missing_offer_returns_error():
    out = tools.handle_negotiation_script({})
    data = json.loads(out)
    assert "error" in data


def test_negotiation_c2c():
    with _mock_backend({"/api/negotiation_script": {"script": "Walk away at $130/hr", "engagement": "C2C contract"}}):
        out = tools.handle_negotiation_script({
            "offer_details": "$80/hr C2C, 6mo",
            "c2c": True,
        })
    data = json.loads(out)
    assert "script" in data
    assert data.get("engagement") == "C2C contract"


# ─── portal status (now uses backend /health + /profile) ──

def test_portal_status_with_real_profile():
    """The new status just returns health + profile name. No Piyush defaults."""
    with _mock_backend({
        "/health": {"ok": True, "version": "1.4.0", "agent": "hermes"},
        "/profile": {
            "identity": {"name": "Bob Smith"},
            "career": {"current_title": "ICU Nurse"},
            "agent": {"backend": "hermes"},
        },
    }):
        out = tools.handle_portal_status({})
    data = json.loads(out)
    assert data["profile_name"] == "Bob Smith"
    assert data["profile_title"] == "ICU Nurse"
    assert data["agent"] == "hermes"
    # Confirm no Piyush leak
    assert "Piyush" not in json.dumps(data)


# ─── scan_jobs ────────────────────────────────────────────

def test_scan_jobs_returns_listings():
    with _mock_backend({"/api/scan_jobs": {"listings": "| Job | Company |", "query": "AI"}}):
        out = tools.handle_scan_jobs({})
    data = json.loads(out)
    assert "listings" in data


# ─── smoke: all handlers return valid JSON ────────────────

def test_all_handlers_return_valid_json():
    """Every handler must return valid JSON, never raise."""
    with _mock_backend({
        "/api/evaluate_jd": {"evaluation": "ok"},
        "/api/cover_letter": {"cover_letter": "ok", "company": "X", "role": "Y"},
        "/api/research_company": {"research": "ok", "company": "X", "role": ""},
        "/api/interview_stories": {"stories": "ok"},
        "/api/negotiation_script": {"script": "ok", "engagement": "FTE"},
        "/api/scan_jobs": {"listings": "ok"},
        "/health": {"ok": True, "version": "1.4.0", "agent": "hermes"},
        "/profile": {
            "identity": {"name": "Test"},
            "career": {"current_title": "Nurse"},
            "agent": {"backend": "hermes"},
        },
    }):
        handlers = [
            ("handle_evaluate_jd", {"url_or_text": "test"}),
            ("handle_generate_cover_letter", {"company": "X", "role": "Y"}),
            ("handle_research_company", {"company": "X"}),
            ("handle_interview_stories", {}),
            ("handle_negotiation_script", {"offer_details": "X"}),
            ("handle_serve_portal", {"action": "status"}),
            ("handle_portal_status", {}),
            ("handle_scan_jobs", {}),
        ]
        for name, args in handlers:
            handler = getattr(tools, name)
            out = handler(args)
            json.loads(out)  # must not raise
