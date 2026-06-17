"""Tool prompt builders — pure functions, profile-agnostic.

Each function takes a Profile and tool-specific args, returns a
(system_prompt, user_prompt) tuple. No I/O. No agent calls.
The tool layer wires this to an agent.
"""
from __future__ import annotations

from .profile import Profile
from .profile_render import render_profile_for_prompt


# --- evaluate_jd ---

def evaluate_jd_prompts(profile: Profile, jd_text: str) -> tuple[str, str]:
    """Generate system+user prompts for evaluating a job description."""
    system = f"""You are a career coach evaluating a job opportunity.

{render_profile_for_prompt(profile)}

Your job: give the candidate an honest, structured A-F analysis of whether
this job is worth applying to, calibrated to their background and goals.

Output format (use these section headers exactly):
A) ROLE SUMMARY — What this job actually is (not just title)
B) CV MATCH — Score 1-5, list matching + missing skills
C) LEVEL STRATEGY — Is the level appropriate? Position up/down?
D) COMPENSATION — Estimated range, what to ask for
E) PERSONALIZATION — 3 specific angles/hooks for the application
F) INTERVIEW PREP — What to study, likely questions, key talking points

Final line: "Overall: X/5 — VERDICT: APPLY | MAYBE | SKIP"
"""
    user = f"Job description to evaluate:\n\n{jd_text}"
    return system, user


# --- cover_letter ---

def cover_letter_prompts(
    profile: Profile,
    company: str,
    role: str,
    jd_text: str = "",
    angle: str = "impact",
) -> tuple[str, str]:
    """Generate system+user prompts for a cover letter.

    angle: why_them | why_me | impact | mission
    """
    angle_desc = {
        "why_them": "Focus on why you want to work at THIS company specifically.",
        "why_me": "Focus on why your skills/experience make you the ideal candidate.",
        "impact": "Focus on what concrete results you'll deliver in the first 3-6 months.",
        "mission": "Focus on how your values align with the company's mission and culture.",
    }
    jd_section = f"\nJOB DESCRIPTION:\n{jd_text[:2000]}" if jd_text else ""

    system = f"""You are writing a tailored cover letter for a real job seeker.

{render_profile_for_prompt(profile)}

Write a concise, warm, professional cover letter (3-4 paragraphs max).
Use the candidate's real experience. Avoid clichés ("I'm a perfectionist",
"passionate about", "thrives in fast-paced environments").
Mirror the language and keywords from the job description naturally.
Sign off with the candidate's actual name (or "Sincerely" if name not provided).
"""
    user = f"""Company: {company}
Role: {role}
Angle: {angle_desc.get(angle, angle)}{jd_section}

Write the cover letter. Format as markdown. No placeholders."""
    return system, user


# --- research_company ---

def research_company_prompts(
    profile: Profile, company: str, role: str = ""
) -> tuple[str, str]:
    system = f"""You are a research analyst preparing a candidate for an interview.

{render_profile_for_prompt(profile)}

Your job: research the company and produce a structured brief the
candidate can use in the interview.
"""
    role_part = f" for a {role} role" if role else ""
    user = f"""Research {company}{role_part}.

Find and summarize:
1. COMPANY OVERVIEW — What they do, size, funding stage, recent growth
2. PRODUCTS & TECH — Key products, tech stack, engineering culture (if tech) or service lines (if non-tech)
3. RECENT NEWS — Major launches, funding rounds, leadership changes (last 6 months)
4. CULTURE & VALUES — Mission statement, work culture, remote/hybrid policy
5. INTERVIEW PROCESS — Known interview stages, what they look for
6. COMPETITORS — Main competitors and how they differentiate
7. TALKING POINTS — 3-5 specific things to mention in an interview

Format as a structured markdown brief. Prioritize information you can find via web search.
If you can't find something, say so honestly — don't fabricate."""
    return system, user


# --- scan_jobs ---

def scan_jobs_prompts(
    profile: Profile,
    search_terms: str,
    location: str,
    max_results: int = 10,
) -> tuple[str, str]:
    system = f"""You are a job-search assistant for a real job seeker.

{render_profile_for_prompt(profile)}

Your job: search the web for matching job listings and present them
in a table the candidate can act on.
"""
    user = f"""Search for job listings matching:

Roles: {search_terms}
Location: {location}
Limit: {max_results} results

For each result, extract:
- Job Title, Company, Location, Salary (if visible), Key Requirements, Apply Link

Format as a markdown table. Filter out obviously irrelevant or spam listings.
If you can't find real listings via web search, say so and suggest manual
searches on LinkedIn, Indeed, or industry-specific boards."""
    return system, user


# --- interview_stories ---

STORY_FOCUS_DESC = {
    "leadership": "leading a team or project",
    "conflict": "resolving a disagreement",
    "failure": "a project that failed or went wrong",
    "innovation": "introducing a new idea or approach",
    "collaboration": "working across teams or with stakeholders",
    "technical": "solving a hard problem (technical, clinical, operational, etc.)",
    "growth": "learning from a stretch experience",
    "all": "all of the above",
}


def interview_stories_prompts(
    profile: Profile, focus: str = "all"
) -> tuple[str, str]:
    system = f"""You are an interview coach helping a candidate build a STAR+R
story bank for behavioral interviews.

{render_profile_for_prompt(profile)}

Each story must be:
- SPECIFIC (real situation, real numbers, real outcome)
- ACTIONABLE (clear "I did X, not "we did X")
- IMPACTFUL (quantified result when possible)
- REFLECTIVE (what you learned, what you'd do differently)

Use the candidate's real experience and the "story seeds" they provided
(under "STORY SEEDS" in their profile) as raw material — but expand them
into full STAR+R narratives.

Format each story using these exact sections:
### Story N: [Title]

**Situation**: [Context — what was happening?]
**Task**: [What needed to be done?]
**Action**: [What specific actions did YOU take?]
**Result**: [What was the measurable outcome? Numbers preferred.]
**Reflection**: [What did you learn? How has it shaped your approach?]
"""
    focus_desc = STORY_FOCUS_DESC.get(focus, focus)
    user = f"""Generate 3 STAR+Reflection interview stories focused on: {focus_desc}.

Each section should be 3-4 sentences. Make stories interview-ready."""
    return system, user


# --- negotiation_script ---

def negotiation_script_prompts(
    profile: Profile, offer_details: str, c2c: bool = False
) -> tuple[str, str]:
    system = f"""You are a salary negotiation coach.

{render_profile_for_prompt(profile)}

Your job: write a negotiation script the candidate can actually use in
a real conversation or email. Be specific to their situation. Include
the exact phrases — not just advice.

The script must include these sections (use these exact headers):
1. ANCHOR STRATEGY — What number to start with and why
2. TALKING POINTS — 5 specific value-based arguments
3. COUNTER-OFFER PHRASING — Exact phrases for email or call
4. LEVERAGE POINTS — What to mention
5. GEOGRAPHIC PUSHBACK — How to counter "your area is cheaper" arguments
6. EQUITY/PERKS — What to ask for beyond base
7. WALK-AWAY NUMBER — Your absolute minimum
"""
    engagement = "C2C contract" if c2c else "full-time employment"
    user = f"""OFFER DETAILS:
{offer_details}

ENGAGEMENT TYPE: {engagement}

Write the negotiation script. Format as a ready-to-use markdown document.
Use the candidate's compensation.target_* values as reference points."""
    return system, user


# --- score_resume ---

def score_resume_prompts(
    profile: Profile, resume_text: str, jd_text: str = ""
) -> tuple[str, str]:
    """Generate system+user prompts for scoring a resume.

    When a JD is provided, the agent uses its keywords as the rubric.
    Without a JD, the agent uses the candidate's target roles/current title
    as the rubric and stays profession-neutral.
    """
    role_focus = ", ".join(profile.target_roles[:3]) or profile.career.current_title or "the candidate's target role"
    jd_instructions = (
        f"\nUse the following job description as the keyword source and rubric "
        f"for evaluating the resume:\n\n{jd_text}"
        if jd_text
        else f"\nNo job description provided. Use {role_focus} as the role target. "
             "Build the keyword rubric from the candidate profile and broadly applicable "
             "hiring signals: role-specific fundamentals, measurable impact, domain tools, "
             "certifications or licenses when relevant, stakeholder/customer communication, "
             "process improvement, reliability, leadership, and collaboration."
    )

    system = f"""You are an expert ATS (Applicant Tracking System) consultant and cross-industry resume reviewer.

{render_profile_for_prompt(profile)}

Your job: give the candidate an honest, specific, actionable resume scorecard.
Be brutally honest — do NOT sugarcoat. Every piece of feedback must cite
something specific from the resume (never generic). Quantify everything you can.

Output format (use these section headers exactly — they are mandatory):

## 1. OVERALL SCORE: X/10
A single number with a 1-sentence justification.

## 2. KEYWORD MATCH
A table with columns: Keyword | In Resume? | Suggested Improvement
- If a JD was provided, use its key terms as the rows.
- If no JD was provided, use the candidate's target role/profile as the source.
  Stay profession-neutral; do not default to software-engineering terms unless
  the candidate profile itself points there.

## 3. FORMAT & ATS
List specific format issues:
- Tables, columns, or graphics that may break ATS parsing
- Font consistency problems
- Section ordering issues
- Length concerns
- Other ATS compatibility risks

## 4. BULLET REWRITES
Provide 3-5 concrete before/after examples:
**Before**: [original bullet from resume]
**After**: [rewritten bullet with quantification and impact]

## 5. GAPS & MISSING
What is not in the resume that recruiters expect for this type of role.

## 6. ACTION LIST
Top 3-5 changes prioritized by impact. Each item should be a specific,
measurable action the candidate can take today.
"""
    user = f"""RESUME TEXT:\n{resume_text}{jd_instructions}"""
    return system, user


# --- generate_starter_content ---

def generate_starter_content_prompts(
    profile: Profile,
    target_role: str,
    skill_gaps: list[dict[str, object]],
    jd_text: str = "",
) -> tuple[str, str]:
    """Generate schema-bound learning content from profile + skill gaps.

    This keeps durable starter data AI-native while preserving the browser app's
    local-first storage model. The caller validates JSON before saving.
    """
    role_focus = target_role or ", ".join(profile.target_roles[:2]) or profile.career.current_title or "target role"
    gaps = skill_gaps[:12]
    jd_section = f"\nJOB DESCRIPTION:\n{jd_text[:4000]}" if jd_text else ""
    system = f"""You are an interview-prep curriculum designer.

{render_profile_for_prompt(profile)}

Generate personalized, profession-neutral prep data for the candidate.
Use their profile, target role, skill gaps, and job description when present.
Do not assume software engineering unless the profile, target role, or JD says so.
Do not include API keys, secrets, personal contact details, or invented employers.

Return JSON only. No markdown fences. The JSON must match this exact shape:
{{
  "learning_path": {{
    "title": "string",
    "description": "string",
    "modules": [
      {{
        "title": "string",
        "description": "string",
        "duration": "30m|45m|1hr|2hrs",
        "resources": []
      }}
    ]
  }},
  "flashcards": [
    {{
      "question": "string",
      "answer": "string",
      "category": "behavioral|general|technical|system-design|ai-ml|cloud",
      "deck": "string",
      "difficulty": "easy|medium|hard"
    }}
  ]
}}

Rules:
- learning_path.modules: exactly 5 modules, ordered from highest leverage to lowest.
- flashcards: exactly 8 cards; at least 5 must be behavioral or general.
- Every item must be specific to the target role or skill gaps.
- Use interview-ready phrasing, not generic advice.
- Keep answers concise enough for flashcard study.
"""
    user = f"""TARGET ROLE:
{role_focus}

SKILL GAPS:
{gaps}
{jd_section}

Generate the JSON prep data now."""
    return system, user
