"""Thin HTTP handlers for the Career Prep plugin.

The plugin does not build prompts or call AI CLIs directly. The local Python
backend owns profile loading, prompt construction, and agent dispatch.
"""

from __future__ import annotations

import json
import os
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


BACKEND_URL = os.environ.get("PREP_BACKEND_URL", "http://localhost:8766").rstrip("/")


def _get_portal_dir() -> Path:
    """Get the portal directory from env or default."""
    return Path(os.environ.get("PREP_PORTAL_DIR", os.path.expanduser("~/interview-prep-portal")))


def _request(path: str, payload: dict[str, Any] | None = None, timeout: int = 120) -> dict[str, Any]:
    url = f"{BACKEND_URL}{path}"
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="GET" if payload is None else "POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        return {"error": f"Backend {e.code}: {detail}"}
    except Exception as e:
        return {"error": f"Backend unavailable at {BACKEND_URL}: {e}"}


def _put(path: str, payload: dict[str, Any], timeout: int = 120) -> dict[str, Any]:
    url = f"{BACKEND_URL}{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="PUT",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        return {"error": f"Backend {e.code}: {detail}"}
    except Exception as e:
        return {"error": f"Backend unavailable at {BACKEND_URL}: {e}"}


def _json(data: dict[str, Any]) -> str:
    return json.dumps(data)


def handle_evaluate_jd(args: dict, **kwargs) -> str:
    """Evaluate a job description against the user's profile."""
    url_or_text = args.get("url_or_text", "")
    if not url_or_text:
        return _json({"error": "No job description or URL provided."})
    return _json(_request("/api/evaluate_jd", {"jd_text": url_or_text}))


def handle_generate_cover_letter(args: dict, **kwargs) -> str:
    """Generate a tailored cover letter."""
    company = args.get("company", "")
    role = args.get("role", "")
    if not company or not role:
        return _json({"error": "Company and role are required."})

    result = _request(
        "/api/cover_letter",
        {
            "company": company,
            "role": role,
            "jd_text": args.get("job_description", ""),
            "angle": args.get("angle", "impact"),
        },
    )
    result.setdefault("company", company)
    result.setdefault("role", role)
    result.setdefault("angle", args.get("angle", "impact"))
    return _json(result)


def handle_research_company(args: dict, **kwargs) -> str:
    """Research a company for interview prep."""
    company = args.get("company", "")
    role = args.get("role", "")
    if not company:
        return _json({"error": "Company name is required."})

    result = _request("/api/research_company", {"company": company, "role": role}, timeout=180)
    result.setdefault("company", company)
    result.setdefault("role", role)
    return _json(result)


def handle_scan_jobs(args: dict, **kwargs) -> str:
    """Scan job boards for matching roles."""
    max_results = min(int(args.get("max_results", 10) or 10), 25)
    result = _request(
        "/api/scan_jobs",
        {
            "search_terms": args.get("search_terms", ""),
            "location": args.get("location", ""),
            "max_results": max_results,
        },
        timeout=180,
    )
    result.setdefault("query", args.get("search_terms", ""))
    result.setdefault("location", args.get("location", ""))
    return _json(result)


def handle_interview_stories(args: dict, **kwargs) -> str:
    """Generate STAR+Reflection interview stories."""
    focus = args.get("focus", "all")
    result = _request("/api/interview_stories", {"focus": focus})
    result.setdefault("focus", focus)
    return _json(result)


def handle_negotiation_script(args: dict, **kwargs) -> str:
    """Generate a negotiation script."""
    offer = args.get("offer_details", "")
    if not offer:
        return _json({"error": "Offer details are required."})

    result = _request(
        "/api/negotiation_script",
        {"offer_details": offer, "c2c": bool(args.get("c2c", False))},
    )
    result.setdefault("engagement", "C2C contract" if args.get("c2c", False) else "full-time employment")
    return _json(result)


def handle_serve_portal(args: dict, **kwargs) -> str:
    """Start, stop, or check the web portal."""
    action = args.get("action", "status")
    portal_dir = _get_portal_dir()

    if action == "status":
        health = _request("/health", timeout=5)
        if health.get("ok"):
            return _json({"status": "running", "url": BACKEND_URL, "agent": health.get("agent")})
        return _json({"status": "stopped", "detail": health.get("error")})

    if not portal_dir.exists():
        return _json({"error": f"Portal directory not found: {portal_dir}. Set PREP_PORTAL_DIR env var."})

    if action == "start":
        health = _request("/health", timeout=3)
        if health.get("ok"):
            return _json({"status": "already_running", "url": BACKEND_URL})
        try:
            subprocess.Popen(
                ["python3", "-m", "uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8766"],
                cwd=str(portal_dir),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            time.sleep(2)
            return _json({"status": "started", "url": BACKEND_URL})
        except Exception as e:
            return _json({"error": f"Failed to start backend: {e}"})

    if action == "stop":
        return _json({"error": "Stop the backend from the terminal that started it."})

    return _json({"error": f"Unknown action: {action}"})


def handle_portal_status(args: dict, **kwargs) -> str:
    """Return backend health and active profile summary."""
    health = _request("/health", timeout=5)
    profile = _request("/profile", timeout=5)

    if health.get("error") and profile.get("error"):
        return _json({
            "status": "stopped",
            "backend_url": BACKEND_URL,
            "error": health.get("error"),
        })

    identity = profile.get("identity") or {}
    career = profile.get("career") or {}
    agent = profile.get("agent") or {}

    return _json({
        "status": "running" if health.get("ok") else "unknown",
        "backend_url": BACKEND_URL,
        "version": health.get("version"),
        "agent": health.get("agent") or agent.get("backend"),
        "profile_path": health.get("profile_path"),
        "profile_name": identity.get("name", ""),
        "profile_title": career.get("current_title", ""),
    })
