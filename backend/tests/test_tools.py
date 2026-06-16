"""Tests for the tool layer.

We use a FakeBackend (no subprocess) to test that the tool layer
correctly wires prompts to the agent and returns the right shape.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from backend.agents import AgentResponse, AgentBackend
from backend.profile import profile_from_dict, empty_profile
from backend.tools import (
    evaluate_jd,
    generate_cover_letter,
    research_company,
    scan_jobs,
    generate_interview_stories,
    generate_negotiation_script,
    score_resume,
)


@dataclass
class FakeBackend:
    """Returns canned text and records the last call."""
    name: str = "fake"
    canned_text: str = "FAKE RESPONSE"
    last_system: str = ""
    last_user: str = ""
    last_model: str = ""
    last_max_tokens: int = 0

    def call(self, system: str, user: str, *, model: str | None = None,
             max_tokens: int = 4000) -> AgentResponse:
        self.last_system = system
        self.last_user = user
        self.last_model = model or ""
        self.last_max_tokens = max_tokens
        return AgentResponse(
            text=self.canned_text,
            model=model or "fake-model",
            tokens_in=10,
            tokens_out=20,
            duration_ms=50,
        )


def _profile():
    return profile_from_dict({
        "identity": {"name": "Bob", "location": "Toronto"},
        "career": {"current_title": "ICU Nurse", "years_experience": 5, "level": "Mid"},
        "target_roles": ["Nurse Practitioner"],
        "skills": {"core": ["ACLS"]},
        "agent": {"backend": "offline", "model": "fake-model", "max_tokens": 2000},
    })


class TestEvaluateJD:
    def test_returns_evaluation_key(self):
        fake = FakeBackend(canned_text="A nice JD eval")
        result = evaluate_jd("Software Engineer at Acme", agent=fake)
        assert result["evaluation"] == "A nice JD eval"
        assert "model" in result
        assert "agent" in result

    def test_passes_jd_to_agent(self):
        fake = FakeBackend()
        evaluate_jd("Looking for a nurse with 5+ years", agent=fake)
        assert "Looking for a nurse" in fake.last_user

    def test_uses_profile_in_system(self):
        fake = FakeBackend()
        p = _profile()
        evaluate_jd("any jd", profile=p, agent=fake)
        assert "Bob" in fake.last_system
        assert "ICU Nurse" in fake.last_system

    def test_honors_profile_model_and_max_tokens(self):
        fake = FakeBackend()
        p = _profile()  # model=fake-model, max_tokens=2000
        evaluate_jd("any jd", profile=p, agent=fake)
        assert fake.last_model == "fake-model"
        assert fake.last_max_tokens == 2000


class TestCoverLetter:
    def test_returns_cover_letter(self):
        fake = FakeBackend(canned_text="Dear Hiring Manager...")
        result = generate_cover_letter("Acme", "Nurse Practitioner", agent=fake)
        assert result["cover_letter"] == "Dear Hiring Manager..."
        assert result["company"] == "Acme"
        assert result["role"] == "Nurse Practitioner"

    def test_passes_args(self):
        fake = FakeBackend()
        generate_cover_letter("Acme Corp", "Staff Nurse", jd_text="ICU experience required", agent=fake)
        assert "Acme Corp" in fake.last_user
        assert "Staff Nurse" in fake.last_user
        assert "ICU experience required" in fake.last_user


class TestResearchCompany:
    def test_returns_research(self):
        fake = FakeBackend(canned_text="Company research here")
        result = research_company("Anthropic", agent=fake)
        assert result["research"] == "Company research here"
        assert "Anthropic" in result["company"] or result["company"] == "Anthropic"


class TestScanJobs:
    def test_returns_listings(self):
        fake = FakeBackend(canned_text="| Title | Company |")
        result = scan_jobs(search_terms="Nurse Practitioner", location="Toronto", agent=fake)
        assert "listings" in result
        assert "Nurse Practitioner" in fake.last_user
        assert "Toronto" in fake.last_user

    def test_falls_back_to_profile_target_roles(self):
        fake = FakeBackend()
        p = _profile()  # target_roles: ["Nurse Practitioner"]
        scan_jobs(profile=p, agent=fake)
        assert "Nurse Practitioner" in fake.last_user

    def test_falls_back_to_profile_location(self):
        fake = FakeBackend()
        p = _profile()  # location: "Toronto"
        scan_jobs(search_terms="Nurse", profile=p, agent=fake)
        assert "Toronto" in fake.last_user


class TestInterviewStories:
    def test_returns_stories(self):
        fake = FakeBackend(canned_text="### Story 1: ...")
        result = generate_interview_stories("leadership", agent=fake)
        assert "stories" in result
        assert result["focus"] == "leadership"


class TestNegotiation:
    def test_returns_script(self):
        fake = FakeBackend(canned_text="ANCHOR STRATEGY: ...")
        result = generate_negotiation_script("Offer: $80k", c2c=True, agent=fake)
        assert "script" in result
        assert result["engagement"] == "C2C contract"

    def test_fte_engagement(self):
        fake = FakeBackend()
        generate_negotiation_script("Offer: $80k", c2c=False, agent=fake)
        # Check the engagement type is in the user prompt
        assert "full-time" in fake.last_user.lower()


class TestScoreResume:
    def test_returns_score_key(self):
        fake = FakeBackend(canned_text="## 1. OVERALL SCORE: 7/10")
        result = score_resume("Experienced SWE with 8 years", agent=fake)
        assert result["score"] == "## 1. OVERALL SCORE: 7/10"
        assert "has_jd" in result
        assert "resume_length" in result
        assert result["resume_length"] == len("Experienced SWE with 8 years")
        assert "model" in result
        assert "tokens_in" in result
        assert "tokens_out" in result
        assert "duration_ms" in result
        assert result["agent"] == "fake"

    def test_passes_resume_to_agent(self):
        fake = FakeBackend()
        score_resume("I am a Python developer with 5 years experience", agent=fake)
        assert "I am a Python developer" in fake.last_user

    def test_passes_jd_when_provided(self):
        fake = FakeBackend()
        score_resume("My resume", jd_text="Looking for a senior backend engineer", agent=fake)
        assert "Looking for a senior backend engineer" in fake.last_user
        assert "My resume" in fake.last_user

    def test_raises_on_empty_resume(self):
        fake = FakeBackend()
        import pytest
        with pytest.raises(ValueError, match="resume_text is required"):
            score_resume("", agent=fake)
        with pytest.raises(ValueError, match="resume_text is required"):
            score_resume("   ", agent=fake)
