"""CLI entry point: `prep` command.

Usage:
    prep serve [--port 8766] [--host 0.0.0.0]
    prep serve stop
    prep profile show
    prep profile validate
    prep profile init [--from PATH] [--interactive]
    prep profile path
    prep agent test [--backend hermes|claude|codex|http|offline]
    prep mcp
    prep version
"""
from __future__ import annotations

import argparse
import json
import sys
import os
from pathlib import Path
from typing import NoReturn

from . import __version__
from .agents import detect_available_backend, get_backend, BackendError, list_backends
from .profile import (
    Profile,
    load_profile,
    profile_exists,
    profile_path,
    profile_to_yaml,
    save_profile,
)
from .profile_render import profile_completeness, render_profile_summary


def cmd_serve(args: argparse.Namespace) -> int:
    """Start (or stop) the FastAPI server."""
    if args.action == "stop":
        # Best-effort kill — pkill returns 1 if nothing matched
        import subprocess
        r = subprocess.run(["pkill", "-f", "uvicorn.*backend.server"], capture_output=True)
        if r.returncode == 0:
            print("✓ Backend stopped")
            return 0
        else:
            print("No backend process found")
            return 0

    if args.action == "status":
        import urllib.request
        try:
            with urllib.request.urlopen(f"http://{args.host}:{args.port}/health", timeout=3) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                print(f"✓ Backend running on http://{args.host}:{args.port}")
                print(f"  Version: {data.get('version')}")
                print(f"  Agent:   {data.get('agent')}")
                print(f"  Profile: {data.get('profile_path')}")
                return 0
        except Exception:
            print(f"○ Backend not running on port {args.port}")
            return 1

    # start
    import uvicorn
    host = args.host
    port = args.port
    print(f"Starting Interview Prep Portal backend on http://{host}:{port}")
    print(f"Profile: {profile_path()}")
    uvicorn.run(
        "backend.server:app",
        host=host,
        port=port,
        log_level="info",
        reload=False,
    )
    return 0


def cmd_profile(args: argparse.Namespace) -> int:
    if args.profile_action == "show":
        p = load_profile()
        print(render_profile_summary(p))
        if args.json:
            print()
            print("--- RAW YAML ---")
            print(profile_to_yaml(p))
        completeness = profile_completeness(p)
        print()
        print(f"Profile completeness: {completeness * 100:.0f}%")
        return 0

    if args.profile_action == "validate":
        p = load_profile()
        try:
            Profile.model_validate(p.model_dump())
            print("✓ Profile is valid")
            return 0
        except Exception as e:
            print(f"✗ Profile validation failed:\n{e}")
            return 1

    if args.profile_action == "path":
        print(profile_path())
        return 0

    if args.profile_action == "init":
        if not args.from_file and not args.interactive:
            print("Either --from PATH or --interactive is required")
            return 2
        if profile_exists() and not args.force:
            print(f"Profile already exists at {profile_path()}")
            print("Use --force to overwrite")
            return 1
        if args.from_file:
            src = Path(args.from_file).expanduser()
            if not src.exists():
                print(f"Source file not found: {src}")
                return 1
            data = json.loads(src.read_text()) if src.suffix == ".json" else None
            if data is None:
                import yaml
                data = yaml.safe_load(src.read_text())
            try:
                p = Profile.model_validate(data)
            except Exception as e:
                print(f"Invalid profile: {e}")
                return 1
            save_profile(p)
            print(f"✓ Profile saved to {profile_path()}")
            print(f"  Completeness: {profile_completeness(p) * 100:.0f}%")
            return 0
        if args.interactive:
            return _interactive_init()

    return 0


def _interactive_init() -> int:
    """Walk the user through filling out a basic profile."""
    print("Interactive profile setup — leave blank to skip")
    print()
    name = input("Your name: ").strip()
    title = input("Current job title: ").strip()
    years = input("Years of experience: ").strip() or "0"
    level = input("Level (Entry/Mid/Senior/Lead/Principal/Staff/Executive): ").strip()
    target = input("Target role (e.g. Senior Engineer): ").strip()
    skills = input("Core skills (comma-separated): ").strip()
    location = input("Location: ").strip()

    data = {
        "identity": {"name": name, "location": location},
        "career": {
            "current_title": title,
            "years_experience": int(years) if years.isdigit() else 0,
            "level": level,
        },
        "target_roles": [r.strip() for r in target.split(",") if r.strip()],
        "skills": {"core": [s.strip() for s in skills.split(",") if s.strip()]},
        "agent": {"backend": "offline"},  # safe default
    }
    try:
        p = Profile.model_validate(data)
    except Exception as e:
        print(f"Invalid input: {e}")
        return 1
    save_profile(p)
    print(f"✓ Profile saved to {profile_path()}")
    print(f"  Completeness: {profile_completeness(p) * 100:.0f}%")
    print()
    print("Next: edit your profile to add more detail, or pick an AI agent:")
    print("  prep agent test --backend hermes")
    return 0


def cmd_agent(args: argparse.Namespace) -> int:
    backend_name = args.backend or "auto"
    if backend_name == "auto":
        b = detect_available_backend()
        print(f"Auto-detected: {b.name}")
    else:
        try:
            b = get_backend(backend_name)
        except ValueError as e:
            print(f"✗ {e}")
            return 1
    print(f"Testing backend: {b.name}")
    try:
        resp = b.call(
            "You are a test assistant. Be very brief.",
            "Reply with just the word 'OK' and nothing else.",
            max_tokens=50,
        )
        print(f"✓ Got response in {resp.duration_ms}ms")
        print(f"  Model:  {resp.model}")
        print(f"  Tokens: in={resp.tokens_in} out={resp.tokens_out}")
        print(f"  Text:   {resp.text[:200]}")
        return 0
    except BackendError as e:
        print(f"✗ Backend error: {e}")
        return 1
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return 1


def cmd_mcp(args: argparse.Namespace) -> int:
    """Start the MCP server (stdio)."""
    from .mcp_server import main as mcp_main
    # Forward to the MCP main; sys.argv is already set up
    try:
        mcp_main()
    except KeyboardInterrupt:
        return 0
    return 0


def cmd_version(args: argparse.Namespace) -> int:
    print(f"interview-prep-portal {__version__}")
    print(f"Profile path: {profile_path()}")
    print(f"Available backends: {', '.join(list_backends())}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="prep",
        description="Interview Prep Portal — agent-agnostic backend CLI",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # serve
    p_serve = sub.add_parser("serve", help="Start the backend HTTP server")
    p_serve.add_argument("--host", default="0.0.0.0", help="Bind host (default: 0.0.0.0)")
    p_serve.add_argument("--port", type=int, default=8766, help="Bind port (default: 8766)")
    p_serve.add_argument("action", nargs="?", default="start", choices=["start", "stop", "status"])
    p_serve.set_defaults(func=cmd_serve)

    # profile
    p_profile = sub.add_parser("profile", help="Manage your profile")
    profile_sub = p_profile.add_subparsers(dest="profile_action", required=True)
    p_profile_show = profile_sub.add_parser("show", help="Print current profile")
    p_profile_show.add_argument("--json", action="store_true", help="Also print raw YAML")
    p_profile_show.set_defaults(func=cmd_profile)
    p_profile_val = profile_sub.add_parser("validate", help="Validate profile.yaml")
    p_profile_val.set_defaults(func=cmd_profile)
    p_profile_path = profile_sub.add_parser("path", help="Print profile path")
    p_profile_path.set_defaults(func=cmd_profile)
    p_profile_init = profile_sub.add_parser("init", help="Initialize a new profile")
    p_profile_init.add_argument("--from", dest="from_file", help="Copy from a YAML/JSON file (e.g. profiles/example-nurse.yaml)")
    p_profile_init.add_argument("--interactive", action="store_true", help="Walk through setup interactively")
    p_profile_init.add_argument("--force", action="store_true", help="Overwrite existing profile")
    p_profile_init.set_defaults(func=cmd_profile)

    # agent
    p_agent = sub.add_parser("agent", help="Test an AI agent backend")
    p_agent.add_argument("test_action", nargs="?", default="test", help="(reserved)")
    p_agent.add_argument("--backend", choices=["auto", "hermes", "claude", "codex", "http", "offline"],
                         default="auto", help="Which backend to test")
    p_agent.set_defaults(func=cmd_agent)

    # mcp
    p_mcp = sub.add_parser("mcp", help="Run the MCP server (stdio)")
    p_mcp.set_defaults(func=cmd_mcp)

    # version
    p_ver = sub.add_parser("version", help="Show version and config")
    p_ver.set_defaults(func=cmd_version)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
