"""Tests for the profile system.

Big Mick YELLOW + v1.4.0 "Universal" — replaces the hardcoded
"Piyush" with a user-editable profile.yaml. No defaults are
shipped; the user fills in their own.
"""
from __future__ import annotations

import os
from pathlib import Path

import pytest

from backend.profile import (
    Profile,
    empty_profile,
    load_profile,
    save_profile,
    profile_exists,
    ensure_profile_dir,
    profile_path,
    validate_profile,
    profile_from_dict,
    profile_to_yaml,
)


# --- empty_profile ---

class TestEmptyProfile:
    def test_returns_valid_profile(self):
        p = empty_profile()
        assert isinstance(p, Profile)
        assert p.schema_version == 1
        assert p.identity.name == ""
        assert p.career.years_experience == 0
        assert p.career.level == ""
        assert p.target_roles == []
        assert p.skills.core == []
        assert p.compensation.fte_target == 0
        assert p.work_history == []
        assert p.agent.backend == "offline"  # safe default

    def test_empty_profile_passes_validation(self):
        p = empty_profile()
        # No Piyush defaults — empty profile must validate
        errors = validate_profile(p)
        assert errors == []


# --- profile_from_dict / profile_to_yaml round-trip ---

class TestRoundTrip:
    def test_minimal_dict(self):
        data = {"identity": {"name": "Alice"}}
        p = profile_from_dict(data)
        assert p.identity.name == "Alice"
        assert p.identity.pronouns == ""

    def test_full_dict_round_trip(self):
        data = {
            "schema_version": 1,
            "identity": {
                "name": "Bob Smith",
                "pronouns": "he/him",
                "location": "Toronto, ON",
                "work_authorization": "Canadian PR",
                "contact": {
                    "email": "bob@example.com",
                    "phone": "+1-555-0100",
                    "linkedin": "linkedin.com/in/bobsmith",
                    "portfolio": "bobsmith.dev",
                },
            },
            "career": {
                "current_title": "ICU Nurse",
                "years_experience": 8,
                "level": "Senior",
                "industry": "Healthcare",
            },
            "target_roles": ["Nurse Practitioner", "Charge Nurse"],
            "target_industries": ["Healthcare", "Public Health"],
            "work_types": ["FTE"],
            "skills": {
                "core": ["ACLS", "BLS", "Patient Assessment", "Ventilator Management"],
                "growing": ["Spanish (clinical)", "Epic"],
                "certifications": ["RN", "CCRN"],
            },
            "compensation": {
                "currency": "CAD",
                "fte_target": 95000,
                "contract_target_hourly": 0,
                "negotiable": True,
            },
            "work_history": [
                {
                    "company": "St. Michael's Hospital",
                    "title": "ICU Nurse",
                    "start": "2018-06",
                    "end": "present",
                    "highlights": [
                        "Led 12-bed ICU during COVID surge, team of 8",
                        "Reduced central line infections 40% via checklist protocol",
                    ],
                    "tech": ["Epic", " Philips ICU Monitors"],
                }
            ],
            "education": [
                {"school": "U of T", "credential": "BScN", "year": 2017}
            ],
            "preferences": {
                "remote": False,
                "hybrid": False,
                "onsite": True,
                "willing_to_relocate": False,
                "visa_sponsorship_needed": False,
                "notice_period": "1 month",
            },
            "stories_seed": [
                "Handled a code blue solo on night shift with positive outcome",
            ],
            "agent": {
                "backend": "claude",
                "model": "claude-sonnet-4-6",
                "max_tokens": 4000,
                "temperature": 0.7,
            },
        }
        p = profile_from_dict(data)
        yaml_str = profile_to_yaml(p)
        p2 = profile_from_dict(__import__("yaml").safe_load(yaml_str))
        assert p2.identity.name == "Bob Smith"
        assert p2.career.current_title == "ICU Nurse"
        assert p2.career.years_experience == 8
        assert p2.skills.core == ["ACLS", "BLS", "Patient Assessment", "Ventilator Management"]
        assert p2.work_history[0].company == "St. Michael's Hospital"
        assert p2.work_history[0].highlights[0].startswith("Led 12-bed ICU")
        assert p2.compensation.fte_target == 95000
        assert p2.agent.backend == "claude"

    def test_software_engineer_profile(self):
        """Piyush is just a user like anyone else. Make sure a SE profile works."""
        data = {
            "identity": {"name": "Dev Person"},
            "career": {"current_title": "Software Engineer", "years_experience": 5, "level": "Mid"},
            "target_roles": ["Senior Software Engineer"],
            "skills": {"core": ["TypeScript", "Python", "React"]},
        }
        p = profile_from_dict(data)
        assert p.identity.name == "Dev Person"
        assert p.skills.core == ["TypeScript", "Python", "React"]


# --- Validation ---

class TestValidation:
    def test_invalid_level_rejected(self):
        data = {
            "identity": {"name": "X"},
            "career": {"level": "Wizard"},  # not in the enum
        }
        # Pydantic should raise on construction
        with pytest.raises(Exception) as exc:
            profile_from_dict(data)
        assert "level" in str(exc.value).lower() or "wizard" in str(exc.value).lower()

    def test_negative_years_rejected(self):
        data = {
            "identity": {"name": "X"},
            "career": {"years_experience": -5},
        }
        with pytest.raises(Exception) as exc:
            profile_from_dict(data)
        assert "years" in str(exc.value).lower()

    def test_empty_profile_has_no_errors(self):
        assert validate_profile(empty_profile()) == []

    def test_invalid_backend_rejected(self):
        data = {
            "identity": {"name": "X"},
            "agent": {"backend": "gpt-9000"},  # not in enum
        }
        with pytest.raises(Exception) as exc:
            profile_from_dict(data)
        assert "backend" in str(exc.value).lower()


# --- File I/O ---

class TestFileIO:
    def test_profile_path_default(self, tmp_path, monkeypatch):
        monkeypatch.setenv("HOME", str(tmp_path))
        monkeypatch.delenv("PREP_PROFILE_PATH", raising=False)
        path = profile_path()
        assert path == tmp_path / ".interview-prep-portal" / "profile.yaml"

    def test_profile_path_env_override(self, tmp_path, monkeypatch):
        custom = tmp_path / "my-profile.yaml"
        monkeypatch.setenv("PREP_PROFILE_PATH", str(custom))
        assert profile_path() == custom

    def test_ensure_profile_dir_creates_dir(self, tmp_path, monkeypatch):
        monkeypatch.setenv("HOME", str(tmp_path))
        monkeypatch.delenv("PREP_PROFILE_PATH", raising=False)
        ensure_profile_dir()
        assert (tmp_path / ".interview-prep-portal").is_dir()

    def test_save_and_load_round_trip(self, tmp_path, monkeypatch):
        custom = tmp_path / "profile.yaml"
        monkeypatch.setenv("PREP_PROFILE_PATH", str(custom))

        p = profile_from_dict({
            "identity": {"name": "Carol"},
            "career": {"current_title": "Teacher", "years_experience": 3, "level": "Mid"},
        })
        save_profile(p)
        assert custom.exists()

        loaded = load_profile()
        assert loaded.identity.name == "Carol"
        assert loaded.career.current_title == "Teacher"

    def test_load_returns_empty_when_missing(self, tmp_path, monkeypatch):
        custom = tmp_path / "nope.yaml"
        monkeypatch.setenv("PREP_PROFILE_PATH", str(custom))
        # No save first — load should return empty profile, not crash
        p = load_profile()
        assert p.identity.name == ""
        assert p.agent.backend == "offline"

    def test_profile_exists_true_after_save(self, tmp_path, monkeypatch):
        custom = tmp_path / "profile.yaml"
        monkeypatch.setenv("PREP_PROFILE_PATH", str(custom))
        assert profile_exists() is False
        save_profile(empty_profile())
        assert profile_exists() is True

    def test_save_creates_parent_dir(self, tmp_path, monkeypatch):
        custom = tmp_path / "deep" / "nested" / "profile.yaml"
        monkeypatch.setenv("PREP_PROFILE_PATH", str(custom))
        save_profile(empty_profile())
        assert custom.exists()

    def test_load_invalid_yaml_returns_empty(self, tmp_path, monkeypatch):
        custom = tmp_path / "broken.yaml"
        monkeypatch.setenv("PREP_PROFILE_PATH", str(custom))
        custom.write_text("this is: : not valid yaml: [")
        # Should not crash — returns empty profile and logs warning
        p = load_profile()
        assert p.identity.name == ""


# --- Privacy / no-defaults guarantee ---

class TestNoHardcodedDefaults:
    """The whole point of v1.4.0: no Piyush defaults.

    If anyone re-introduces them, this test fails.
    """

    def test_empty_profile_has_no_piyush(self):
        p = empty_profile()
        assert "Piyush" not in p.identity.name
        assert "Software Engineer" not in p.career.current_title
        assert "Tundra" not in [wh.company for wh in p.work_history]
        assert "OPG" not in str(p.work_history)
        assert "TypeScript" not in p.skills.core  # no eng defaults
        assert p.identity.name == ""

    def test_no_piyush_in_yaml_output(self):
        yaml_str = profile_to_yaml(empty_profile())
        assert "Piyush" not in yaml_str
        assert "Mehta" not in yaml_str
