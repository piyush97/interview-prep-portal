"""Career Prep Plugin — AI-powered job search and interview preparation.

Register tools, hooks, CLI commands, and bundled skills for Hermes Agent.
"""

import logging
from pathlib import Path

from . import schemas, tools

logger = logging.getLogger(__name__)

PLUGIN_DIR = Path(__file__).resolve().parent


def _handle_slash(args: str):
    """Handle /prep slash commands during sessions."""
    args = (args or "").strip().lower()

    if not args or args == "help":
        return (
            "/prep evaluate <url>  — Evaluate a job description\n"
            "/prep cover <co> <role> — Generate a cover letter\n"
            "/prep research <co>   — Research a company\n"
            "/prep scan [terms]    — Scan job boards\n"
            "/prep stories [focus] — Generate STAR interview stories\n"
            "/prep negotiate       — Get a negotiation script\n"
            "/prep portal          — Open the web dashboard\n"
            "/prep status          — Your application stats"
        )

    parts = args.split(maxsplit=2)

    if parts[0] == "evaluate" and len(parts) > 1:
        return "Use evaluate_jd tool with the URL: " + parts[1]
    elif parts[0] == "cover" and len(parts) > 2:
        return "Use generate_cover_letter tool for " + parts[1] + " " + parts[2]
    elif parts[0] == "research" and len(parts) > 1:
        return "Use research_company tool for: " + parts[1]
    elif parts[0] == "scan":
        return "Use scan_jobs tool to search for opportunities."
    elif parts[0] == "stories":
        focus = parts[1] if len(parts) > 1 else "all"
        return f"Use generate_interview_stories tool with focus={focus}"
    elif parts[0] == "negotiate":
        return "Use generate_negotiation_script tool with offer details."
    elif parts[0] == "portal":
        return "Use serve_portal tool with action='start' to launch the dashboard."
    elif parts[0] == "status":
        return "Use portal_status tool for your stats summary."

    return None  # No match — let normal processing continue



def on_session_start(session_id: str, model: str, platform: str):
    """Inject portal context at session start."""
    portal_dir = Path(
        __import__("os").environ.get("PREP_PORTAL_DIR",
                                     __import__("os").path.expanduser("~/interview-prep-portal"))
    )
    if portal_dir.exists():
        return (
            "🔹 Career Prep Portal available: Use /prep to access job evaluation, "
            "cover letter generation, company research, interview prep, and more.\n"
            "Profile-aware tools read from the local backend profile. Use /prep status "
            "to confirm the active candidate, target role, and AI backend."
        )


def _setup_cli(subparser):
    """Configure CLI subcommands for 'hermes prep'."""
    subparsers = subparser.add_subparsers(dest="prep_command", help="Career Prep commands")

    # hermes prep serve
    serve = subparsers.add_parser("serve", help="Start the Interview Prep Portal web dashboard")
    serve.add_argument("--port", type=int, default=8766, help="Port to serve on (default: 8766)")
    serve.add_argument("--build", action="store_true", help="Rebuild before serving")

    # hermes prep status
    status = subparsers.add_parser("status", help="Show portal data summary")

    # hermes prep evaluate
    eval_p = subparsers.add_parser("evaluate", help="Evaluate a job description")
    eval_p.add_argument("url_or_text", help="Job URL or description text")

    # hermes prep cover
    cover = subparsers.add_parser("cover", help="Generate a cover letter")
    cover.add_argument("company", help="Company name")
    cover.add_argument("role", help="Role title")
    cover.add_argument("--angle", choices=["why_them", "why_me", "impact", "mission"],
                       default="impact")

    # hermes prep research
    research = subparsers.add_parser("research", help="Research a company")
    research.add_argument("company", help="Company name")
    research.add_argument("--role", help="Target role")


def _handle_cli(args):
    """Handle CLI commands."""
    command = getattr(args, "prep_command", None)

    if command == "serve":
        result = tools.handle_serve_portal({"action": "start"})
        import json
        data = json.loads(result)
        if data.get("status") in ("started", "already_running"):
            print(f"Portal running at {data['url']}")
        else:
            print(f"Failed: {data.get('error', 'unknown error')}")

    elif command == "status":
        result = tools.handle_portal_status({})
        import json
        data = json.loads(result)
        print(json.dumps(data, indent=2))

    elif command == "evaluate":
        result = tools.handle_evaluate_jd({"url_or_text": args.url_or_text})
        import json
        data = json.loads(result)
        print(data.get("evaluation", "No evaluation returned"))

    elif command == "cover":
        result = tools.handle_generate_cover_letter({
            "company": args.company,
            "role": args.role,
            "angle": args.angle,
        })
        import json
        data = json.loads(result)
        print(data.get("cover_letter", "No cover letter returned"))

    elif command == "research":
        result = tools.handle_research_company({
            "company": args.company,
            "role": getattr(args, "role", None),
        })
        import json
        data = json.loads(result)
        print(data.get("research", "No research returned"))

    else:
        print("Career Prep Plugin — Hermes Agent\n")
        print("Commands:")
        print("  hermes prep serve         Start the web portal dashboard")
        print("  hermes prep status        Show your application stats")
        print("  hermes prep evaluate URL  Evaluate a job description")
        print("  hermes prep cover CO ROLE Generate a cover letter")
        print("  hermes prep research CO   Research a company")
        print("  /prep                     In-session slash commands")


def register(ctx):
    """Register all tools, hooks, CLI commands, and skills."""

    # ── Tools ────────────────────────────────────────────
    ctx.register_tool(
        name="evaluate_jd",
        toolset="career-prep",
        schema=schemas.EVALUATE_JD_SCHEMA,
        handler=tools.handle_evaluate_jd,
    )
    ctx.register_tool(
        name="generate_cover_letter",
        toolset="career-prep",
        schema=schemas.COVER_LETTER_SCHEMA,
        handler=tools.handle_generate_cover_letter,
    )
    ctx.register_tool(
        name="research_company",
        toolset="career-prep",
        schema=schemas.RESEARCH_COMPANY_SCHEMA,
        handler=tools.handle_research_company,
    )
    ctx.register_tool(
        name="scan_jobs",
        toolset="career-prep",
        schema=schemas.SCAN_JOBS_SCHEMA,
        handler=tools.handle_scan_jobs,
    )
    ctx.register_tool(
        name="generate_interview_stories",
        toolset="career-prep",
        schema=schemas.INTERVIEW_STORIES_SCHEMA,
        handler=tools.handle_interview_stories,
    )
    ctx.register_tool(
        name="generate_negotiation_script",
        toolset="career-prep",
        schema=schemas.NEGOTIATION_SCRIPT_SCHEMA,
        handler=tools.handle_negotiation_script,
    )
    ctx.register_tool(
        name="serve_portal",
        toolset="career-prep",
        schema=schemas.SERVE_PORTAL_SCHEMA,
        handler=tools.handle_serve_portal,
    )
    ctx.register_tool(
        name="portal_status",
        toolset="career-prep",
        schema=schemas.PORTAL_STATUS_SCHEMA,
        handler=tools.handle_portal_status,
    )

    # ── Hooks ────────────────────────────────────────────
    ctx.register_hook("on_session_start", on_session_start)

    # ── CLI Command ──────────────────────────────────────
    ctx.register_cli_command(
        name="career-prep",
        help="AI-powered job search and interview preparation",
        setup_fn=_setup_cli,
        handler_fn=_handle_cli,
    )

    # ── Slash Commands ───────────────────────────────────
    ctx.register_command(
        "prep",
        handler=_handle_slash,
        description="Career Prep: evaluate JDs, generate cover letters, research companies, practice interviews",
    )

    # ── Bundled Skill ────────────────────────────────────
    skill_md = PLUGIN_DIR / "skills" / "career-prep" / "SKILL.md"
    if skill_md.exists():
        ctx.register_skill("career-prep", skill_md)
