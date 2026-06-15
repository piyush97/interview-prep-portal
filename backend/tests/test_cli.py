"""Tests for the prep CLI."""
from __future__ import annotations

import io
import json
import os
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

from backend.cli import main


@pytest.fixture
def profile_file(tmp_path, monkeypatch):
    p = tmp_path / "profile.yaml"
    monkeypatch.setenv("PREP_PROFILE_PATH", str(p))
    return p


# --- version ---

class TestVersion:
    def test_prints_version(self, capsys, profile_file):
        code = main(["version"])
        assert code == 0
        out = capsys.readouterr().out
        assert "interview-prep-portal" in out
        assert "1.4.0" in out
        assert "hermes" in out
        assert "claude" in out


# --- profile show ---

class TestProfileShow:
    def test_shows_empty_profile(self, capsys, profile_file):
        code = main(["profile", "show"])
        assert code == 0
        out = capsys.readouterr().out
        assert "CANDIDATE PROFILE" in out
        assert "Profile completeness" in out

    def test_shows_loaded_profile(self, capsys, profile_file):
        from backend.profile import profile_from_dict, save_profile
        save_profile(profile_from_dict({
            "identity": {"name": "Alice"},
            "career": {"current_title": "Nurse", "years_experience": 5, "level": "Senior"},
        }))
        code = main(["profile", "show"])
        out = capsys.readouterr().out
        assert "Alice" in out
        assert "Nurse" in out

    def test_json_flag_prints_yaml(self, capsys, profile_file):
        from backend.profile import profile_from_dict, save_profile
        save_profile(profile_from_dict({"identity": {"name": "Alice"}}))
        code = main(["profile", "show", "--json"])
        out = capsys.readouterr().out
        assert "identity" in out
        assert "Alice" in out


# --- profile validate ---

class TestProfileValidate:
    def test_valid_profile(self, capsys, profile_file):
        from backend.profile import profile_from_dict, save_profile
        save_profile(profile_from_dict({
            "identity": {"name": "X"},
            "career": {"current_title": "Y"},
        }))
        code = main(["profile", "validate"])
        out = capsys.readouterr().out
        assert "✓" in out
        assert code == 0

    def test_empty_profile_is_valid(self, capsys, profile_file):
        # No file at all — load returns empty, which IS valid
        code = main(["profile", "validate"])
        out = capsys.readouterr().out
        assert "✓" in out
        assert code == 0


# --- profile path ---

class TestProfilePath:
    def test_prints_path(self, capsys, profile_file):
        code = main(["profile", "path"])
        out = capsys.readouterr().out.strip()
        assert out == str(profile_file)


# --- profile init ---

class TestProfileInit:
    def test_init_from_yaml(self, profile_file, capsys, tmp_path):
        src = tmp_path / "source.yaml"
        src.write_text("identity:\n  name: Bob\ncareer:\n  current_title: Nurse\n")
        code = main(["profile", "init", "--from", str(src)])
        out = capsys.readouterr().out
        assert code == 0
        assert "saved" in out.lower()
        assert profile_file.exists()
        # Verify content
        import yaml
        data = yaml.safe_load(profile_file.read_text())
        assert data["identity"]["name"] == "Bob"

    def test_init_requires_args(self, profile_file, capsys):
        code = main(["profile", "init"])
        assert code == 2

    def test_init_refuses_overwrite_without_force(self, profile_file, capsys, tmp_path):
        from backend.profile import profile_from_dict, save_profile
        save_profile(profile_from_dict({"identity": {"name": "Existing"}}))
        src = tmp_path / "new.yaml"
        src.write_text("identity:\n  name: New\n")
        code = main(["profile", "init", "--from", str(src)])
        out = capsys.readouterr().out
        assert code == 1
        assert "already exists" in out.lower()

    def test_init_with_force(self, profile_file, capsys, tmp_path):
        from backend.profile import profile_from_dict, save_profile
        save_profile(profile_from_dict({"identity": {"name": "Existing"}}))
        src = tmp_path / "new.yaml"
        src.write_text("identity:\n  name: Forced\n")
        code = main(["profile", "init", "--from", str(src), "--force"])
        out = capsys.readouterr().out
        assert code == 0
        import yaml
        data = yaml.safe_load(profile_file.read_text())
        assert data["identity"]["name"] == "Forced"


# --- agent test ---

class TestAgentTest:
    def test_auto_detect(self, capsys, profile_file, monkeypatch):
        from backend.agents import OfflineBackend
        monkeypatch.setattr("backend.cli.detect_available_backend", lambda: OfflineBackend())
        code = main(["agent", "test"])
        out = capsys.readouterr().out
        assert code == 0
        assert "offline" in out.lower()
        assert "offline" in out  # the offline response mentions it

    def test_specific_backend_offline(self, capsys, profile_file):
        code = main(["agent", "test", "--backend", "offline"])
        out = capsys.readouterr().out
        assert code == 0
        assert "offline" in out.lower()

    def test_unknown_backend_via_argparse(self, capsys, profile_file):
        # argparse rejects unknown choices at the parse step (SystemExit 2)
        with pytest.raises(SystemExit):
            main(["agent", "test", "--backend", "gpt-9000"])


# --- server status (no real server) ---

class TestServeStatus:
    def test_status_when_not_running(self, capsys, profile_file, monkeypatch):
        # Make urlopen fail
        def fake_urlopen(*args, **kwargs):
            raise ConnectionError("refused")
        monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
        code = main(["serve", "status"])
        out = capsys.readouterr().out
        assert code == 1
        assert "not running" in out.lower()
