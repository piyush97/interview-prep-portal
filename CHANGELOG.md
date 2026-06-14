# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

