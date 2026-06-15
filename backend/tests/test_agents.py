"""Tests for the agent dispatcher — agent-agnostic LLM calls.

The dispatcher supports: hermes, claude, codex, http, offline.
Each backend implements AgentBackend.call(system, user, model, max_tokens).
"""
from __future__ import annotations

import json
import subprocess
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

from backend.agents import (
    AgentResponse,
    BackendError,
    detect_available_backend,
    get_backend,
    OfflineBackend,
    HermesBackend,
    ClaudeBackend,
    CodexBackend,
    HTTPBackend,
    list_backends,
)


# --- AgentResponse dataclass ---

class TestAgentResponse:
    def test_construction(self):
        r = AgentResponse(
            text="hello",
            model="claude-sonnet-4-6",
            tokens_in=10,
            tokens_out=20,
            duration_ms=500,
            raw={"foo": "bar"},
        )
        assert r.text == "hello"
        assert r.model == "claude-sonnet-4-6"
        assert r.tokens_in == 10
        assert r.tokens_out == 20
        assert r.duration_ms == 500


# --- OfflineBackend ---

class TestOfflineBackend:
    def test_returns_placeholder_text(self):
        b = OfflineBackend()
        r = b.call("You are a coach.", "Help me", model=None)
        assert "offline" in r.text.lower() or "ai" in r.text.lower()
        assert r.model == "offline"

    def test_includes_user_input_echo(self):
        b = OfflineBackend()
        r = b.call("system", "Evaluate this JD: Software Engineer at Acme", model=None)
        assert "Evaluate this JD" in r.text or "Software Engineer" in r.text

    def test_does_not_shell_out(self):
        b = OfflineBackend()
        with patch("subprocess.run") as mock_run:
            b.call("system", "user", model=None)
            mock_run.assert_not_called()


# --- HermesBackend ---

class TestHermesBackend:
    def test_invokes_hermes_chat_q(self):
        b = HermesBackend()
        mock_result = MagicMock()
        mock_result.stdout = "the answer"
        mock_result.returncode = 0
        mock_result.stderr = ""
        with patch("subprocess.run", return_value=mock_result) as mock_run:
            r = b.call("system prompt", "user prompt", model="deepseek/deepseek-v4-flash")
        # Verify the call shape
        assert mock_run.called
        cmd = mock_run.call_args[0][0]
        assert cmd[0] == "hermes"
        assert cmd[1] == "chat"
        assert "-q" in cmd
        assert "-m" in cmd
        assert "deepseek/deepseek-v4-flash" in cmd
        assert "-Q" in cmd  # quiet mode
        # The prompt should be merged into one string
        merged = next(a for a in cmd if "system" in a)
        assert "system prompt" in merged
        assert "user prompt" in merged
        assert r.text == "the answer"
        assert r.model == "deepseek/deepseek-v4-flash"

    def test_raises_backend_error_on_failure(self):
        b = HermesBackend()
        mock_result = MagicMock()
        mock_result.stdout = ""
        mock_result.returncode = 1
        mock_result.stderr = "auth failed"
        with patch("subprocess.run", return_value=mock_result):
            with pytest.raises(BackendError) as exc:
                b.call("system", "user", model="x")
        assert "auth failed" in str(exc.value)

    def test_uses_hermes_run_FIX_BUG(self):
        """Regression: the old plugin used `hermes run` which doesn't exist.
        Confirm we use `hermes chat -q`."""
        b = HermesBackend()
        mock_result = MagicMock(stdout="ok", returncode=0, stderr="")
        with patch("subprocess.run", return_value=mock_result) as mock_run:
            b.call("s", "u", model="m")
        cmd = mock_run.call_args[0][0]
        assert "run" not in cmd
        assert "chat" in cmd
        assert "-q" in cmd


# --- ClaudeBackend ---

class TestClaudeBackend:
    def test_invokes_claude_print_with_json(self):
        b = ClaudeBackend()
        mock_result = MagicMock()
        mock_result.stdout = json.dumps({
            "result": "the answer",
            "model": "claude-sonnet-4-6",
            "duration_ms": 1234,
            "session_id": "abc",
        })
        mock_result.returncode = 0
        mock_result.stderr = ""
        with patch("subprocess.run", return_value=mock_result) as mock_run:
            r = b.call("system", "user", model="claude-sonnet-4-6")
        cmd = mock_run.call_args[0][0]
        assert cmd[0] == "claude"
        assert "-p" in cmd
        assert "user" in " ".join(cmd)  # the user prompt is in the command
        assert "--append-system-prompt" in cmd
        assert "claude-sonnet-4-6" in cmd
        assert "--output-format" in cmd
        assert "json" in cmd
        assert r.text == "the answer"
        assert r.model == "claude-sonnet-4-6"
        assert r.duration_ms == 1234

    def test_falls_back_to_text_if_no_json_field(self):
        b = ClaudeBackend()
        mock_result = MagicMock()
        # Plain text response (no JSON wrapping)
        mock_result.stdout = "plain text response"
        mock_result.returncode = 0
        mock_result.stderr = ""
        with patch("subprocess.run", return_value=mock_result):
            r = b.call("system", "user", model="claude-sonnet-4-6")
        assert r.text == "plain text response"

    def test_raises_on_failure(self):
        b = ClaudeBackend()
        mock_result = MagicMock(stdout="", returncode=1, stderr="error")
        with patch("subprocess.run", return_value=mock_result):
            with pytest.raises(BackendError):
                b.call("s", "u", model="m")


# --- CodexBackend ---

class TestCodexBackend:
    def test_invokes_codex_exec_with_json(self):
        b = CodexBackend()
        # Codex --json emits JSONL — last line is the final message
        jsonl = "\n".join([
            json.dumps({"type": "thread.started"}),
            json.dumps({"type": "item.completed", "text": "the answer"}),
            json.dumps({"type": "turn.completed"}),
        ])
        mock_result = MagicMock()
        mock_result.stdout = jsonl
        mock_result.returncode = 0
        mock_result.stderr = ""
        with patch("subprocess.run", return_value=mock_result) as mock_run:
            r = b.call("system", "user", model="gpt-5-codex")
        cmd = mock_run.call_args[0][0]
        assert cmd[0] == "codex"
        assert cmd[1] == "exec"
        assert "--instructions" in cmd
        assert "system" in " ".join(cmd)
        assert "-m" in cmd
        assert "gpt-5-codex" in cmd
        assert "--json" in cmd
        assert r.text == "the answer"
        assert r.model == "gpt-5-codex"

    def test_raises_on_failure(self):
        b = CodexBackend()
        mock_result = MagicMock(stdout="", returncode=1, stderr="auth fail")
        with patch("subprocess.run", return_value=mock_result):
            with pytest.raises(BackendError):
                b.call("s", "u", model="m")


# --- HTTPBackend ---

class TestHTTPBackend:
    def test_posts_to_endpoint(self):
        b = HTTPBackend(endpoint="http://localhost:9000/v1/chat")
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "text": "the answer",
            "model": "llama-3-70b",
            "usage": {"prompt_tokens": 10, "completion_tokens": 20},
        }
        mock_resp.raise_for_status = MagicMock()
        with patch("httpx.post", return_value=mock_resp) as mock_post:
            r = b.call("system", "user", model="llama-3-70b", max_tokens=1000)
        mock_post.assert_called_once()
        url = mock_post.call_args[0][0]
        assert url == "http://localhost:9000/v1/chat"
        body = mock_post.call_args[1]["json"]
        assert body["system"] == "system"
        assert body["user"] == "user"
        assert body["model"] == "llama-3-70b"
        assert body["max_tokens"] == 1000
        assert r.text == "the answer"
        assert r.model == "llama-3-70b"
        assert r.tokens_in == 10
        assert r.tokens_out == 20

    def test_includes_api_key_header(self):
        b = HTTPBackend(endpoint="http://x", api_key="secret-123")
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"text": "ok", "model": "m"}
        mock_resp.raise_for_status = MagicMock()
        with patch("httpx.post", return_value=mock_resp) as mock_post:
            b.call("s", "u", model="m")
        headers = mock_post.call_args[1]["headers"]
        assert headers["Authorization"] == "Bearer secret-123"

    def test_raises_on_http_error(self):
        b = HTTPBackend(endpoint="http://x")
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.text = "internal error"
        # Don't let raise_for_status fire — the production code should
        # check status_code itself and convert to BackendError.
        mock_resp.raise_for_status = MagicMock()
        with patch("httpx.post", return_value=mock_resp):
            with pytest.raises(BackendError) as exc:
                b.call("s", "u", model="m")
        assert "500" in str(exc.value) or "internal error" in str(exc.value)


# --- Factory ---

class TestGetBackend:
    def test_returns_offline_by_name(self):
        b = get_backend("offline")
        assert isinstance(b, OfflineBackend)

    def test_returns_hermes(self):
        b = get_backend("hermes")
        assert isinstance(b, HermesBackend)

    def test_returns_claude(self):
        b = get_backend("claude")
        assert isinstance(b, ClaudeBackend)

    def test_returns_codex(self):
        b = get_backend("codex")
        assert isinstance(b, CodexBackend)

    def test_returns_http(self):
        b = get_backend("http", endpoint="http://x", api_key="k")
        assert isinstance(b, HTTPBackend)
        assert b.endpoint == "http://x"
        assert b.api_key == "k"

    def test_unknown_backend_raises(self):
        with pytest.raises(ValueError):
            get_backend("gpt-9000")


class TestListBackends:
    def test_lists_all(self):
        names = list_backends()
        assert "hermes" in names
        assert "claude" in names
        assert "codex" in names
        assert "http" in names
        assert "offline" in names


class TestDetectAvailableBackend:
    def test_prefers_explicit(self, monkeypatch):
        # Explicit "hermes" wins regardless of what's on PATH
        b = detect_available_backend(prefer="hermes")
        assert b.name == "hermes"

    def test_falls_back_to_offline_when_nothing_available(self, monkeypatch):
        # Mock which/shutil.which to return None for everything
        monkeypatch.setattr("shutil.which", lambda x: None)
        b = detect_available_backend()
        assert b.name == "offline"

    def test_finds_hermes_when_installed(self, monkeypatch):
        monkeypatch.setattr("shutil.which", lambda x: "/usr/bin/hermes" if x == "hermes" else None)
        b = detect_available_backend()
        assert b.name == "hermes"

    def test_finds_claude_when_no_hermes(self, monkeypatch):
        def which(x):
            if x == "claude": return "/usr/bin/claude"
            return None
        monkeypatch.setattr("shutil.which", which)
        b = detect_available_backend()
        assert b.name == "claude"
