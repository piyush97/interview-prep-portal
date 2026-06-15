# Interview Prep Portal — v1.4.0 "Universal" Plan

**Status:** ✅ **Complete and shipped as v1.4.0 (release tagged).** All 14 todos closed. 243 tests green (133 Python + 110 JS). Backend is agent-agnostic, profile-agnostic, MCP-native. React Onboarding wizard ships. See CHANGELOG entry for v1.4.0.
**Branch:** `main` (target)
**Tag:** `v1.4.0`
**Goal:** Make the portal usable by any job-seeker (any profession, any level) with any AI agent (Hermes, Claude Code, Codex, anything that speaks CLI or HTTP), via an MCP-compatible local backend.

---

## The Problem

Right now the portal works for **one specific person (Piyush, Senior Software Engineer)** because the AI prompts are hardcoded to him. The plugin shells out to `hermes run --model deepseek-v4-flash` (a wrong subcommand — actual is `hermes chat -q -m ...`), so anyone without Hermes can't use the AI features at all.

Three things must change:

1. **Profile system** — replace hardcoded "Piyush" with a user-editable profile loaded from YAML.
2. **Agent abstraction** — replace `hermes run` shim with a pluggable backend that supports Hermes, Claude Code, Codex CLI, raw HTTP endpoints, and offline mode.
3. **MCP server** — expose the same tools over MCP so any MCP client (Claude Desktop, Codex, Hermes, OpenClaw) can call them without needing our plugin.

---

## Architecture (target v1.4.0)

```
┌──────────────────────────────────────────────────────────────┐
│  INTERVIEW PREP PORTAL (React SPA, browser-localStorage)     │
│  - Dashboard, Applications, Interview Prep, Skills, etc.     │
│  - Reads/writes profile.yaml via local backend               │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP (localhost:8766)
┌──────────────────────▼───────────────────────────────────────┐
│  LOCAL BACKEND (Python, FastAPI)        ← NEW in v1.4.0     │
│  - REST API: /evaluate_jd, /cover_letter, /research, ...    │
│  - Profile loader: ~/.interview-prep-portal/profile.yaml    │
│  - Agent dispatcher: route prompts to any backend            │
│  - MCP server on :8767 (stdio or HTTP)                       │
└──┬─────────────┬──────────────┬──────────────┬───────────────┘
   │             │              │              │
   ▼             ▼              ▼              ▼
┌──────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│Hermes│   │Claude    │   │Codex CLI │   │Raw HTTP /│
│chat-q│   │Code -p   │   │exec      │   │Offline / │
│      │   │          │   │          │   │Echo mode │
└──────┘   └──────────┘   └──────────┘   └──────────┘
```

The **portal** is the UI. The **backend** is the brain. The **agent** is the LLM. Pick any combination.

---

## Data Model: `profile.yaml`

Single source of truth for "who you are". Lives in `~/.interview-prep-portal/profile.yaml` (or set `PREP_PROFILE_PATH` env var). Schema (Zod-validated on both sides):

```yaml
schema_version: 1
identity:
  name: ""                       # Required, string
  pronouns: ""                   # Optional
  location: ""                   # City, Country
  work_authorization: ""         # e.g. "Canadian PR", "US Citizen", "Open to relocation"
  contact:
    email: ""
    phone: ""
    linkedin: ""
    portfolio: ""

career:
  current_title: ""              # e.g. "ICU Nurse", "Marketing Coordinator", "Software Engineer"
  years_experience: 0            # Integer
  level: ""                      # "Entry" | "Mid" | "Senior" | "Lead" | "Principal" | "Executive"
  industry: ""                   # e.g. "Healthcare", "Education", "Fintech"

target_roles:
  - ""                          # List of role titles you want
target_industries:
  - ""
work_types:
  - "FTE" | "Contract" | "C2C" | "Part-time" | "Internship" | "Freelance"

skills:
  core: []                       # List of strings
  growing: []                    # List of strings (you're learning)
  certifications: []             # List of strings

compensation:
  currency: "CAD" | "USD" | ...
  fte_target: 0                  # Annual salary target
  contract_target_hourly: 0      # $/hr
  negotiable: true

work_history:
  - company: ""
    title: ""
    start: "YYYY-MM"
    end: "YYYY-MM" | "present"
    highlights: []               # Bullet points
    tech: []                     # For engineers; tools/methods for others

education:
  - school: ""
    credential: ""               # "BSc Nursing", "MBA", "MA Sc"
    year: 0

preferences:
  remote: true | false
  hybrid: true | false
  onsite: true | false
  willing_to_relocate: false
  visa_sponsorship_needed: false
  notice_period: ""              # e.g. "2 weeks", "1 month"

stories_seed:
  - ""                          # Bullet points for STAR stories to elaborate

agent:
  backend: "hermes" | "claude" | "codex" | "http" | "offline"
  model: ""                      # Agent-specific
  command: ""                    # Optional custom command override
  endpoint: ""                   # For "http" backend
  api_key_env: ""                # Optional, env var name
  max_tokens: 4000
  temperature: 0.7
```

**Migration plan:** The portal currently has hardcoded "Piyush Mehta" in `Sidebar.tsx` header. v1.4.0 makes the header read from profile. If profile is empty, header shows "Interview Prep Portal" only (no name).

**Default profile:** No Piyush defaults. Ship `profiles/example-software-engineer.yaml`, `profiles/example-nurse.yaml`, `profiles/example-teacher.yaml` as inspiration.

---

## Agent Backends (drop-in dispatcher)

Single interface:

```python
class AgentBackend(Protocol):
    name: str
    def call(self, system: str, user: str, *, model: str | None = None,
             max_tokens: int = 4000) -> AgentResponse: ...

@dataclass
class AgentResponse:
    text: str
    model: str
    tokens_in: int | None
    tokens_out: int | None
    duration_ms: int
    raw: dict | None
```

Built-in backends (in `backend/agents.py`):

| Backend | Invocation | Use when |
|---|---|---|
| `hermes` | `hermes chat -q "{merged}" -m {model} -Q` | User has Hermes |
| `claude` | `claude -p "{user}" --append-system-prompt "{system}" -m {model} --output-format json` | User has Claude Code |
| `codex` | `codex exec "{user}" --instructions "{system}" -m {model} --json` | User has Codex |
| `http` | `POST {endpoint}` with `{system, user, model, max_tokens}` JSON | User has any OpenAI-compatible API (LiteLLM, Ollama, OpenRouter, LM Studio) |
| `offline` | Returns canned text + warning "AI disabled, using templates" | Privacy / no LLM access |

Selection precedence: explicit `agent.backend` in profile → `PREP_AGENT_BACKEND` env var → auto-detect (try `hermes`, then `claude`, then `codex`) → offline fallback.

---

## REST API (FastAPI, port 8766)

```
GET  /health                    → {ok: true, agent: "hermes", model: "..."}
GET  /profile                   → {profile: {...}}
PUT  /profile                   → updates profile.yaml, returns new profile
GET  /profile/schema            → JSON Schema of profile.yaml

POST /api/evaluate_jd           body: {url?, jd_text, save_as_application?}
                                → {evaluation: string, metadata}
POST /api/cover_letter          body: {company, role, jd_text?, angle?}
                                → {cover_letter: string}
POST /api/research_company      body: {company, role?}
                                → {research: string}
POST /api/scan_jobs             body: {search_terms?, location?, max_results?}
                                → {listings: string}
POST /api/interview_stories     body: {focus?}
                                → {stories: string}
POST /api/negotiation_script    body: {offer_details, c2c?}
                                → {script: string}

GET  /api/applications          → list of apps (proxy to local file)
POST /api/applications          → add app
GET  /api/skills                → list
POST /api/skills                → add
```

Server is started by `prep serve` CLI. The Python CLI is the single entry point for the backend.

---

## MCP Server (port 8767, stdio + HTTP)

Same tools, exposed as MCP. So in Claude Desktop you can add the portal as an MCP server, and `evaluate_jd` becomes a tool in the chat. Same for Codex, Hermes, OpenClaw, anything MCP-compatible.

Tools: `evaluate_jd`, `generate_cover_letter`, `research_company`, `scan_jobs`, `generate_interview_stories`, `generate_negotiation_script`, `get_profile`, `update_profile`.

The Hermes plugin becomes **optional sugar** — it just calls the same MCP server under the hood. Plugin users get slash commands and the in-chat tool palette; everyone else uses the MCP server or the REST API directly.

---

## Hermes Plugin Updates

`tools.py` (the existing file) gets rewritten to:
1. Load profile from `~/.interview-prep-portal/profile.yaml` instead of hardcoded "Piyush".
2. Use the **HTTP backend** at `http://localhost:8766` instead of shelling out to `hermes run`.
3. Fix the `hermes run` → `hermes chat -q` bug (this is also fixed in the dispatcher).
4. Plugin becomes a thin Hermes-specific UI layer over the universal backend.

Net effect: anyone can use the backend with **zero** plugin install. The plugin is for Hermes users who want in-chat commands.

---

## File Layout (target v1.4.0)

```
interview-prep-portal/
├── src/                          (React app, unchanged)
│   ├── pages/
│   ├── components/
│   ├── utils/
│   ├── store.ts
│   └── ...
├── backend/                      (NEW — Python)
│   ├── __init__.py
│   ├── server.py                 (FastAPI app)
│   ├── profile.py                (Profile loader + schema)
│   ├── agents.py                 (Agent dispatch)
│   ├── mcp_server.py             (MCP server, stdio + HTTP)
│   ├── prompts.py                (Prompt templates — role-agnostic)
│   ├── tools/
│   │   ├── evaluate_jd.py
│   │   ├── cover_letter.py
│   │   ├── research_company.py
│   │   ├── scan_jobs.py
│   │   ├── interview_stories.py
│   │   └── negotiation_script.py
│   └── tests/                    (pytest)
│       ├── test_profile.py
│       ├── test_agents.py
│       ├── test_server.py
│       └── test_mcp.py
├── profiles/                     (NEW — example profiles)
│   ├── README.md
│   ├── example-software-engineer.yaml
│   ├── example-nurse.yaml
│   ├── example-teacher.yaml
│   └── example-marketer.yaml
├── scripts/
│   ├── prep.sh                   (NEW — backend entry point)
│   └── serve.sh
├── docs/                         (NEW — separated, for non-engineers)
│   ├── getting-started.md
│   ├── profile-guide.md
│   ├── agent-backends.md
│   └── profiles/
├── README.md                     (rewritten for non-engineers)
└── ...
```

The Hermes plugin (`~/.hermes/plugins/career-prep/`) gets updated to a thin shim that calls `http://localhost:8766/api/...`. Tools.py shrinks by ~70%.

---

## TDD Roadmap (implementation order)

1. **`backend/profile.py`** + tests (load, validate, save, schema)
2. **`backend/agents.py`** + tests (one test per backend, mocked subprocess)
3. **`backend/prompts.py`** + tests (pure functions: take profile + inputs, return prompt string)
4. **`backend/tools/*.py`** + tests (each tool: pure function, no I/O)
5. **`backend/server.py`** + tests (FastAPI TestClient)
6. **`backend/mcp_server.py`** + tests (call tools, verify wire format)
7. **`scripts/prep.sh`** (CLI entry: `prep serve`, `prep profile init`, `prep profile validate`)
8. **React app updates**:
   - `src/lib/backend.ts` (HTTP client to backend)
   - `src/pages/Settings.tsx` (profile editor, replacing hardcoded "Piyush" form)
   - `src/pages/Onboarding.tsx` (first-run wizard)
   - `src/components/Sidebar.tsx` (header reads profile.name)
9. **Hermes plugin rewrite**: tools.py becomes HTTP client (~200 lines → ~80 lines)
10. **Example profiles** + `docs/`
11. **README** rewrite for non-engineers
12. **Full integration test** + v1.4.0 release

Total: ~12-15 new test files, ~80-100 new tests, all green before v1.4.0.

---

## Backward Compatibility

- **Portal UI**: Settings page already has profile editing. We just make the fields match `profile.yaml` schema (rename a few).
- **localStorage data**: Unchanged. Applications, flashcards, etc. stay in browser.
- **Hermes plugin users**: After update, plugin will prompt "Backend not running — start with `prep serve`?" Otherwise same UX.
- **Hardcoded "Piyush" sidebar header**: Removed in v1.4.0. Falls back to "Interview Prep Portal" if profile is empty.

---

## Open Questions for User

1. **Open-source?** The repo is currently `piyush97/interview-prep-portal` (private). To be "available for all" you have to make it public. Different decision — out of scope for v1.4.0 unless you say.
2. **License?** MIT, Apache 2.0, or something else? MIT is the safe default.
3. **Branding?** "Interview Prep Portal" still fits, but maybe "Prep Portal" / "HireLoop" / etc.? Not blocking.
4. **First-class role templates?** I argued against in the question (3-4 days extra). Stick with example profiles (1-2 days).

---

## Acceptance Criteria for v1.4.0

- [ ] `profile.yaml` schema with Zod + Pydantic validation
- [ ] At least 3 example profiles (engineer, nurse, teacher)
- [ ] Agent backends: hermes, claude, codex, http, offline — all with tests
- [ ] FastAPI server with all REST endpoints
- [ ] MCP server exposing same tools
- [ ] No hardcoded "Piyush" anywhere in code (other than plugin author field)
- [ ] First-run onboarding wizard
- [ ] README readable by a non-engineer
- [ ] All existing 109 JS + 12 Python tests still pass
- [ ] New tests: 80+ (estimated)
- [ ] Build size ≤ current (401 KB) or with explanation
- [ ] `docs/getting-started.md` for non-engineers
- [ ] `prep` CLI works: `prep serve`, `prep profile init`, `prep profile validate`, `prep agent test`
