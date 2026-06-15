"""Profile system for Interview Prep Portal.

A user-editable profile.yaml that replaces hardcoded candidate data.
No Piyush defaults — the user fills in their own.

Lives at ~/.interview-prep-portal/profile.yaml by default.
Override with PREP_PROFILE_PATH env var.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Annotated, Literal

import yaml
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)

SCHEMA_VERSION = 1

Level = Literal["Entry", "Mid", "Senior", "Lead", "Principal", "Staff", "Executive"]
WorkType = Literal["FTE", "Contract", "C2C", "Part-time", "Internship", "Freelance"]
Backend = Literal["hermes", "claude", "codex", "http", "offline"]


# --- Sub-models ---

class Contact(BaseModel):
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    portfolio: str = ""


class Identity(BaseModel):
    name: str = ""
    pronouns: str = ""
    location: str = ""
    work_authorization: str = ""
    contact: Contact = Field(default_factory=Contact)


class Career(BaseModel):
    current_title: str = ""
    years_experience: int = 0
    level: str = ""
    industry: str = ""

    @field_validator("years_experience")
    @classmethod
    def _no_negative_years(cls, v: int) -> int:
        if v < 0:
            raise ValueError("years_experience must be >= 0")
        return v

    @field_validator("level")
    @classmethod
    def _valid_level(cls, v: str) -> str:
        valid = {"", "Entry", "Mid", "Senior", "Lead", "Principal", "Staff", "Executive"}
        if v not in valid:
            raise ValueError(f"level must be one of {sorted(valid)}, got {v!r}")
        return v


class Skills(BaseModel):
    core: list[str] = Field(default_factory=list)
    growing: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)


class Compensation(BaseModel):
    currency: str = "CAD"
    fte_target: int = 0
    contract_target_hourly: int = 0
    negotiable: bool = True


class WorkHistoryEntry(BaseModel):
    company: str = ""
    title: str = ""
    start: str = ""          # "YYYY-MM" or "YYYY"
    end: str = ""            # "YYYY-MM" or "present"
    highlights: list[str] = Field(default_factory=list)
    tech: list[str] = Field(default_factory=list)  # "tech" works for tools/methods/equipment too


class EducationEntry(BaseModel):
    school: str = ""
    credential: str = ""
    year: int = 0


class Preferences(BaseModel):
    remote: bool = False
    hybrid: bool = False
    onsite: bool = False
    willing_to_relocate: bool = False
    visa_sponsorship_needed: bool = False
    notice_period: str = ""


class AgentConfig(BaseModel):
    backend: Backend = "offline"
    model: str = ""
    command: str = ""        # custom CLI command override
    endpoint: str = ""       # for "http" backend
    api_key_env: str = ""    # env var name holding the key
    max_tokens: int = 4000
    temperature: float = 0.7

    @field_validator("backend")
    @classmethod
    def _valid_backend(cls, v: str) -> str:
        valid = {"hermes", "claude", "codex", "http", "offline"}
        if v not in valid:
            raise ValueError(f"backend must be one of {sorted(valid)}, got {v!r}")
        return v


class Profile(BaseModel):
    """Top-level profile. Single source of truth for "who you are"."""

    schema_version: int = SCHEMA_VERSION
    identity: Identity = Field(default_factory=Identity)
    career: Career = Field(default_factory=Career)
    target_roles: list[str] = Field(default_factory=list)
    target_industries: list[str] = Field(default_factory=list)
    work_types: list[WorkType] = Field(default_factory=list)
    skills: Skills = Field(default_factory=Skills)
    compensation: Compensation = Field(default_factory=Compensation)
    work_history: list[WorkHistoryEntry] = Field(default_factory=list)
    education: list[EducationEntry] = Field(default_factory=list)
    preferences: Preferences = Field(default_factory=Preferences)
    stories_seed: list[str] = Field(default_factory=list)
    agent: AgentConfig = Field(default_factory=AgentConfig)


# --- Helpers ---

def empty_profile() -> Profile:
    """Return a valid empty profile. No Piyush defaults."""
    return Profile()


def profile_from_dict(data: dict) -> Profile:
    """Build a Profile from a dict. Validation errors raise ValueError."""
    return Profile.model_validate(data)


def profile_to_yaml(profile: Profile) -> str:
    """Serialize a profile to YAML with sensible defaults."""
    return yaml.safe_dump(
        profile.model_dump(exclude_none=False),
        sort_keys=False,
        allow_unicode=True,
        default_flow_style=False,
        width=100,
    )


def profile_to_dict(profile: Profile) -> dict:
    return profile.model_dump()


def validate_profile(profile: Profile) -> list[str]:
    """Return a list of human-readable error strings, empty if valid.

    Pydantic's model_validate raises on error; we collect into a list
    for the CLI to display in one go.
    """
    try:
        Profile.model_validate(profile.model_dump())
        return []
    except Exception as e:
        return [str(e)]


# --- File I/O ---

def profile_path() -> Path:
    """Resolve the profile path. Checks PREP_PROFILE_PATH, then ~/.interview-prep-portal/profile.yaml."""
    env = os.environ.get("PREP_PROFILE_PATH")
    if env:
        return Path(env).expanduser()
    return Path.home() / ".interview-prep-portal" / "profile.yaml"


def ensure_profile_dir() -> Path:
    """Create the profile directory if missing. Returns the path."""
    path = profile_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def profile_exists() -> bool:
    return profile_path().exists()


def save_profile(profile: Profile, path: Path | None = None) -> Path:
    """Save profile to disk. Creates parent dir if needed. Returns the path written."""
    target = Path(path) if path else profile_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(profile_to_yaml(profile), encoding="utf-8")
    return target


def load_profile(path: Path | None = None) -> Profile:
    """Load and validate the profile from disk.

    Returns an empty profile if the file doesn't exist or is unparseable.
    """
    target = Path(path) if path else profile_path()
    if not target.exists():
        return empty_profile()
    try:
        raw = yaml.safe_load(target.read_text(encoding="utf-8")) or {}
        if not isinstance(raw, dict):
            logger.warning("Profile at %s is not a YAML mapping — returning empty", target)
            return empty_profile()
        return Profile.model_validate(raw)
    except yaml.YAMLError as e:
        logger.warning("Failed to parse profile YAML at %s: %s — returning empty", target, e)
        return empty_profile()
    except Exception as e:
        # Pydantic validation error
        logger.warning("Profile validation failed at %s: %s — returning empty", target, e)
        return empty_profile()
