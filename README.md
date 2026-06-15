# Interview Prep Portal

Local-first job search and interview preparation workspace for people using AI, people avoiding AI, and everyone in between.

The portal helps you turn job descriptions into a working prep system: applications, resume fit, interview plans, STAR stories, answer coaching, reminders, contacts, offers, and learning resources. It works across professions because the default profile is blank and the AI layer reads from your own profile instead of baked-in prompts.

## Why It Exists

Most job-search tools stop at tracking applications. Interview Prep Portal tries to close the loop:

1. Capture an opportunity.
2. Understand the role.
3. Match the resume to the JD.
4. Generate a prep packet.
5. Build a story bank.
6. Practice answers with feedback.
7. Track follow-ups, contacts, offers, and decisions.

Everything is designed to remain useful offline. AI can improve drafts and research, but core workflows have deterministic local fallbacks.

## Product Highlights

| Area | What you get |
| --- | --- |
| Dashboard | Readiness score, next best actions, application and prep status |
| Applications | Pipeline tracking, timeline, contacts, documents, notes, follow-up dates |
| JD Evaluator | Backend AI when available, local heuristic fallback when offline |
| Application Detail | Prep packet export, resume-to-JD match matrix, checklist |
| Interview Prep | Blank prep or generated prep from a saved application/JD |
| Answer Coach | Scores answer structure, evidence, action language, and role relevance |
| Story Bank | Reusable STAR stories with metrics, tags, and target roles |
| Resume | Multiple resume versions for role targeting |
| Research | Company research notes, products, people, culture, interview process |
| Practice | Flashcards, learning paths, curated resources |
| Career Ops | Contacts, reminders, journal, offer comparison, job comparison |
| Integrations | Optional Python backend, MCP server, and Hermes plugin shim |

## Core Workflow

### 1. Capture A Role

Paste a job description in **JD Evaluator** or add an application manually. The portal extracts company, role, URL, and saves the JD for later prep.

### 2. Check Resume Fit

Open the saved application and compare any resume version against the JD. The match matrix shows:

- score
- matched terms
- missing terms
- evidence lines from the resume

### 3. Build A Prep Packet

Application detail pages generate a markdown prep packet with:

- snapshot
- readiness checklist
- detected prep signals
- contacts
- notes
- saved JD

### 4. Create Interview Prep

Go to **Interview Prep** and choose either:

- **From Application**: generate research notes and five likely questions from a saved role
- **Blank Prep**: start manually

Generated prep uses the saved JD, application status, interview date, and best matching story from the Story Bank.

### 5. Practice With Evidence

Use the Story Bank to store STAR stories. In Interview Prep, insert a story into an answer, then let Answer Coach flag missing structure, metrics, reflection, or role relevance.

## Quickstart

### Requirements

- Node.js 20+
- Python 3.11+
- uv
- Optional: Hermes, Claude Code, Codex CLI, or an OpenAI-compatible HTTP endpoint

### Install

```bash
git clone https://github.com/piyush97/interview-prep-portal.git
cd interview-prep-portal
npm install
uv sync
```

### Start The React App

```bash
npm run dev
```

Open the local URL printed by Vite. In this repo the app is also built for the `/interview-prep-portal/` base path.

### Start The Optional Backend

The UI works without the backend, but AI-backed tools and profile editing need it.

```bash
uv run python -m backend.cli serve
```

Backend default:

```text
http://localhost:8766
```

## AI And Profile Setup

The backend reads your profile from:

```text
~/.interview-prep-portal/profile.yaml
```

Create one through **Settings** or **Onboarding**, or use the CLI:

```bash
uv run python -m backend.cli profile init --interactive
uv run python -m backend.cli profile validate
uv run python -m backend.cli profile show
```

Supported agent backends:

| Backend | Use when |
| --- | --- |
| `offline` | You want deterministic local outputs only |
| `hermes` | You use Hermes Agent CLI |
| `claude` | You use Claude Code CLI |
| `codex` | You use Codex CLI |
| `http` | You have an OpenAI-compatible endpoint |

Test an agent:

```bash
uv run python -m backend.cli agent test --backend offline
```

## Data Model

The app is intentionally local-first:

| Data | Storage |
| --- | --- |
| Portal data | Browser localStorage |
| Backend profile | `~/.interview-prep-portal/profile.yaml` |
| AI provider secrets | Your shell environment or local agent login |

No account, hosted database, or cloud sync is required.

## Optional Integrations

### MCP Server

Expose the backend tools to MCP clients:

```bash
uv run python -m backend.cli mcp
```

### Hermes Plugin

The Hermes plugin is optional. It forwards slash commands and tool calls to the local backend.

```bash
bash scripts/install-plugin.sh
hermes plugins enable career-prep
```

Example commands:

```text
/prep evaluate https://example.com/job/123
/prep cover Acme "Program Manager"
/prep research Acme
/prep stories --focus leadership
/prep negotiate "Offer: 120k base, hybrid, deadline Friday"
/prep status
```

## Development

### Main Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
npm run verify
```

`npm run verify` runs:

1. TypeScript typecheck
2. ESLint
3. Vitest
4. Python plugin tests
5. Production build

### More Backend Tests

```bash
uv run --extra dev pytest backend/tests/ plugin-tests/ -v
```

### Project Map

```text
src/
  components/        Shared UI
  pages/             Route-level screens
  utils/             Deterministic analysis and generation helpers
  lib/backend.ts     Browser client for the Python backend
  store.ts           localStorage-backed app state
  types.ts           Shared TypeScript types

backend/
  agents.py          Hermes, Claude, Codex, HTTP, offline dispatch
  cli.py             prep CLI
  mcp_server.py      MCP tool surface
  profile.py         Profile schema and persistence
  prompts.py         Profile-aware prompt builders
  server.py          FastAPI HTTP backend
  tools.py           Backend tool implementations

plugin/
  career-prep/       Optional Hermes plugin shim
```

## Design Principles

- Local-first by default.
- Useful without AI.
- AI outputs must be profile-aware.
- Defaults must be profession-neutral.
- Prep should connect to evidence, not generic advice.
- Deterministic fallbacks should be testable.
- No new dependency unless it earns its weight.

## Troubleshooting

### Backend Not Reachable

Start it:

```bash
uv run python -m backend.cli serve
```

Then check:

```bash
curl http://localhost:8766/health
```

### AI Output Looks Generic

Check profile completeness:

```bash
uv run python -m backend.cli profile validate
uv run python -m backend.cli profile show
```

Then make sure your backend choice is not `offline` if you expect model-generated output.

### Browser Data Looks Wrong

The portal stores app data in localStorage. Export/import from Settings before resetting data.

### Tests Fail In Python Cache Paths

Use the repo-local uv cache:

```bash
UV_CACHE_DIR=.uv-cache uv run --extra dev pytest plugin-tests/ -v
```

## Contributing

Before opening a PR:

```bash
npm run verify
uv run --extra dev pytest backend/tests/ plugin-tests/ -v
```

Keep changes small and evidence-backed. Update tests when behavior changes. Preserve local-first behavior and profession-neutral defaults.

## License

MIT.
