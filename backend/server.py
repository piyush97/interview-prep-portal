"""FastAPI server for the Interview Prep Portal backend.

Endpoints:
    GET  /health                   health check
    GET  /profile                  get current profile
    PUT  /profile                  update current profile
    GET  /profile/schema           JSON schema of profile.yaml

    POST /api/evaluate_jd          evaluate a job description
    POST /api/cover_letter         generate a cover letter
    POST /api/research_company     research a company
    POST /api/scan_jobs            scan job boards
    POST /api/interview_stories    generate STAR+R stories
    POST /api/negotiation_script   generate negotiation script

The server is started with `prep serve` (see scripts/prep.py).
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any, Callable

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from . import __version__
from .agents import AgentBackend, BackendError, detect_available_backend
from .profile import (
    Profile,
    load_profile,
    profile_path,
    profile_to_dict,
    save_profile,
)
from .tools import (
    evaluate_jd as tool_evaluate_jd,
    generate_cover_letter as tool_generate_cover_letter,
    generate_interview_stories as tool_generate_interview_stories,
    generate_negotiation_script as tool_generate_negotiation_script,
    research_company as tool_research_company,
    scan_jobs as tool_scan_jobs,
)

logger = logging.getLogger(__name__)


# --- Request schemas ---

class EvaluateJDRequest(BaseModel):
    url: str | None = None
    jd_text: str = ""
    save_as_application: bool = False


class CoverLetterRequest(BaseModel):
    company: str
    role: str
    jd_text: str = ""
    angle: str = "impact"


class ResearchCompanyRequest(BaseModel):
    company: str
    role: str = ""


class ScanJobsRequest(BaseModel):
    search_terms: str = ""
    location: str = ""
    max_results: int = 10


class InterviewStoriesRequest(BaseModel):
    focus: str = "all"


class NegotiationRequest(BaseModel):
    offer_details: str
    c2c: bool = False


class ProfileFromYAMLRequest(BaseModel):
    yaml_text: str


# --- App factory ---

def create_app(
    agent_factory: Callable[[], AgentBackend] | None = None,
) -> FastAPI:
    """Create the FastAPI app. `agent_factory` is for testing — defaults to detect_available_backend."""

    def _agent() -> AgentBackend:
        if agent_factory:
            return agent_factory()
        return detect_available_backend()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        logger.info("Interview Prep Portal backend v%s starting (profile=%s)", __version__, profile_path())
        yield
        logger.info("Backend shutting down")

    app = FastAPI(
        title="Interview Prep Portal Backend",
        version=__version__,
        description="Agent-agnostic backend for the Interview Prep Portal React app",
        lifespan=lifespan,
    )

    # --- Health ---

    @app.get("/health")
    def health() -> dict[str, Any]:
        backend = _agent()
        return {
            "ok": True,
            "version": __version__,
            "agent": backend.name,
            "profile_path": str(profile_path()),
        }

    # --- Profile ---

    @app.get("/profile")
    def get_profile() -> dict[str, Any]:
        p = load_profile()
        return profile_to_dict(p)

    @app.put("/profile")
    def update_profile(payload: dict[str, Any]) -> dict[str, Any]:
        # Accept the profile dict directly (the React app sends the whole profile object)
        try:
            new_profile = Profile.model_validate(payload)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Invalid profile: {e}")
        save_profile(new_profile)
        return profile_to_dict(new_profile)

    @app.get("/profile/schema")
    def get_profile_schema() -> dict[str, Any]:
        return Profile.model_json_schema()

    @app.post("/profile/from_yaml")
    def load_profile_from_yaml(req: ProfileFromYAMLRequest) -> dict[str, Any]:
        """Parse a YAML profile string and return the validated Profile dict.

        Used by the Onboarding wizard to load starter personas from
        profiles/example-*.yaml without requiring the user to round-trip
        through the CLI.
        """
        try:
            import yaml  # type: ignore
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="PyYAML not installed. `pip install pyyaml` to load YAML profiles.",
            )
        try:
            data = yaml.safe_load(req.yaml_text)
            if not isinstance(data, dict):
                raise ValueError("YAML did not parse to a mapping")
            p = Profile.model_validate(data)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Invalid YAML profile: {e}")
        return profile_to_dict(p)

    # --- Tools ---

    @app.post("/api/evaluate_jd")
    def api_evaluate_jd(req: EvaluateJDRequest) -> dict[str, Any]:
        if not req.jd_text and not req.url:
            raise HTTPException(status_code=422, detail="Either jd_text or url is required")
        try:
            result = tool_evaluate_jd(
                jd_text=req.jd_text or req.url or "",
                agent=_agent(),
            )
        except BackendError as e:
            raise HTTPException(status_code=502, detail=f"Agent backend error: {e}")
        return result

    @app.post("/api/cover_letter")
    def api_cover_letter(req: CoverLetterRequest) -> dict[str, Any]:
        try:
            return tool_generate_cover_letter(
                company=req.company,
                role=req.role,
                jd_text=req.jd_text,
                angle=req.angle,
                agent=_agent(),
            )
        except BackendError as e:
            raise HTTPException(status_code=502, detail=f"Agent backend error: {e}")

    @app.post("/api/research_company")
    def api_research_company(req: ResearchCompanyRequest) -> dict[str, Any]:
        try:
            return tool_research_company(
                company=req.company,
                role=req.role,
                agent=_agent(),
            )
        except BackendError as e:
            raise HTTPException(status_code=502, detail=f"Agent backend error: {e}")

    @app.post("/api/scan_jobs")
    def api_scan_jobs(req: ScanJobsRequest) -> dict[str, Any]:
        try:
            return tool_scan_jobs(
                search_terms=req.search_terms,
                location=req.location,
                max_results=req.max_results,
                agent=_agent(),
            )
        except BackendError as e:
            raise HTTPException(status_code=502, detail=f"Agent backend error: {e}")

    @app.post("/api/interview_stories")
    def api_interview_stories(req: InterviewStoriesRequest) -> dict[str, Any]:
        try:
            return tool_generate_interview_stories(
                focus=req.focus,
                agent=_agent(),
            )
        except BackendError as e:
            raise HTTPException(status_code=502, detail=f"Agent backend error: {e}")

    @app.post("/api/negotiation_script")
    def api_negotiation_script(req: NegotiationRequest) -> dict[str, Any]:
        try:
            return tool_generate_negotiation_script(
                offer_details=req.offer_details,
                c2c=req.c2c,
                agent=_agent(),
            )
        except BackendError as e:
            raise HTTPException(status_code=502, detail=f"Agent backend error: {e}")

    return app


# --- Module-level app for `uvicorn backend.server:app` ---

app = create_app()
