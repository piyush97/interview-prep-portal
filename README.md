# 🎯 Interview Prep Portal — v1.4.0 "Universal"

> An open-source interview preparation dashboard for **any** job seeker — not just software engineers. Works for nurses, teachers, marketers, designers, accountants, you name it.
>
> **You bring your own AI agent** (Hermes, Claude Code, Codex, or any OpenAI-compatible HTTP endpoint). The portal handles the data, structure, and prep workflow; your agent handles the writing.

Track applications, evaluate job descriptions, generate cover letters, practice with flashcards, compare offers, manage contacts, schedule interviews, and run your entire job search like a senior architect.

---

## 🚀 What changed in v1.4.0

v1.4.0 is a **major architecture rewrite** that makes the portal:

- **Profession-agnostic** — the AI tools (cover letters, JD evaluation, etc.) read from a YAML profile you control. Hardcoded "Piyush" prompts are gone. Ships with 4 starter personas: software engineer, healthcare professional, educator, marketer.
- **Agent-agnostic** — pick any AI backend. The portal's Python backend ships adapters for **Hermes, Claude Code, Codex, generic HTTP, and offline (no AI)**. You choose; you can switch later.
- **MCP-native** — the same 6 tools are also exposed as an MCP server, so any MCP client (Claude Desktop, Cursor, etc.) can use them.
- **CLI-first** — there's a `prep` CLI for backend management, profile init/validate, agent testing.
- **Onboarding wizard** — first-run flow that walks you through setup. No more "edit the YAML file".

What **stayed the same**:
- 100% client-side app data (localStorage) — no account, no cloud, no lock-in
- All v1.3.x features: applications, flashcards, learning paths, JD evaluator, offers, contacts, journal, reminders
- React 19 + TypeScript + Vite + Tailwind

---

## 📦 What's in the box

| Component | Tech | Purpose |
|---|---|---|
| `src/` | React 19 + TypeScript + Vite + Tailwind | The portal web app (UI) |
| `backend/` | Python 3.11+ + FastAPI + Pydantic v2 | The agent-agnostic backend (does the AI calls) |
| `mcp_server.py` | Python + mcp SDK | Exposes the same tools as MCP for Claude Desktop, etc. |
| `profiles/` | YAML | 4 starter personas (engineer, nurse, teacher, marketer) |
| `~/.hermes/plugins/career-prep/` | Python | (Optional) Hermes Agent plugin — thin HTTP shim to the backend |

```
interview-prep-portal/
├── src/                       # React app
│   ├── pages/                 # Dashboard, Applications, Settings, Onboarding, ...
│   ├── components/            # Sidebar, Layout, ErrorBoundary, ...
│   ├── lib/backend.ts         # TypeScript client for the Python backend
│   └── store.ts               # localStorage-backed state
├── backend/                   # Python FastAPI backend
│   ├── profile.py             # Pydantic profile model (universal)
│   ├── agents.py              # Hermes / Claude / Codex / HTTP / offline dispatcher
│   ├── prompts.py             # Tool prompt builders (profile-agnostic)
│   ├── tools.py               # 6 AI tools
│   ├── server.py              # FastAPI on :8766
│   ├── mcp_server.py          # MCP server (8 tools)
│   ├── cli.py                 # `prep` CLI
│   └── tests/                 # 133 pytest tests
├── profiles/                  # 4 example personas
│   ├── example-software-engineer.yaml
│   ├── example-nurse.yaml
│   ├── example-teacher.yaml
│   └── example-marketer.yaml
├── public/                    # Static assets (incl. profiles/ for the wizard)
├── PLAN.md                    # v1.4.0 architecture plan
└── README.md                  # you are here
```

---

## ⚡ Quickstart (5 minutes)

### Prerequisites

- **Node.js 20+** for the React app
- **Python 3.11+** for the backend
- *(Optional)* One of: `hermes` CLI, `claude` CLI, `codex` CLI, or an OpenAI-compatible API endpoint
- *(Optional)* [Hermes Agent](https://hermes-agent.nousresearch.com/docs) for the plugin integration

### 1. Clone & install

```bash
git clone https://github.com/piyush97/interview-prep-portal.git
cd interview-prep-portal
npm install
pip install -e .[backend]   # installs the backend in editable mode
```

### 2. Start the backend (one terminal)

```bash
python3 -m backend.cli serve
```

You should see:
```
Starting Interview Prep Portal backend on http://0.0.0.0:8766
Profile: /home/you/.interview-prep-portal/profile.yaml
INFO:     Uvicorn running on http://0.0.0.0:8766
```

**No profile yet?** That's fine — the Onboarding wizard will create one.

### 3. Start the React app (another terminal)

```bash
npm run dev
```

Open <http://localhost:5173>.

### 4. Run the Onboarding wizard

Navigate to **Config → Onboarding** in the sidebar. The wizard will:

1. Verify the backend is reachable
2. Let you pick a starter template (engineer / healthcare / educator / marketer) or start blank
3. Walk you through identity, career, skills, and AI agent choice
4. Save your profile to `~/.interview-prep-portal/profile.yaml`

### 5. Try the tools

| Tool | What it does | CLI | UI |
|---|---|---|---|
| **JD Evaluator** | Paste a JD, get an A-F analysis | `curl -X POST http://localhost:8766/api/evaluate_jd -d '{"jd_text": "..."}'` | `/evaluate` |
| **Cover Letter** | Tailored letter for a company + role | `curl -X POST http://localhost:8766/api/cover_letter -d '{"company": "Acme", "role": "Senior Engineer"}'` | (via plugin) |
| **Company Research** | Deep-dive on a company before interview | `curl -X POST http://localhost:8766/api/research_company -d '{"company": "Acme"}'` | (via plugin) |
| **Job Scan** | Search LinkedIn, Indeed, Wellfound | `curl -X POST http://localhost:8766/api/scan_jobs -d '{"location": "Remote"}'` | (via plugin) |
| **Interview Stories** | STAR+Reflection stories | `curl -X POST http://localhost:8766/api/interview_stories` | (via plugin) |
| **Negotiation Script** | Anchoring, leverage, pushback | `curl -X POST http://localhost:8766/api/negotiation_script -d '{"offer_details": "..."}'` | (via plugin) |

---

## 🤖 Choosing your AI agent

The portal is **agent-agnostic** — you pick which LLM powers the tools.

Edit your profile at `~/.interview-prep-portal/profile.yaml`:

```yaml
agent:
  backend: hermes          # hermes | claude | codex | http | offline
  model: deepseek-v4-flash
  command: ""              # leave blank to autodetect
  endpoint: ""             # only for http
  api_key_env: ""          # only for http
  max_tokens: 2048
  temperature: 0.7
```

| Backend | What it is | Setup |
|---|---|---|
| `offline` | No AI; returns canned text | None. Default. |
| `hermes` | [Hermes Agent](https://hermes-agent.nousresearch.com/docs) CLI | `pip install hermes-agent` and set `OPENAI_API_KEY` |
| `claude` | [Claude Code](https://claude.ai/code) CLI | `npm i -g @anthropic-ai/claude-code` and login |
| `codex` | [Codex CLI](https://github.com/openai/codex) | `npm i -g @openai/codex` and login |
| `http` | Any OpenAI-compatible endpoint | Set `endpoint` and `api_key_env` |

Test your agent at any time:
```bash
python3 -m backend.cli agent test --backend hermes
```

---

## 👤 Your profile

Your profile is a YAML file at `~/.interview-prep-portal/profile.yaml`. It's the single source of truth for **who you are** — every AI tool reads from it.

```yaml
schema_version: 1

identity:
  name: Jane Doe
  pronouns: she/her
  location: Toronto, ON
  work_authorization: Canadian PR
  contact:
    email: jane@example.com
    phone: "+1-555-0100"
    linkedin: https://linkedin.com/in/janedoe
    portfolio: https://janedoe.dev

career:
  current_title: ICU Nurse (Senior)
  years_experience: 8
  level: Senior
  industry: Healthcare

target_roles: [Nurse Practitioner, Clinical Educator]
target_industries: [Healthcare, Public Health]
work_types: [FTE]

skills:
  core: [ACLS, BLS, Patient Assessment, Ventilator Management]
  growing: [Epic (advanced), Clinical research]
  certifications: [RN, CCRN, TNCC]

compensation:
  currency: CAD
  fte_target: 115000
  contract_target_hourly: 65
  negotiable: true

work_history:
  - company: Sunnybrook Hospital
    title: ICU Nurse
    start: "2018-03"
    end: present
    highlights:
      - Led COVID-ICU surge response team (2021-2022)
      - Trained 12 new grad nurses in ventilator management
    tech: [Epic, Hamilton G5, Prismaflex]

education:
  - school: University of Toronto
    credential: BScN, Honours
    year: 2017

preferences:
  remote: false
  hybrid: false
  onsite: true
  willing_to_relocate: false
  visa_sponsorship_needed: false
  notice_period: 1 month

agent:
  backend: hermes
  model: deepseek-v4-flash
```

**Don't write YAML by hand.** Use the Onboarding wizard (`/onboarding`) or the CLI:

```bash
# Initialize from a starter template
python3 -m backend.cli profile init --from profiles/example-nurse.yaml

# Or interactive (asks you questions)
python3 -m backend.cli profile init --interactive

# Validate
python3 -m backend.cli profile validate

# Pretty-print
python3 -m backend.cli profile show
```

---

## 🪪 Starter personas

`profiles/` ships 4 ready-to-use profiles. Each demonstrates the portal works for a different profession:

| File | For |
|---|---|
| `example-software-engineer.yaml` | AI/ML, full-stack, backend, frontend, DevOps, mobile |
| `example-nurse.yaml` | RN, NP, pharmacist, therapist, technician — ICU focus |
| `example-teacher.yaml` | K-12 teacher, professor, instructional designer, corporate trainer |
| `example-marketer.yaml` | B2B/B2C marketing, growth, content, sales, partnerships |

Try one:
```bash
python3 -m backend.cli profile init --from profiles/example-nurse.yaml --force
python3 -m backend.cli profile show
```

---

## 🔌 Hermes Agent plugin (optional)

If you use [Hermes Agent](https://hermes-agent.nousresearch.com/docs), the portal installs a thin plugin that exposes the same 6 tools inside your chat session:

```bash
# One-shot install
bash scripts/install-plugin.sh
hermes plugins enable career-prep
```

Then in any Hermes session:

```
/prep evaluate https://example.com/job/123
/prep cover Acme "Senior Engineer"
/prep research Acme
/prep scan --location Remote
/prep stories --focus leadership
/prep negotiate "Offer: $80k USD, FTE, Toronto"
/prep status
```

The plugin is a **thin HTTP shim** (~224 lines). It doesn't do AI itself — it just forwards to the backend, which uses your profile. Switch AI backends without touching the plugin.

---

## 🛠 MCP server (optional)

The same tools are also exposed as an **MCP server** for Claude Desktop, Cursor, etc.:

```bash
python3 -m backend.cli mcp
```

Add to your MCP client config:
```json
{
  "mcpServers": {
    "interview-prep": {
      "command": "python3",
      "args": ["-m", "backend.cli", "mcp"]
    }
  }
}
```

---

## 🧪 Development

### Run tests

```bash
# Backend (133 tests)
python3 -m pytest backend/tests/ -v

# React (110 tests)
npm test

# TypeScript + production build
npm run build
```

### Project structure

```
src/
├── pages/            # One file per route
├── components/       # Shared UI
├── lib/backend.ts    # TS client for backend
├── store.ts          # localStorage state
├── types.ts          # TypeScript types
└── test/             # Vitest tests
```

### Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  React Web App  │       │  Python Backend  │       │   AI Agent      │
│  (TypeScript)   │ HTTPS │  (FastAPI:8766)  │  sub  │ hermes|claude|  │
│                 │ ────► │                  │ ────► │ codex|http|     │
│  - Dashboard    │       │  - profile (YAML)│       │ offline         │
│  - Applications │       │  - prompts       │       │                 │
│  - Settings     │       │  - tools         │       │  (or your own)  │
│  - Onboarding   │       │  - MCP server    │       │                 │
└─────────────────┘       └──────────────────┘       └─────────────────┘
       │                            │
       │                            └─────► ~/.interview-prep-portal/profile.yaml
       └────── localStorage (app data, separate from profile)
```

Key design choices:

1. **Profile is separate from app data.** Your profile is on disk (YAML) so the AI tools can read it. App data (applications, flashcards, journal) lives in browser localStorage. They never mix.
2. **Backend does the AI, not the browser.** Keeps API keys server-side, lets you switch agents without rebuilding the React app.
3. **Profile-agnostic prompts.** The prompts read from the profile. No "Piyush" or "Senior Engineer" baked in. Replace the profile, get a different cover letter.

---

## 🌐 Deployment

The portal is designed to run **locally**. The React app is a static bundle, and the Python backend is a uvicorn process. There is no cloud component, no database, no auth.

If you want to share it with friends:

```bash
# Build the static assets
npm run build

# The dist/ folder can be served from any static host
# (GitHub Pages, Netlify, Cloudflare Pages, etc.)
# Just point the backend at the same host:port
```

For production hardening (input validation, error boundary, CI, healthcheck), see the v1.2.0 release notes in the commit log.

---

## 🐛 Troubleshooting

### "Backend not running" in Settings

The Python backend isn't reachable. Start it:
```bash
python3 -m backend.cli serve
```

### "AI backend is offline" in tool output

Your profile's `agent.backend` is set to `offline` or the agent CLI isn't installed. Edit `~/.interview-prep-portal/profile.yaml` and set `agent.backend` to `hermes` / `claude` / `codex` / `http`.

Test which backends are available:
```bash
python3 -m backend.cli version
```

### Cover letter starts with "Dear Hiring Manager" instead of addressing a specific person

The backend's prompts always address a specific person if you pass one. If the output is generic, the company name was missing from the request.

### Profile is invalid after editing

Validate it:
```bash
python3 -m backend.cli profile validate
```

Errors are usually a missing required field (e.g. `career.years_experience`) or a wrong type (string vs int).

---

## 🤝 Contributing

PRs welcome. Read `PLAN.md` first to understand the architecture.

```bash
# Fork, then:
git clone https://github.com/your-fork/interview-prep-portal.git
cd interview-prep-portal
npm install
pip install -e ".[dev]"

# Make changes, run tests, commit
pytest backend/tests/
npm test
npm run build
git commit -m "feat: ..."
git push

# Open a PR
```

**Style:**
- Python: type hints everywhere, pytest for tests, one assertion per test where reasonable
- TypeScript: strict mode, functional components, no `any` (use `unknown` + narrowing)
- Follows Big Mick v1.3.x fixes (UX audit by @santifer)

---

## 📜 License

MIT — fork it, modify it, sell it, whatever. Just don't blame us if you bomb the interview.

---

## 🙏 Credits

- [santifer/career-ops](https://github.com/santifer/career-ops) — the Go TUI we learned the A-F JD evaluation pattern from
- [Anthropic](https://anthropic.com) — Claude for helping with the v1.4.0 architecture
- [MCP](https://modelcontextprotocol.io) — the protocol that lets any client use our tools
- The job-search community on Reddit, HN, and Discord — for the war stories

---

**v1.4.0 "Universal"** — built so anyone can fork this, point it at their own profile + their own AI, and have a working interview prep system in 5 minutes.
