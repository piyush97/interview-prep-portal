"""MCP server exposing the same tools as the REST API.

Run with:
    python -m backend.mcp_server          # stdio transport (for Claude Desktop, etc.)
    python -m backend.mcp_server --http   # HTTP/SSE transport (for remote clients)

When the server starts, it loads the user's profile and wires the
agent dispatcher. Any MCP client can then call:
    - evaluate_jd
    - generate_cover_letter
    - research_company
    - scan_jobs
    - generate_interview_stories
    - generate_negotiation_script
    - generate_starter_content
    - get_profile
    - update_profile
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

from . import __version__
from .agents import BackendError, detect_available_backend
from .profile import (
    Profile,
    load_profile,
    profile_to_dict,
    profile_to_yaml,
    save_profile,
)
from .tools import (
    evaluate_jd as tool_evaluate_jd,
    generate_cover_letter as tool_generate_cover_letter,
    generate_interview_stories as tool_generate_interview_stories,
    generate_negotiation_script as tool_generate_negotiation_script,
    generate_starter_content as tool_generate_starter_content,
    research_company as tool_research_company,
    scan_jobs as tool_scan_jobs,
    score_resume as tool_score_resume,
)

logger = logging.getLogger(__name__)


# --- Tool definitions (MCP format) ---

TOOLS: list[Tool] = [
    Tool(
        name="evaluate_jd",
        description=(
            "Evaluate a job description against the candidate's profile. "
            "Returns a structured A-F analysis: role summary, CV match, "
            "level strategy, compensation, personalization hooks, and "
            "interview prep roadmap. Uses the loaded profile — no candidate "
            "name or skills need to be passed in."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "jd_text": {"type": "string", "description": "Full job description text"},
                "url": {"type": "string", "description": "Optional URL of the JD (currently informational only)"},
            },
            "required": ["jd_text"],
        },
    ),
    Tool(
        name="generate_cover_letter",
        description="Generate a tailored cover letter for a company + role.",
        inputSchema={
            "type": "object",
            "properties": {
                "company": {"type": "string", "description": "Company name"},
                "role": {"type": "string", "description": "Job title/role"},
                "jd_text": {"type": "string", "description": "Optional: full JD for keyword matching"},
                "angle": {
                    "type": "string",
                    "enum": ["why_them", "why_me", "impact", "mission"],
                    "description": "Letter angle (default: impact)",
                    "default": "impact",
                },
            },
            "required": ["company", "role"],
        },
    ),
    Tool(
        name="research_company",
        description=(
            "Research a company for an upcoming interview. Returns a "
            "structured brief: overview, products, recent news, culture, "
            "interview process, competitors, talking points."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "company": {"type": "string", "description": "Company name"},
                "role": {"type": "string", "description": "Optional: target role"},
            },
            "required": ["company"],
        },
    ),
    Tool(
        name="scan_jobs",
        description=(
            "Scan job boards for matching roles. Uses the candidate's "
            "target roles and location from the profile by default."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "search_terms": {"type": "string", "description": "Search terms (default: profile.target_roles)"},
                "location": {"type": "string", "description": "Location (default: profile.identity.location)"},
                "max_results": {"type": "integer", "default": 10, "minimum": 1, "maximum": 25},
            },
        },
    ),
    Tool(
        name="generate_interview_stories",
        description=(
            "Generate STAR+Reflection interview stories for the candidate. "
            "Uses the candidate's real work history and 'stories_seed' from profile."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "focus": {
                    "type": "string",
                    "enum": ["leadership", "conflict", "failure", "innovation",
                             "collaboration", "technical", "growth", "all"],
                    "default": "all",
                },
            },
        },
    ),
    Tool(
        name="generate_negotiation_script",
        description=(
            "Generate a salary negotiation script for a specific offer. "
            "Includes anchor strategy, talking points, counter-offer phrasing, "
            "leverage, geographic pushback, equity asks, and walk-away number."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "offer_details": {"type": "string", "description": "Details of the offer"},
                "c2c": {"type": "boolean", "default": False, "description": "C2C/contract role?"},
            },
            "required": ["offer_details"],
        },
    ),
    Tool(
        name="score_resume",
        description=(
            "Score a resume against a job description (or general best-practices "
            "if no JD). Returns a structured ATS scorecard with overall score, "
            "keyword match table, format issues, bullet rewrites, gaps, and "
            "a prioritized action list. Requires resume_text; jd_text is optional."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "resume_text": {"type": "string", "description": "Full resume text to evaluate"},
                "jd_text": {"type": "string", "description": "Optional: job description for keyword matching rubric"},
            },
            "required": ["resume_text"],
        },
    ),
    Tool(
        name="generate_starter_content",
        description=(
            "Generate AI-native learning path and flashcard JSON from the "
            "candidate profile, target role, skill gaps, and optional JD. "
            "Use this to turn the Skills Matrix into personalized prep data."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "target_role": {"type": "string", "description": "Target role for the generated prep data"},
                "skill_gaps": {
                    "type": "array",
                    "description": "Skill gap objects with name/category/current/target/priority",
                    "items": {"type": "object"},
                },
                "jd_text": {"type": "string", "description": "Optional JD text to ground the generated content"},
            },
        },
    ),
    Tool(
        name="get_profile",
        description="Get the candidate's current profile (decoded from profile.yaml).",
        inputSchema={"type": "object", "properties": {}},
    ),
    Tool(
        name="update_profile",
        description=(
            "Update the candidate's profile. Pass any subset of the profile schema. "
            "Returns the new full profile."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "data": {"type": "object", "description": "Profile fields to update"},
            },
            "required": ["data"],
        },
    ),
]


def create_server() -> Server:
    server = Server("interview-prep-portal")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        return TOOLS

    @server.call_tool()
    async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
        return await dispatch_tool_call(name, arguments)

    return server


async def dispatch_tool_call(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Dispatch an MCP tool call. Exposed for testing."""
    agent = detect_available_backend()
    try:
        if name == "evaluate_jd":
            jd = arguments.get("jd_text") or arguments.get("url", "")
            result = tool_evaluate_jd(jd, agent=agent)
            return [TextContent(type="text", text=result["evaluation"])]
        if name == "generate_cover_letter":
            result = tool_generate_cover_letter(
                company=arguments["company"],
                role=arguments["role"],
                jd_text=arguments.get("jd_text", ""),
                angle=arguments.get("angle", "impact"),
                agent=agent,
            )
            return [TextContent(type="text", text=result["cover_letter"])]
        if name == "research_company":
            result = tool_research_company(
                company=arguments["company"],
                role=arguments.get("role", ""),
                agent=agent,
            )
            return [TextContent(type="text", text=result["research"])]
        if name == "scan_jobs":
            result = tool_scan_jobs(
                search_terms=arguments.get("search_terms", ""),
                location=arguments.get("location", ""),
                max_results=arguments.get("max_results", 10),
                agent=agent,
            )
            return [TextContent(type="text", text=result["listings"])]
        if name == "generate_interview_stories":
            result = tool_generate_interview_stories(
                focus=arguments.get("focus", "all"),
                agent=agent,
            )
            return [TextContent(type="text", text=result["stories"])]
        if name == "generate_negotiation_script":
            result = tool_generate_negotiation_script(
                offer_details=arguments["offer_details"],
                c2c=arguments.get("c2c", False),
                agent=agent,
            )
            return [TextContent(type="text", text=result["script"])]
        if name == "score_resume":
            result = tool_score_resume(
                resume_text=arguments["resume_text"],
                jd_text=arguments.get("jd_text", ""),
                agent=agent,
            )
            return [TextContent(type="text", text=result["score"])]
        if name == "generate_starter_content":
            result = tool_generate_starter_content(
                target_role=arguments.get("target_role", ""),
                skill_gaps=arguments.get("skill_gaps", []),
                jd_text=arguments.get("jd_text", ""),
                agent=agent,
            )
            return [TextContent(type="text", text=result["content"])]
        if name == "get_profile":
            profile = load_profile()
            return [TextContent(type="text", text=json.dumps(profile_to_dict(profile), indent=2))]
        if name == "update_profile":
            data = arguments.get("data", {})
            current = load_profile().model_dump()
            # Shallow merge — top-level keys replace, nested objects also replace
            merged = {**current, **data}
            # For nested dicts (identity, career, etc.), merge with current
            for key, value in data.items():
                if isinstance(value, dict) and isinstance(current.get(key), dict):
                    merged[key] = {**current[key], **value}
            new_profile = Profile.model_validate(merged)
            save_profile(new_profile)
            return [TextContent(type="text", text=json.dumps(profile_to_dict(new_profile), indent=2))]
        raise ValueError(f"Unknown tool: {name}")
    except BackendError as e:
        return [TextContent(type="text", text=f"ERROR (agent backend): {e}")]
    except Exception as e:
        logger.exception("Tool call failed: %s", name)
        return [TextContent(type="text", text=f"ERROR: {e}")]


async def run_stdio() -> None:
    server = create_server()
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Interview Prep Portal MCP server")
    parser.add_argument("--http", action="store_true", help="Run as HTTP/SSE server (not yet implemented)")
    parser.add_argument("--version", action="version", version=f"interview-prep-portal-mcp {__version__}")
    args = parser.parse_args()

    if args.http:
        print("HTTP/SSE transport not yet implemented — use stdio (default)", file=sys.stderr)
        sys.exit(1)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    asyncio.run(run_stdio())


if __name__ == "__main__":
    main()
