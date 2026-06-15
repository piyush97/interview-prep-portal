---
name: career-prep
description: "AI-powered career preparation: evaluate JDs, generate cover letters & CVs, research companies, scan jobs, practice interviews, negotiate offers. Works with the Interview Prep Portal React dashboard."
version: 1.0.0
---

# Career Prep — AI-Powered Job Search System

## Overview

Career Prep is a Hermes Agent plugin that turns the agent into a complete job search command center. It works standalone through the agent's tools, slash commands, and CLI, plus pairs with the Interview Prep Portal web dashboard for visual tracking.

Inspired by [career-ops](https://github.com/santifer/career-ops).

## Quick Start

### Enable the plugin

```bash
hermes plugins enable career-prep
```

Restart your Hermes session. The `/prep` slash command is now available.

### One-shot via CLI

```bash
hermes career-prep evaluate "https://jobs.example.com/ai-engineer"
hermes career-prep cover "Anthropic" "AI Engineer"
hermes career-prep research "OpenAI" --role "MCP Engineer"
hermes career-prep serve
hermes career-prep status
```

### Web Portal

```bash
hermes career-prep serve
# Opens at http://localhost:8766/interview-prep-portal/
```

The portal provides visual tracking for applications, learning paths, flashcards, and company research.

## Tools

### evaluate_jd
Evaluate a job description against your profile.
- **Input**: URL to job posting or pasted JD text
- **Output**: Structured A-F evaluation with score, match analysis, prep roadmap
- **Use when**: User pastes a job link, asks "is this role good for me?"

### generate_cover_letter
Generate a tailored, ATS-optimized cover letter.
- **Required**: company name, role title
- **Optional**: job description (for keyword matching), angle (impact/why_them/why_me/mission)
- **Use when**: User needs a cover letter for a specific application

### research_company
Deep research on a target company.
- **Input**: company name, optional role
- **Output**: Products, tech stack, culture, recent news, interview process, talking points
- **Use when**: Before an interview or deciding whether to apply

### scan_jobs
Search job boards for matching roles.
- **Optional**: search terms, location, max results
- **Use when**: "Find me AI Engineer jobs in Toronto"

### generate_interview_stories
Create STAR+Reflection stories for behavioral interviews.
- **Focuses**: leadership, conflict, failure, innovation, collaboration, technical
- **Use when**: Preparing for behavioral interviews

### generate_negotiation_script
Generate salary negotiation talking points.
- **Input**: offer details (comp, company, role)
- **Output**: Anchor strategy, talking points, phrasing, leverage points
- **Use when**: User has an offer and needs to negotiate

### serve_portal
Start/stop the Interview Prep Portal web dashboard.

### portal_status
Quick summary of your application pipeline and study progress.

## Slash Commands

| Command | Description |
|---------|-------------|
| `/prep` | Show all commands |
| `/prep evaluate <url>` | Evaluate a job description |
| `/prep cover <co> <role>` | Generate cover letter |
| `/prep research <co>` | Research a company |
| `/prep scan` | Find new job opportunities |
| `/prep stories` | Generate interview stories |
| `/prep negotiate` | Get a negotiation script |
| `/prep portal` | Open web dashboard |
| `/prep status` | Your application stats |

## User Profile

Configure your profile in the Interview Prep Portal web dashboard for personalized evaluations. The default profile is intentionally blank so the tools do not leak a maintainer persona into another job seeker's materials.

Fill in:
- **Identity**: name, contact, location, work authorization
- **Career**: current title, level, industry, target roles
- **Skills**: core skills, growing skills, certifications
- **Compensation**: salary/rate targets, negotiability
- **Work history**: concrete outcomes, tools, scope, and story seeds
- **Agent**: Hermes, Claude Code, Codex, HTTP, or offline mode

Edit through Settings or Onboarding. The backend profile file is the source of truth for AI-generated materials.

## Architecture

```
User → Hermes Agent → /prep slash → Tool dispatch → local backend
                         │
                    ┌────┴────┐
                    │ Plugin │
                    ├─────────┤
                    │ evaluate_jd          → POST /api/evaluate_jd
                    │ cover_letter         → POST /api/cover_letter
                    │ research_company     → POST /api/research_company
                    │ scan_jobs            → POST /api/scan_jobs
                    │ interview_stories    → POST /api/interview_stories
                    │ negotiation_script   → POST /api/negotiation_script
                    │ portal_status        → GET /health + /profile
                    └─────────┘
                         │
                    Python backend
                         │
                    Profile + chosen AI agent
                         │
                    Web Portal (React SPA)
                    localhost:8766
```

## Tips

- **First evaluations won't be perfect** — feed the system more context through the portal
- **Score threshold**: Only apply to roles scoring 4.0+/5
- **The portal is your truth** — all data persisted in localStorage, export as JSON
- **Combine tools**: evaluate a JD, then generate a cover letter, then research the company
- **Use the portal for spaced repetition**: 30+ flashcards, 7 learning paths, 35+ curated resources
