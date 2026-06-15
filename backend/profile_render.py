"""Render a Profile into prompt-friendly strings.

This is the layer that replaces the hardcoded Piyush prompt template
in tools.py. Profile-agnostic by design — works for nurses, teachers,
marketers, anyone.
"""
from __future__ import annotations

from typing import Iterable

from .profile import Profile


def render_profile_summary(profile: Profile) -> str:
    """Short summary of the profile — one paragraph + key facts.

    Use this for tool prompts that need the candidate context
    but not the full work history.
    """
    lines = ["CANDIDATE PROFILE", "=" * 40]
    idn = profile.identity
    car = profile.career

    name = idn.name or "(name not provided)"
    lines.append(f"Name: {name}")
    if idn.pronouns:
        lines.append(f"Pronouns: {idn.pronouns}")
    if idn.location:
        lines.append(f"Location: {idn.location}")
    if idn.work_authorization:
        lines.append(f"Work authorization: {idn.work_authorization}")

    title = car.current_title or "(title not provided)"
    years = car.years_experience
    level = car.level
    industry = car.industry
    lines.append("")
    lines.append(f"Current title: {title}")
    if years:
        lines.append(f"Years experience: {years}")
    if level:
        lines.append(f"Level: {level}")
    if industry:
        lines.append(f"Industry: {industry}")

    if profile.target_roles:
        lines.append("")
        lines.append(f"Target roles: {', '.join(profile.target_roles)}")
    if profile.target_industries:
        lines.append(f"Target industries: {', '.join(profile.target_industries)}")
    if profile.work_types:
        lines.append(f"Work types: {', '.join(profile.work_types)}")

    if profile.skills.core:
        lines.append("")
        lines.append(f"Core skills: {', '.join(profile.skills.core)}")
    if profile.skills.growing:
        lines.append(f"Growing in: {', '.join(profile.skills.growing)}")
    if profile.skills.certifications:
        lines.append(f"Certifications: {', '.join(profile.skills.certifications)}")

    # Compensation (only if user has set a target)
    comp = profile.compensation
    if comp.fte_target > 0 or comp.contract_target_hourly > 0:
        lines.append("")
        if comp.fte_target > 0:
            lines.append(f"Target FTE: {comp.fte_target:,} {comp.currency}/year")
        if comp.contract_target_hourly > 0:
            lines.append(f"Target contract: {comp.contract_target_hourly} {comp.currency}/hour")

    # Preferences
    prefs = profile.preferences
    remote = [k for k, v in [("remote", prefs.remote), ("hybrid", prefs.hybrid), ("onsite", prefs.onsite)] if v]
    if remote:
        lines.append(f"Work mode: {', '.join(remote)}")
    if prefs.willing_to_relocate:
        lines.append("Open to relocation")
    if prefs.notice_period:
        lines.append(f"Notice period: {prefs.notice_period}")

    return "\n".join(lines)


def render_profile_for_prompt(profile: Profile) -> str:
    """Long-form profile rendering — used as the system-prompt context
    for AI tools. Includes full work history with highlights.
    """
    parts = [render_profile_summary(profile)]

    if profile.work_history:
        parts.append("")
        parts.append("WORK HISTORY")
        parts.append("-" * 40)
        for entry in profile.work_history:
            header = f"  {entry.title} @ {entry.company}"
            if entry.start or entry.end:
                header += f"  ({entry.start or '?'} – {entry.end or '?'})"
            parts.append(header)
            for h in entry.highlights:
                parts.append(f"    • {h}")
            if entry.tech:
                parts.append(f"    Tools/Methods: {', '.join(entry.tech)}")

    if profile.education:
        parts.append("")
        parts.append("EDUCATION")
        parts.append("-" * 40)
        for ed in profile.education:
            year = f" ({ed.year})" if ed.year else ""
            parts.append(f"  {ed.credential} — {ed.school}{year}")

    if profile.stories_seed:
        parts.append("")
        parts.append("STORY SEEDS (use these to build STAR stories)")
        parts.append("-" * 40)
        for s in profile.stories_seed:
            parts.append(f"  • {s}")

    if profile.identity.contact.email:
        parts.append("")
        parts.append(f"Contact: {profile.identity.contact.email}")
        if profile.identity.contact.linkedin:
            parts.append(f"LinkedIn: {profile.identity.contact.linkedin}")

    return "\n".join(parts)


# --- Completeness scoring (for onboarding wizard) ---

def profile_completeness(profile: Profile) -> float:
    """Return a 0.0-1.0 score of how complete the profile is.

    Used to drive the onboarding wizard: which sections to nudge
    the user to fill in next.
    """
    weights = [
        ("identity.name", _is_present(profile.identity.name), 1.0),
        ("identity.location", _is_present(profile.identity.location), 0.5),
        ("identity.work_authorization", _is_present(profile.identity.work_authorization), 0.5),
        ("career.current_title", _is_present(profile.career.current_title), 1.0),
        ("career.years_experience", profile.career.years_experience > 0, 0.5),
        ("career.level", _is_present(profile.career.level), 0.5),
        ("career.industry", _is_present(profile.career.industry), 0.3),
        ("target_roles", len(profile.target_roles) > 0, 1.0),
        ("work_types", len(profile.work_types) > 0, 0.3),
        ("skills.core", len(profile.skills.core) >= 1, 1.0),
        ("skills.core.3+", len(profile.skills.core) >= 3, 0.5),
        ("skills.certifications", len(profile.skills.certifications) >= 1, 0.3),
        ("compensation.fte_target", profile.compensation.fte_target > 0, 0.5),
        ("work_history.1+", len(profile.work_history) >= 1, 1.0),
        ("work_history.2+", len(profile.work_history) >= 2, 0.5),
        ("work_history.with_highlights",
         any(h.highlights for h in profile.work_history), 0.5),
        ("education", len(profile.education) >= 1, 0.3),
        ("preferences.remote/hybrid/onsite",
         profile.preferences.remote or profile.preferences.hybrid or profile.preferences.onsite, 0.3),
        ("agent.backend", profile.agent.backend != "offline", 0.5),
    ]
    total_weight = sum(w for _, _, w in weights)
    earned = sum(w for _, ok, w in weights if ok)
    return earned / total_weight if total_weight else 0.0


def _is_present(s: str) -> bool:
    return bool(s and s.strip())
