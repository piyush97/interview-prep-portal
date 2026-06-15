# Product Refinement Audit

Date: 2026-06-15

## Product North Star

Interview Prep Portal should be a job-search command center for any candidate: humans using it manually, AI agents using the backend/tool layer, and hybrid users who want the portal to keep the system grounded in real profile, pipeline, prep, and offer data.

## Current Strengths

- Broad workflow coverage: applications, JD evaluation, resumes, interview prep, flashcards, learning, contacts, offers, reminders, journal, research, settings, and onboarding.
- Agent-agnostic backend: Hermes, Claude Code, Codex, HTTP, and offline profiles can share the same tool contract.
- Profile-driven prompts: backend avoids baking one person's career into generated materials.
- Local-first privacy: browser app data and backend profile stay local by default.
- Plugin shim now routes through the backend instead of duplicating prompts or shelling out to stale commands.

## Biggest Gaps

1. **No guided workflow from saved JD to full prep packet.**
   Saving a JD should trigger a checklist: tailor resume, generate cover letter, research company, prep interview questions, add follow-up reminder, add contacts.

2. **Resume and JD evaluation are not tightly connected yet.**
   The evaluator can save an application, but it does not compare against a selected resume version or produce a keyword gap map.

3. **Interview prep lacks rehearsal feedback.**
   It stores questions and answers, but does not score answers for structure, evidence, clarity, or role fit.

4. **Learning paths still skew technical.**
   Universal profiles exist, but default resources and flashcards remain software-heavy.

5. **No explicit data health/backup guardrail in daily workflow.**
   Backup exists in settings, but dashboard should surface stale backup risk.

6. **No import path from real job boards beyond agent search.**
   Users still paste roles manually. A browser extension/bookmarklet or CSV import would reduce friction.

## Add

- **Application prep packet**: one generated page per application with JD summary, resume version, cover letter, company research, interview questions, recruiter contacts, follow-up plan, and notes.
- **Resume-to-JD matrix**: must-have requirements, evidence bullets, missing proof, keywords, and suggested resume edits.
- **Answer coach**: score answers for STAR/SOAR structure, specificity, metrics, concision, and confidence. Store improved versions.
- **Universal starter decks**: healthcare, education, marketing/sales, operations, finance, design, customer success, trades, and general behavioral.
- **Pipeline health model**: target active applications, follow-up aging, upcoming interviews, open offers, stale research, backup status.
- **Import/export upgrades**: CSV import for applications/contacts, markdown export for prep packets, printable interview brief.
- **Accessibility pass**: keyboard flow, aria labels for icon-only buttons, focus visibility, color contrast for status badges.

## Remove

- Stale Hermes-specific docs that imply tools call a Hermes subprocess directly.
- Person-specific examples in default runtime paths. Keep named examples only in profile fixtures and tests that explicitly prove no leakage.
- Passive dashboard-only stats without an action. Every metric should answer "what next?"
- Duplicate configuration concepts where local browser profile and backend YAML profile can confuse users. Keep copy clear until they merge.

## Refine

- **Dashboard**: evolve readiness score into explainable category scores with direct links to fix weak areas.
- **JD Evaluator**: show confidence/source badges, backend status, and a profile completeness warning before AI analysis.
- **Applications**: add stage-specific empty states and quick actions per row.
- **Resume**: support cloning, tagging, selected default resume, and application attachment.
- **Interview Prep**: connect to applications and company research; add date/time, stage rubric, and rehearsal state.
- **Settings/Onboarding**: make backend profile the primary path and local UI profile a legacy or lightweight display preference.
- **Plugin**: keep it thin. All durable behavior should live in backend tools and shared schemas.

## Production Gates

- `npm run verify` must pass with zero lint errors.
- Browser smoke must cover dashboard, JD evaluator, applications, settings, and at least one mobile viewport.
- No runtime source file may hardcode a maintainer persona into candidate-facing output.
- Plugin tests must mock HTTP, not subprocess calls.
- New user first run must show a clear path: complete profile -> paste JD -> save application -> build prep packet.

## Near-Term Priority

1. Add application prep packet.
2. Add resume-to-JD matrix.
3. Add answer coach.
4. Expand non-technical starter decks.
5. Merge or clearly separate local and backend profile concepts.
