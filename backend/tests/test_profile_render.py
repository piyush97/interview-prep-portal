"""Tests for profile rendering — turn a Profile into a prompt-friendly summary."""
from __future__ import annotations

from backend.profile import (
    Profile,
    profile_from_dict,
    empty_profile,
)
from backend.profile_render import (
    render_profile_for_prompt,
    render_profile_summary,
    profile_completeness,
)


class TestRenderProfileSummary:
    def test_empty_profile_renders_to_candidate_block(self):
        s = render_profile_summary(empty_profile())
        # Should be a "candidate profile" block but mostly empty/placeholder
        assert "CANDIDATE PROFILE" in s
        assert "(not provided)" in s or "Name:" in s

    def test_nurse_profile_renders_correctly(self):
        p = profile_from_dict({
            "identity": {"name": "Bob Smith", "location": "Toronto"},
            "career": {"current_title": "ICU Nurse", "years_experience": 8, "level": "Senior", "industry": "Healthcare"},
            "target_roles": ["Nurse Practitioner"],
            "skills": {"core": ["ACLS", "BLS", "Patient Assessment"], "certifications": ["RN", "CCRN"]},
            "work_history": [{
                "company": "St. Michael's", "title": "ICU Nurse",
                "start": "2018", "end": "present",
                "highlights": ["Led ICU during COVID surge, team of 8"]
            }],
        })
        s = render_profile_summary(p)
        assert "Bob Smith" in s
        assert "ICU Nurse" in s
        assert "8" in s
        assert "Senior" in s
        assert "Toronto" in s
        assert "ACLS" in s
        assert "Nurse Practitioner" in s
        # NO mention of "Piyush" or "software engineer"
        assert "Piyush" not in s
        assert "Software Engineer" not in s
        assert "TypeScript" not in s

    def test_software_engineer_profile_renders_correctly(self):
        p = profile_from_dict({
            "identity": {"name": "Dev Person"},
            "career": {"current_title": "Software Engineer", "years_experience": 5, "level": "Mid"},
            "skills": {"core": ["TypeScript", "Python", "React"]},
        })
        s = render_profile_summary(p)
        assert "Dev Person" in s
        assert "TypeScript" in s
        assert "Python" in s

    def test_includes_compensation_when_set(self):
        p = profile_from_dict({
            "identity": {"name": "X"},
            "compensation": {"currency": "USD", "fte_target": 120000},
        })
        s = render_profile_summary(p)
        assert "USD" in s
        assert "120,000" in s or "120000" in s

    def test_omits_compensation_when_zero(self):
        p = profile_from_dict({"identity": {"name": "X"}})
        s = render_profile_summary(p)
        # Should not show "$0" or "0/year"
        assert "$0" not in s
        assert "0/year" not in s


class TestProfileCompleteness:
    def test_empty_profile_is_incomplete(self):
        score = profile_completeness(empty_profile())
        assert score < 0.3

    def test_fully_filled_profile_is_complete(self):
        p = profile_from_dict({
            "identity": {"name": "X", "location": "Toronto", "work_authorization": "PR"},
            "career": {"current_title": "Y", "years_experience": 5, "level": "Senior", "industry": "Z"},
            "target_roles": ["A", "B"],
            "target_industries": ["Healthcare"],
            "work_types": ["FTE"],
            "skills": {"core": ["a", "b", "c"], "growing": ["d"], "certifications": ["e"]},
            "compensation": {"currency": "CAD", "fte_target": 100000, "contract_target_hourly": 50, "negotiable": True},
            "work_history": [
                {"company": "A", "title": "B", "start": "2020", "end": "present", "highlights": ["x"], "tech": ["y"]},
                {"company": "C", "title": "D", "start": "2018", "end": "2020", "highlights": ["y"], "tech": ["z"]},
            ],
            "education": [{"school": "U", "credential": "BSc", "year": 2018}],
            "preferences": {"remote": True, "hybrid": True, "onsite": False, "willing_to_relocate": True, "notice_period": "2 weeks"},
            "agent": {"backend": "claude", "model": "sonnet", "max_tokens": 4000, "temperature": 0.7},
        })
        score = profile_completeness(p)
        assert score > 0.9

    def test_partial_profile_is_somewhere_in_middle(self):
        p = profile_from_dict({
            "identity": {"name": "X"},
            "career": {"current_title": "Engineer"},
            "skills": {"core": ["Python"]},
        })
        score = profile_completeness(p)
        assert 0.2 < score < 0.7


class TestRenderForPrompt:
    def test_returns_markdown_string(self):
        s = render_profile_for_prompt(empty_profile())
        assert isinstance(s, str)
        # The "for prompt" version should be a labeled block ready to inject
        assert "CANDIDATE PROFILE" in s or "Candidate:" in s

    def test_includes_work_history_with_highlights(self):
        p = profile_from_dict({
            "identity": {"name": "Nurse Bob"},
            "work_history": [{
                "company": "St. Mike's", "title": "ICU Nurse",
                "start": "2018", "end": "present",
                "highlights": ["Reduced infections 40% via checklist"]
            }],
        })
        s = render_profile_for_prompt(p)
        assert "St. Mike's" in s
        assert "Reduced infections 40%" in s
