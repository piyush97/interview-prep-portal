# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-06-15 — "Universal"

### Added

- **Agent-agnostic backend** — `backend/agents.py` ships a dispatcher supporting `hermes`, `claude`, `codex`, `http`, and `offline` backends. Switch your AI by editing one YAML field.
- **Profile-agnostic prompts** — the AI tools read from a YAML profile (`~/.interview-prep-portal/profile.yaml`), not hardcoded prompts. Works for any profession.
- **4 starter personas** — `profiles/example-software-engineer.yaml`, `example-nurse.yaml`, `example-teacher.yaml`, `example-marketer.yaml`. Try them with `python3 -m backend.cli profile init --from profiles/example-nurse.yaml`.
- **FastAPI backend** — `backend/server.py` exposes 10 REST endpoints (`/health`, `/profile`, `/profile/schema`, `/profile/from_yaml`, `/api/{evaluate_jd,cover_letter,research_company,scan_jobs,interview_stories,negotiation_script}`).
- **MCP server** — `backend/mcp_server.py` exposes the same 6 AI tools as MCP for Claude Desktop, Cursor, etc.
- **`prep` CLI** — `backend/cli.py` with `serve`, `profile {show,validate,init,path}`, `agent test`, `mcp`, `version`.
- **Onboarding wizard** — `src/pages/Onboarding.tsx` is a 7-step first-run flow: welcome → backend check → pick persona → identity → career → skills → agent. Reachable from sidebar (`/onboarding`).
- **Settings page rewrite** — `src/pages/Settings.tsx` now talks to the Python backend (`GET/PUT /profile`), shows backend connection status, and lets you edit the universal profile (identity, career, skills, work history, education, compensation, preferences, AI agent).
- **TypeScript backend client** — `src/lib/backend.ts` with typed `Profile` matching the Python Pydantic schema.
- **New backend endpoint** — `POST /profile/from_yaml` parses a YAML profile string and returns the validated Profile dict (used by the Onboarding wizard to load starter personas).
- **Public profiles** — `public/profiles/` mirrors `profiles/` so the Onboarding wizard can fetch starter YAMLs at runtime.

### Changed

- **Sidebar header no longer hardcodes "Piyush Mehta"** — it reads the profile name from the backend, or falls back to "v1.4.0 — Universal" if the backend is down.
- **Sidebar version bumped** from v1.3.2 to v1.4.0.
- **Sidebar adds "Onboarding" link** under the Config section.
- **README rewritten** — covers the new architecture, agent selection, profile format, MCP, and 5-minute quickstart. Designed for non-engineers.
- **Plugin (`~/.hermes/plugins/career-prep`)** rewritten from 401 lines to 224 lines as a thin HTTP shim. Old `subprocess.run(["hermes", "run", ...])` calls replaced with `urllib.request.urlopen(http://localhost:8766/api/...)`. The `hermes run` → `hermes chat -q` bug from v1.3.x is fixed.

### Removed

- Hardcoded "Piyush" / "Senior Software Engineer" prompts. The AI tools now read from your profile. The default seed profile is a nurse (Bob Smith) to prove the system is profession-agnostic.
- `subprocess` calls from the plugin. The plugin is now a stateless HTTP client.

### Tests

- **133 backend pytest tests** (up from 115). New: 3 tests for `POST /profile/from_yaml`.
- **110 JS vitest tests** (up from 109). New: 1 Sidebar test for the dynamic profile name.
- **243 total tests, all green.**

### Migration from v1.3.x

v1.3.x users do **not** need to do anything. The localStorage app data format is unchanged. The new Backend Profile is additive. To use the new AI features:

1. `uv sync` to install the backend deps
2. `python3 -m backend.cli serve` to start the backend
3. Visit `/onboarding` to create your profile
4. All v1.3.x pages still work as before

---

## [1.2.0] - 2026-06-13

### Added

- **Hardened store API** — all CRUD ops return booleans (success) instead of `void`, adders return the persisted entity, no array mutation in getters
- **Input validation** — `addApplication`, `addSkill`, `addContact`, `addOffer`, `addCompany`, `addResume` now throw on missing required fields
- **Auto-generated IDs** — `ensureId<T>()` helper generates prefixed IDs (`app_xxx`, `ctc_xxx`, `ofr_xxx`, etc.) when missing
- **Strict import validation** — `importData()` rejects empty strings, non-objects, and missing required fields
- **ErrorBoundary component** — catches render errors, shows friendly fallback with Try Again / Reload
- **Production scripts** — `scripts/start.sh`, `scripts/stop.sh`, `scripts/healthcheck.sh`
- **Docker healthcheck** — container-level healthcheck via `curl /` every 30s
- **CI hardening** — `npm audit`, bundle size guard (JS ≤ 512KB, CSS ≤ 100KB)
- **Prettier + EditorConfig** — consistent formatting across editors
- **`.npmrc`** — stable installs (no funding messages, audit off by default for speed)
- **Verification script** — `npm run verify` runs typecheck + lint + test + build in one command
- 15 new tests for validation, CRUD return types, and data integrity
- `ErrorBoundary.test.tsx` with 4 tests (render, throw, custom fallback, reset)

## [1.1.0] - 2026-06-13

### Added

- **Settings & Profile** — customize candidate profile, target rate/salary, theme, import/export/reset data
- **Offer Comparison** — score and compare offers on comp, remote, PTO
- **Job Comparison** — side-by-side pros/cons and auto-score two roles
- **Contacts / Network Tracker** — recruiters, referrals, hiring managers
- **Daily Journal** — log wins, blockers, learnings, next steps
- **PWA Support** — installable app, offline service worker, manifest, icons
- **Keyboard Shortcuts** — Ctrl/Cmd + letter navigation across pages
- Auto-migration for new data model fields (profile, theme, contacts, offers, journal, lastBackup)
- Backup reminders when 7+ days since last export

## [1.0.0] - 2026-06-13

### Added

- Initial release of Interview Prep Portal
- Dashboard with application pipeline and study progress
- Application tracking with status, notes, dates, and contacts
- Interview prep notes and question tracking
- Skills matrix with gap analysis
- Resume versioning
- Company research profiles
- 7 structured learning paths with progress tracking
- 35+ flashcards with spaced repetition practice
- 35+ curated resources with search and filtering
- JD Evaluator page for scoring job descriptions
- Hermes Agent `career-prep` plugin with 8 tools
- `/prep` slash commands and `hermes career-prep` CLI
- 40+ unit tests using Vitest and React Testing Library
- CI/CD pipeline with GitHub Actions
- Docker + docker-compose support
- Comprehensive documentation (README, ARCHITECTURE, HERMES_PLUGIN, DATA_MODEL)
- Open-source governance files (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT)
- GitHub issue and PR templates

