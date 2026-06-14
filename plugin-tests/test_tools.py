"""Tests for career-prep plugin tool handlers.

Mocks subprocess.run so tests run hermes-free.
"""
import json
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

# Locate plugin — installed first, then repo copy
_candidates = [
    Path.home() / ".hermes/plugins/career-prep",
    Path(__file__).resolve().parent.parent / "plugin/career-prep",
]
PLUGIN_DIR = next((p for p in _candidates if (p / "tools.py").exists()), None)
if not PLUGIN_DIR:
    raise FileNotFoundError("Could not find career-prep plugin in any known location")

# Load tools.py as a standalone module (skip __init__'s relative imports)
import importlib.util
_spec = importlib.util.spec_from_file_location("career_prep_tools", PLUGIN_DIR / "tools.py")
tools = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tools)


def _mock_hermes(output="mocked hermes response"):
    """Returns a context manager that patches subprocess.run for hermes calls."""
    mock_result = MagicMock()
    mock_result.stdout = output
    mock_result.stderr = ""
    mock_result.returncode = 0
    return patch.object(tools.subprocess, "run", return_value=mock_result)


# ─── evaluate_jd ─────────────────────────────────────────

def test_evaluate_jd_returns_evaluation():
    with _mock_hermes("A) Summary\nB) 4/5 match"):
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
    with _mock_hermes("Dear Anthropic team, ..."):
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
    with _mock_hermes("# OpenAI\nFounded 2015..."):
        out = tools.handle_research_company({"company": "OpenAI"})
    data = json.loads(out)
    assert "research" in data
    assert "OpenAI" in data["research"]


# ─── interview_stories ───────────────────────────────────

def test_stories_focus_default():
    with _mock_hermes("### Story 1: ..."):
        out = tools.handle_interview_stories({})
    data = json.loads(out)
    assert "stories" in data


# ─── negotiation ─────────────────────────────────────────

def test_negotiation_missing_offer_returns_error():
    out = tools.handle_negotiation_script({})
    data = json.loads(out)
    assert "error" in data


def test_negotiation_c2c():
    with _mock_hermes("Walk away at $130/hr..."):
        out = tools.handle_negotiation_script({
            "offer_details": "$80/hr C2C, 6mo",
            "c2c": True,
        })
    data = json.loads(out)
    assert "script" in data
    assert data.get("engagement") == "C2C contract"


# ─── portal status (data file mirror) ────────────────────

def test_portal_status_with_data_file():
    sample = {
        "applications": [
            {"id": "a1", "status": "applied", "company": "X", "role": "Y"},
            {"id": "a2", "status": "phone-screen", "company": "Z", "role": "W"},
        ],
        "skills": [{"name": "React", "level": 5, "targetLevel": 5}],
        "flashcards": [{"level": 5}],
        "learningPaths": [{"modules": [], "completedModules": []}],
        "contacts": [],
        "offers": [],
        "journal": [],
        "profile": {"name": "Piyush", "targetRate": 100, "targetSalary": 160000},
    }
    with tempfile.TemporaryDirectory() as tmp:
        (Path(tmp) / "data.json").write_text(json.dumps(sample))
        with patch.dict(os.environ, {"PREP_PORTAL_DIR": tmp}):
            out = tools.handle_portal_status({})
        data = json.loads(out)
        assert data["applications"]["total"] == 2
        assert data["applications"]["interviews"] == 1
        assert data["profile"]["name"] == "Piyush"
        assert data["profile"]["target_rate"] == 100


def test_portal_status_no_data_no_portal_dir():
    with tempfile.TemporaryDirectory() as tmp:
        with patch.dict(os.environ, {"PREP_PORTAL_DIR": "/nonexistent/path/that/does/not/exist"}):
            out = tools.handle_portal_status({})
        data = json.loads(out)
        assert "error" in data or "message" in data


# ─── scan_jobs ────────────────────────────────────────────

def test_scan_jobs_returns_listings():
    with _mock_hermes("| Job | Company | ...\n| AI Engineer | Anthropic | ..."):
        out = tools.handle_scan_jobs({})
    data = json.loads(out)
    assert "listings" in data
    assert "query" in data


# ─── smoke: all handlers return valid JSON ────────────────

def test_all_handlers_return_valid_json():
    """Every handler must return valid JSON, never raise."""
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
        with _mock_hermes():
            out = handler(args)
        json.loads(out)
