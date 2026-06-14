"""Tool handlers for Career Prep plugin."""

import json
import os
import subprocess
import time
import re
from pathlib import Path
from datetime import datetime


def _get_portal_dir() -> Path:
    """Get the portal directory from env or default."""
    return Path(os.environ.get("PREP_PORTAL_DIR", os.path.expanduser("~/interview-prep-portal")))


def _get_portal_data():
    """Read portal data from localStorage JSON backup or direct file."""
    portal_dir = _get_portal_dir()
    data_file = portal_dir / "data.json"
    if data_file.exists():
        try:
            return json.loads(data_file.read_text())
        except:
            pass
    return None


def handle_evaluate_jd(args: dict, **kwargs) -> str:
    """Evaluate a job description against the user's profile."""
    url_or_text = args.get("url_or_text", "")
    if not url_or_text:
        return json.dumps({"error": "No job description or URL provided."})

    # Build evaluation prompt
    prompt = f"""You are a career coach evaluating a job opportunity for a candidate.

CANDIDATE PROFILE:
- Piyush Mehta, Senior Software Engineer (Contractor)
- 6+ years experience in AI/LLM/Agentic workflows, MCP, React, TypeScript, Python, Azure
- Current: Contractor at Tundra/OPG. Past: BDO, Nuclei, Amazon
- Azure AI Certified. C2C rate: $88-$100+/hr
- Target roles: AI/LLM Engineer, Full-Stack AI Developer, MCP/Agentic Engineer
- Strong: MCP servers, LangChain, RAG, React/Next.js, TypeScript, Python
- Growing: System Design, Azure AI, Docker/K8s
- Prefers: C2C/contract roles, Toronto remote/hybrid

JOB DESCRIPTION:
{url_or_text}

Evaluate this opportunity with a structured A-F analysis:

A) ROLE SUMMARY — What this job actually is (not just title)
B) CV MATCH — Score 1-5 and list matching + missing skills
C) LEVEL STRATEGY — Is the level appropriate? Should candidate position up/down?
D) COMPENSATION — Estimated range, whether C2C is viable, rate positioning
E) PERSONALIZATION — 3 specific angles/hooks for the application
F) INTERVIEW PREP — What to study/prepare, likely questions, key talking points

Overall score: X/5. Verdict: APPLY / MAYBE / SKIP."""

    try:
        result = subprocess.run(
            ["hermes", "run", "--model", "deepseek-v4-flash", prompt],
            capture_output=True, text=True, timeout=120,
            env={**os.environ, "HOME": os.environ.get("HOME", "/home/hermes")}
        )
        evaluation = result.stdout.strip() or result.stderr.strip()
    except Exception as e:
        evaluation = f"Evaluation failed: {e}\n\nManual eval: Review the JD and compare against the candidate profile manually."

    return json.dumps({"evaluation": evaluation, "source": "ai-generated"})


def handle_generate_cover_letter(args: dict, **kwargs) -> str:
    """Generate a tailored cover letter."""
    company = args.get("company", "")
    role = args.get("role", "")
    job_desc = args.get("job_description", "")
    angle = args.get("angle", "impact")

    if not company or not role:
        return json.dumps({"error": "Company and role are required."})

    job_context = f"\nJOB DESCRIPTION:\n{job_desc[:2000]}" if job_desc else ""

    angle_prompts = {
        "why_them": "Focus on why you want to work at THIS company specifically.",
        "why_me": "Focus on why your skills/experience make you the ideal candidate.",
        "impact": "Focus on what concrete results you'll deliver in the first 3-6 months.",
        "mission": "Focus on how your values align with the company's mission and culture."
    }

    prompt = f"""Write an ATS-optimized cover letter for:

CANDIDATE: Piyush Mehta — Senior Software Engineer
Specializing in AI/LLM/Agentic workflows, MCP, React, TypeScript, Python, Azure
6+ years experience. Current: Contractor at Tundra/OPG

COMPANY: {company}
ROLE: {role}
ANGLE: {angle_prompts[angle]}
{job_context}

Write a concise, warm, professional cover letter (3-4 paragraphs max). 
Include at least 3 keywords from the job description naturally.
Use the candidate's real experience: building MCP servers, AI agents, React full-stack.
Format as markdown."""

    try:
        result = subprocess.run(
            ["hermes", "run", "--model", "deepseek-v4-flash", prompt],
            capture_output=True, text=True, timeout=120
        )
        letter = result.stdout.strip()
    except Exception as e:
        letter = f"Dear Hiring Manager,\n\nI am writing to apply for {role} at {company}.\n\n[Cover letter generation failed: {e}]"

    return json.dumps({"cover_letter": letter, "company": company, "role": role, "angle": angle})


def handle_research_company(args: dict, **kwargs) -> str:
    """Deep research on a company."""
    company = args.get("company", "")
    role = args.get("role", "")

    if not company:
        return json.dumps({"error": "Company name is required."})

    prompt = f"""Research {company}{f" for a {role} role" if role else ""} for an upcoming job interview.

Find and summarize:
1. COMPANY OVERVIEW — What they do, size, funding stage, recent growth
2. PRODUCTS & TECH — Key products, tech stack, engineering culture
3. RECENT NEWS — Major launches, funding rounds, leadership changes (last 6 months)
4. CULTURE & VALUES — Mission statement, work culture, remote policy
5. INTERVIEW PROCESS — Known interview stages, what they look for
6. COMPETITORS — Main competitors and how they differentiate
7. TALKING POINTS — 3-5 specific things to mention in an interview

Format as a structured research brief in markdown. Prioritize information you can find via web search."""

    try:
        result = subprocess.run(
            ["hermes", "run", "--model", "deepseek-v4-flash", prompt],
            capture_output=True, text=True, timeout=180
        )
        research = result.stdout.strip()
    except Exception as e:
        research = f"# {company} Research\n\nResearch generation failed: {e}\n\nTry searching manually."

    return json.dumps({"research": research, "company": company, "role": role})


def handle_scan_jobs(args: dict, **kwargs) -> str:
    """Scan job boards for matching roles."""
    search_terms = args.get("search_terms", "AI Engineer OR LLM Engineer OR MCP Developer OR Agentic Workflows")
    location = args.get("location", "Toronto OR Remote")
    max_results = min(args.get("max_results", 10), 25)

    query = f'site:linkedin.com/jobs OR site:indeed.com OR site:wellfound.com ({search_terms}) {location}'

    prompt = f"""You have access to web_search. Search for job listings matching:

ROLES: {search_terms}
LOCATION: {location}
LIMIT: {max_results} results

For each result, extract:
- Job Title, Company, Location, Salary (if visible), Key Requirements, Apply Link

Format as a table. Filter out obviously irrelevant or spam listings.

Also note: For the candidate (Piyush Mehta):
- C2C preferred, $88-100+/hr
- 6yr AI/LLM/Agentic, MCP, React, TypeScript, Python, Azure
- Toronto-based, open to remote"""

    try:
        result = subprocess.run(
            ["hermes", "run", "--model", "deepseek-v4-flash", prompt],
            capture_output=True, text=True, timeout=180
        )
        listings = result.stdout.strip()
    except Exception as e:
        listings = f"Job scan failed: {e}\n\nSearch manually on LinkedIn, Indeed, or Wellfound."

    return json.dumps({"listings": listings, "query": search_terms, "location": location})


def handle_interview_stories(args: dict, **kwargs) -> str:
    """Generate STAR+Reflection interview stories."""
    focus = args.get("focus", "all")

    focus_desc = {
        "leadership": "leading a team or project",
        "conflict": "resolving a disagreement",
        "failure": "a project that failed or went wrong",
        "innovation": "introducing a new idea or technology",
        "collaboration": "working across teams",
        "technical": "solving a hard technical problem",
        "all": "all of the above"
    }

    prompt = f"""Generate 3 STAR+Reflection interview stories for Piyush Mehta about: {focus_desc[focus]}.

Format each story as:
### Story N: [Title]

**Situation**: [Context — what was happening?]
**Task**: [What needed to be done?]
**Action**: [What specific actions did you take?]
**Result**: [What was the measurable outcome?]
**Reflection**: [What did you learn? How has it shaped your approach?]

Use REAL experience from this profile:
- Built MCP servers at Tundra/OPG for industrial data (SCADA integration)
- Built AI agents and RAG systems
- React/TypeScript full-stack development at Nuclei and BDO
- Azure AI certification and cloud work
- Amazon experience (if relevant)
- Contract/consulting experience: client management, scope negotiation

Make stories specific, concrete, and interview-ready. Each should be 3-4 sentences per section."""

    try:
        result = subprocess.run(
            ["hermes", "run", "--model", "deepseek-v4-flash", prompt],
            capture_output=True, text=True, timeout=120
        )
        stories = result.stdout.strip()
    except Exception as e:
        stories = f"Story generation failed: {e}"

    return json.dumps({"stories": stories, "focus": focus})


def handle_negotiation_script(args: dict, **kwargs) -> str:
    """Generate negotiation script."""
    offer = args.get("offer_details", "")
    is_c2c = args.get("c2c", False)

    if not offer:
        return json.dumps({"error": "Offer details are required."})

    engagement = "C2C contract" if is_c2c else "full-time employment"

    prompt = f"""You are a salary negotiation coach for a software engineer.

CANDIDATE:
- Piyush Mehta, Senior Software Engineer (AI/LLM/Agentic workflows)
- 6+ years experience. Current rate: $88-100+/hr C2C
- Target: $100-130+/hr C2C or $120-170K CAD FTE + equity
- Based in Toronto, Canada

OFFER DETAILS:
{offer}
ENGAGEMENT TYPE: {engagement}

Generate a negotiation script with:
1. ANCHOR STRATEGY — What number to start with and why
2. TALKING POINTS — 5 specific value-based arguments (not "I need money")
3. COUNTER-OFFER PHRASING — Exact phrases to use in email or call
4. LEVERAGE POINTS — What to mention (competing offers, market data, specific skills)
5. GEOGRAPHIC PUSHBACK — How to counter "Toronto is cheaper than SF" arguments
6. EQUITY/PERKS — What to ask for beyond base (equity, bonus, vacation, training budget)
7. WALK-AWAY NUMBER — Your absolute minimum

Format as a ready-to-use script in markdown."""

    try:
        result = subprocess.run(
            ["hermes", "run", "--model", "deepseek-v4-flash", prompt],
            capture_output=True, text=True, timeout=120
        )
        script = result.stdout.strip()
    except Exception as e:
        script = f"Negotiation script generation failed: {e}"

    return json.dumps({"script": script, "engagement": engagement})


def handle_serve_portal(args: dict, **kwargs) -> str:
    """Start/stop the web portal."""
    action = args.get("action", "status")
    portal_dir = _get_portal_dir()

    if not portal_dir.exists():
        return json.dumps({"error": f"Portal directory not found: {portal_dir}. Set PREP_PORTAL_DIR env var."})

    if action == "status":
        try:
            result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:8766"],
                capture_output=True, text=True, timeout=5
            )
            if result.stdout.strip() == "200":
                return json.dumps({
        "status": "running", "url": "http://localhost:8766/"
    })
            else:
                return json.dumps({"status": "stopped"})
        except:
            return json.dumps({"status": "stopped"})

    elif action == "start":
        # Check if already running
        try:
            subprocess.run(["curl", "-s", "-o", "/dev/null", "http://localhost:8766"], timeout=3)
            return json.dumps({"status": "already_running", "url": "http://localhost:8766/"})
        except:
            pass

        # Build and start
        try:
            if not (portal_dir / "dist").exists() or not (portal_dir / "dist" / "index.html").exists():
                subprocess.run(["npm", "run", "build"], cwd=str(portal_dir), capture_output=True, timeout=60)

            # Start preview server in background
            subprocess.Popen(
                ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "8766", "--strictPort"],
                cwd=str(portal_dir),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            time.sleep(2)
            return json.dumps({"status": "started", "url": "http://localhost:8766/"})
        except Exception as e:
            return json.dumps({"error": f"Failed to start portal: {e}"})

    elif action == "stop":
        try:
            subprocess.run(["pkill", "-f", "vite preview.*8766"], timeout=5)
            return json.dumps({"status": "stopped"})
        except Exception as e:
            return json.dumps({"error": f"Failed to stop: {e}"})

    return json.dumps({"error": f"Unknown action: {action}"})


def handle_portal_status(args: dict, **kwargs) -> str:
    """Get portal data summary."""
    data = _get_portal_data()
    if not data:
        # Try to read directly from the store structure
        portal_dir = _get_portal_dir()
        store = portal_dir / "src" / "store.ts"
        if not store.exists():
            return json.dumps({"error": "Portal not found. Set PREP_PORTAL_DIR."})

        # Fallback: return a message about the portal
        return json.dumps({
            "message": "Portal data available via localStorage. Open the web portal at http://localhost:8766/.",
            "applications": "N/A — access via web portal",
            "skills_progress": "N/A — access via web portal",
        })

    apps = data.get("applications", [])
    skills = data.get("skills", [])
    flashcards = data.get("flashcards", [])
    learning_paths = data.get("learningPaths", [])
    contacts = data.get("contacts", [])
    offers = data.get("offers", [])
    journal = data.get("journal", [])
    profile = data.get("profile", {})

    return json.dumps({
        "profile": {
            "name": profile.get("name", "Unknown"),
            "target_rate": profile.get("targetRate"),
            "target_salary": profile.get("targetSalary"),
        },
        "applications": {
            "total": len(apps),
            "active": len([a for a in apps if a.get("status") not in ["rejected", "accepted", "withdrawn"]]),
            "interviews": len([a for a in apps if a.get("status") in ["phone-screen", "technical", "onsite"]]),
            "offers": len([a for a in apps if a.get("status") == "offer"]),
        },
        "skills": {
            "total": len(skills),
            "at_target": len([s for s in skills if s.get("level", 0) >= s.get("targetLevel", 5)]),
            "weak_spots": [s.get("name") for s in skills if s.get("level", 0) < s.get("targetLevel", 5)][:5],
        },
        "study": {
            "flashcards_due": len([f for f in flashcards if f.get("level", 5) < 5]),
            "total_modules": sum(len(p.get("modules", [])) for p in learning_paths),
            "completed_modules": sum(len(p.get("completedModules", [])) for p in learning_paths),
        },
        "network": {
            "contacts": len(contacts),
            "warm_contacts": len([c for c in contacts if c.get("status") == "warm"]),
        },
        "offers": {
            "total": len(offers),
            "best_score": max((o.get("score", 0) for o in offers), default=0),
        },
        "journal": {
            "entries": len(journal),
            "latest": journal[0].get("date") if journal else None,
        },
    })
