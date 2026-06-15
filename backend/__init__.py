"""Interview Prep Portal — Universal backend.

A FastAPI server + agent-agnostic dispatcher that powers the React portal
and exposes the same tools over MCP. Replaces the previous Hermes-only
plugin shim.

Layers:
    profile    — load/validate/save ~/.interview-prep-portal/profile.yaml
    agents     — pluggable LLM backends (hermes / claude / codex / http / offline)
    prompts    — pure prompt builders (no I/O)
    tools      — pure tool implementations (call prompts + agents)
    server     — FastAPI REST endpoints
    mcp_server — MCP server exposing the same tools
"""

__version__ = "1.4.0"
