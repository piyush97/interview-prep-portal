"""Tool layer — wires prompts + agent dispatcher.

Each function is a thin wrapper that:
1. Loads the profile (or accepts one)
2. Builds the prompts
3. Calls the agent
4. Returns the response text

No I/O outside the agent call. Easy to test with a mock backend.
"""
from __future__ import annotations

import logging
from typing import Any

from .agents import (
    AgentBackend,
    AgentResponse,
    BackendError,
    detect_available_backend,
    get_backend,
)
from .profile import Profile, load_profile
from .prompts import (
    cover_letter_prompts,
    evaluate_jd_prompts,
    interview_stories_prompts,
    negotiation_script_prompts,
    research_company_prompts,
    scan_jobs_prompts,
)

logger = logging.getLogger(__name__)


def _resolve_agent(
    profile: Profile,
    override: AgentBackend | None = None,
) -> AgentBackend:
    if override:
        return override
    cfg = profile.agent
    if cfg.backend == "http":
        api_key = None
        if cfg.api_key_env:
            import os
            api_key = os.environ.get(cfg.api_key_env)
        return get_backend(
            "http",
            endpoint=cfg.endpoint,
            api_key=api_key,
        )
    try:
        return get_backend(cfg.backend)
    except ValueError:
        logger.warning("Unknown backend %r, falling back to detection", cfg.backend)
        return detect_available_backend()


# --- Tool implementations ---

def evaluate_jd(
    jd_text: str,
    profile: Profile | None = None,
    agent: AgentBackend | None = None,
) -> dict[str, Any]:
    """Evaluate a job description. Returns dict with 'evaluation' and metadata."""
    p = profile or load_profile()
    backend = _resolve_agent(p, agent)
    system, user = evaluate_jd_prompts(p, jd_text)
    resp: AgentResponse = backend.call(
        system, user, model=p.agent.model or None, max_tokens=p.agent.max_tokens
    )
    return {
        "evaluation": resp.text,
        "model": resp.model,
        "tokens_in": resp.tokens_in,
        "tokens_out": resp.tokens_out,
        "duration_ms": resp.duration_ms,
        "agent": backend.name,
    }


def generate_cover_letter(
    company: str,
    role: str,
    jd_text: str = "",
    angle: str = "impact",
    profile: Profile | None = None,
    agent: AgentBackend | None = None,
) -> dict[str, Any]:
    p = profile or load_profile()
    backend = _resolve_agent(p, agent)
    system, user = cover_letter_prompts(p, company, role, jd_text, angle)
    resp = backend.call(system, user, model=p.agent.model or None, max_tokens=p.agent.max_tokens)
    return {
        "cover_letter": resp.text,
        "company": company,
        "role": role,
        "angle": angle,
        "model": resp.model,
        "agent": backend.name,
    }


def research_company(
    company: str,
    role: str = "",
    profile: Profile | None = None,
    agent: AgentBackend | None = None,
) -> dict[str, Any]:
    p = profile or load_profile()
    backend = _resolve_agent(p, agent)
    system, user = research_company_prompts(p, company, role)
    resp = backend.call(system, user, model=p.agent.model or None, max_tokens=p.agent.max_tokens)
    return {
        "research": resp.text,
        "company": company,
        "role": role,
        "model": resp.model,
        "agent": backend.name,
    }


def scan_jobs(
    search_terms: str = "",
    location: str = "",
    max_results: int = 10,
    profile: Profile | None = None,
    agent: AgentBackend | None = None,
) -> dict[str, Any]:
    p = profile or load_profile()
    # Fall back to profile target roles if no search terms given
    if not search_terms and p.target_roles:
        search_terms = " OR ".join(p.target_roles)
    if not search_terms:
        search_terms = f"{p.career.current_title or 'professional'}"
    if not location and p.identity.location:
        location = p.identity.location
    backend = _resolve_agent(p, agent)
    system, user = scan_jobs_prompts(p, search_terms, location, max_results)
    resp = backend.call(system, user, model=p.agent.model or None, max_tokens=p.agent.max_tokens)
    return {
        "listings": resp.text,
        "search_terms": search_terms,
        "location": location,
        "max_results": max_results,
        "model": resp.model,
        "agent": backend.name,
    }


def generate_interview_stories(
    focus: str = "all",
    profile: Profile | None = None,
    agent: AgentBackend | None = None,
) -> dict[str, Any]:
    p = profile or load_profile()
    backend = _resolve_agent(p, agent)
    system, user = interview_stories_prompts(p, focus)
    resp = backend.call(system, user, model=p.agent.model or None, max_tokens=p.agent.max_tokens)
    return {
        "stories": resp.text,
        "focus": focus,
        "model": resp.model,
        "agent": backend.name,
    }


def generate_negotiation_script(
    offer_details: str,
    c2c: bool = False,
    profile: Profile | None = None,
    agent: AgentBackend | None = None,
) -> dict[str, Any]:
    p = profile or load_profile()
    backend = _resolve_agent(p, agent)
    system, user = negotiation_script_prompts(p, offer_details, c2c)
    resp = backend.call(system, user, model=p.agent.model or None, max_tokens=p.agent.max_tokens)
    return {
        "script": resp.text,
        "engagement": "C2C contract" if c2c else "full-time employment",
        "model": resp.model,
        "agent": backend.name,
    }
