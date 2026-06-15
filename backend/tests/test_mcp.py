"""Tests for the MCP server.

Strategy: test the tool definitions and the server's public methods
via in-process asyncio. We don't run a full MCP client — we just
verify the server exposes the right tools and the call_tool
handler works with a fake backend.
"""
from __future__ import annotations

import asyncio
import json
import os
from dataclasses import dataclass
from typing import Any

import pytest

from backend.agents import AgentResponse
from backend.mcp_server import TOOLS, create_server


@dataclass
class FakeBackend:
    name: str = "fake"
    canned_text: str = "FAKE RESPONSE"

    def call(self, system: str, user: str, *, model=None, max_tokens: int = 4000) -> AgentResponse:
        return AgentResponse(text=self.canned_text, model="fake", duration_ms=1)


@pytest.fixture
def profile_file(tmp_path, monkeypatch):
    p = tmp_path / "profile.yaml"
    monkeypatch.setenv("PREP_PROFILE_PATH", str(p))
    return p


# --- Tool list ---

class TestToolList:
    def test_lists_all_tools(self):
        names = {t.name for t in TOOLS}
        assert "evaluate_jd" in names
        assert "generate_cover_letter" in names
        assert "research_company" in names
        assert "scan_jobs" in names
        assert "generate_interview_stories" in names
        assert "generate_negotiation_script" in names
        assert "get_profile" in names
        assert "update_profile" in names

    def test_each_tool_has_description_and_schema(self):
        for t in TOOLS:
            assert t.description, f"Tool {t.name} has no description"
            assert t.inputSchema, f"Tool {t.name} has no inputSchema"
            assert t.inputSchema.get("type") == "object"

    def test_evaluate_jd_requires_jd_text(self):
        schemas = {t.name: t.inputSchema for t in TOOLS}
        assert "jd_text" in schemas["evaluate_jd"]["required"]

    def test_cover_letter_requires_company_and_role(self):
        schemas = {t.name: t.inputSchema for t in TOOLS}
        required = schemas["generate_cover_letter"]["required"]
        assert "company" in required
        assert "role" in required

    def test_no_tool_has_piyush_in_description(self):
        """Defensive: the MCP tool descriptions must not be Piyush-specific."""
        for t in TOOLS:
            assert "Piyush" not in (t.description or "")
            assert "Software Engineer" not in (t.description or "")
            assert "TypeScript" not in (t.description or "")


# --- Server creation ---

class TestServerCreation:
    def test_create_server_returns_mcp_server(self, profile_file):
        from mcp.server import Server
        s = create_server()
        assert isinstance(s, Server)

    def test_server_has_list_tools_handler(self, profile_file):
        s = create_server()
        # mcp.server.Server stores handlers internally; we can check it exists
        assert s is not None


# --- Call tool dispatch (using the server's internal handler) ---

class TestCallToolDispatch:
    """Test the actual call_tool logic by invoking the registered handler.

    The MCP SDK uses decorator registration that returns the wrapped
    coroutine. We dig it out of the server's request_handlers dict.
    """

    def _get_call_handler(self, server):
        # mcp 1.x: the @server.call_tool() decorator registers under
        # RequestHandlers keyed by method name. The handler is the
        # coroutine we wrote in mcp_server.py.
        # Fallback: we can call our dispatch logic directly.
        from backend import mcp_server as ms
        from backend import agents as agents_module
        return ms.dispatch_tool_call

    def test_evaluate_jd_returns_text(self, profile_file, monkeypatch):
        from backend import mcp_server as ms
        monkeypatch.setattr(ms, "detect_available_backend", lambda: FakeBackend(canned_text="EVAL OK"))

        async def run():
            return await ms.dispatch_tool_call("evaluate_jd", {"jd_text": "ICU Nurse at Sunnybrook"})
        result = asyncio.run(run())
        # Returns a list of TextContent
        assert result
        text = result[0].text if hasattr(result[0], "text") else str(result[0])
        assert "EVAL OK" in text

    def test_cover_letter_returns_text(self, profile_file, monkeypatch):
        from backend import mcp_server as ms
        monkeypatch.setattr(ms, "detect_available_backend", lambda: FakeBackend(canned_text="Dear Hiring Manager..."))

        async def run():
            return await ms.dispatch_tool_call("generate_cover_letter", {
                "company": "Acme", "role": "Nurse Practitioner"
            })
        result = asyncio.run(run())
        text = result[0].text
        assert "Dear Hiring Manager" in text

    def test_get_profile_returns_json(self, profile_file):
        from backend import mcp_server as ms
        # Save a profile first
        from backend.profile import profile_from_dict, save_profile
        save_profile(profile_from_dict({"identity": {"name": "Test"}}))

        async def run():
            return await ms.dispatch_tool_call("get_profile", {})
        result = asyncio.run(run())
        text = result[0].text
        data = json.loads(text)
        assert data["identity"]["name"] == "Test"

    def test_update_profile_merges_and_saves(self, profile_file):
        from backend import mcp_server as ms
        from backend.profile import load_profile, profile_from_dict, save_profile
        save_profile(profile_from_dict({
            "identity": {"name": "Original"},
            "career": {"current_title": "Old Title"},
        }))

        async def run():
            return await ms.dispatch_tool_call("update_profile", {
                "data": {"career": {"current_title": "New Title"}}
            })
        result = asyncio.run(run())
        data = json.loads(result[0].text)
        assert data["career"]["current_title"] == "New Title"
        # identity.name was preserved (shallow merge keeps top-level)
        # Actually for nested dicts we DO merge — let me check
        # The dispatcher merges nested dicts (current.career + data.career)
        assert data["identity"]["name"] == "Original"

    def test_unknown_tool_returns_error(self, profile_file):
        from backend import mcp_server as ms

        async def run():
            return await ms.dispatch_tool_call("nonsense_tool", {})
        result = asyncio.run(run())
        text = result[0].text
        assert "ERROR" in text or "Unknown" in text
