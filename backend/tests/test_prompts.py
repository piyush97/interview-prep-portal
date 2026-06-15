"""Tests for tool prompt builders.

Each prompt function takes a Profile and tool-specific args,
returns (system, user) tuple. Pure functions — no I/O, no agent.
"""
from __future__ import annotations

from backend.profile import empty_profile, profile_from_dict
from backend.prompts import (
    evaluate_jd_prompts,
    cover_letter_prompts,
    research_company_prompts,
    scan_jobs_prompts,
    interview_stories_prompts,
    negotiation_script_prompts,
    STORY_FOCUS_DESC,
)


def _nurse_profile():
    return profile_from_dict({
        "identity": {"name": "Bob Smith"},
        "career": {"current_title": "ICU Nurse", "years_experience": 8, "level": "Senior"},
        "target_roles": ["Nurse Practitioner"],
        "skills": {"core": ["ACLS", "Patient Assessment"]},
    })


class TestEvaluateJD:
    def test_returns_system_user_tuple(self):
        s, u = evaluate_jd_prompts(empty_profile(), "We need a software engineer")
        assert isinstance(s, str) and isinstance(u, str)

    def test_uses_profile_in_system_prompt(self):
        s, _ = evaluate_jd_prompts(_nurse_profile(), "Looking for a nurse")
        assert "Bob Smith" in s
        assert "ICU Nurse" in s

    def test_user_prompt_contains_jd(self):
        _, u = evaluate_jd_prompts(empty_profile(), "Senior ICU Nurse position at Acme")
        assert "Senior ICU Nurse position at Acme" in u

    def test_output_format_instructed(self):
        s, _ = evaluate_jd_prompts(empty_profile(), "...")
        assert "ROLE SUMMARY" in s
        assert "CV MATCH" in s
        assert "VERDICT" in s

    def test_no_piyush_leakage(self):
        s, _ = evaluate_jd_prompts(empty_profile(), "...")
        assert "Piyush" not in s
        assert "TypeScript" not in s


class TestCoverLetter:
    def test_basic(self):
        s, u = cover_letter_prompts(empty_profile(), "Acme Corp", "Nurse Practitioner")
        assert "Acme Corp" in u
        assert "Nurse Practitioner" in u

    def test_angles(self):
        for angle in ("why_them", "why_me", "impact", "mission"):
            _, u = cover_letter_prompts(empty_profile(), "X", "Y", angle=angle)
            assert "X" in u and "Y" in u

    def test_includes_jd_text(self):
        _, u = cover_letter_prompts(empty_profile(), "X", "Y", jd_text="Looking for an ICU nurse")
        assert "Looking for an ICU nurse" in u

    def test_unknown_angle_does_not_crash(self):
        _, u = cover_letter_prompts(empty_profile(), "X", "Y", angle="foo")
        assert "X" in u  # just doesn't get the angle flavor


class TestResearchCompany:
    def test_basic(self):
        s, u = research_company_prompts(empty_profile(), "Anthropic")
        assert "Anthropic" in u
        assert "COMPANY OVERVIEW" in u
        assert "INTERVIEW PROCESS" in u

    def test_with_role(self):
        _, u = research_company_prompts(empty_profile(), "Acme", role="Staff Engineer")
        assert "Staff Engineer" in u
        assert "Acme" in u

    def test_profile_in_system(self):
        s, _ = research_company_prompts(_nurse_profile(), "Acme")
        assert "Bob Smith" in s
        assert "ICU Nurse" in s


class TestScanJobs:
    def test_basic(self):
        _, u = scan_jobs_prompts(empty_profile(), "ICU Nurse", "Toronto", 5)
        assert "ICU Nurse" in u
        assert "Toronto" in u
        assert "5" in u


class TestInterviewStories:
    def test_all_focuses_defined(self):
        for focus in ["leadership", "conflict", "failure", "innovation",
                      "collaboration", "technical", "growth", "all"]:
            assert focus in STORY_FOCUS_DESC

    def test_uses_story_seeds(self):
        p = _nurse_profile()
        p = p.model_copy(update={"stories_seed": ["Handled code blue solo"]})
        s, _ = interview_stories_prompts(p, "all")
        assert "Handled code blue solo" in s

    def test_focus_in_user_prompt(self):
        _, u = interview_stories_prompts(empty_profile(), "leadership")
        assert "leading" in u.lower()

    def test_star_r_format_in_system(self):
        s, _ = interview_stories_prompts(empty_profile(), "all")
        for section in ["Situation", "Task", "Action", "Result", "Reflection"]:
            assert section in s


class TestNegotiation:
    def test_c2c_engagement(self):
        _, u = negotiation_script_prompts(_nurse_profile(), "Offer: $80k", c2c=True)
        assert "C2C" in u

    def test_fte_engagement(self):
        _, u = negotiation_script_prompts(_nurse_profile(), "Offer: $80k", c2c=False)
        assert "full-time" in u.lower()

    def test_includes_compensation_targets(self):
        p = _nurse_profile()
        p = p.model_copy(update={
            "compensation": p.compensation.model_copy(update={"fte_target": 110000})
        })
        s, _ = negotiation_script_prompts(p, "Offer: $80k")
        assert "110,000" in s or "110000" in s

    def test_anchor_strategy_in_system(self):
        s, _ = negotiation_script_prompts(empty_profile(), "Offer: $50/hr")
        assert "ANCHOR" in s
        assert "WALK-AWAY" in s
