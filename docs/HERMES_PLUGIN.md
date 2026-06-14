# Hermes Agent Plugin Guide

The Career Prep plugin turns Hermes Agent into your personal job-search assistant.

## What It Does

- Evaluates job descriptions against your profile
- Generates tailored cover letters
- Researches companies
- Scans job boards
- Creates STAR interview stories
- Generates negotiation scripts
- Serves the Interview Prep Portal dashboard
- Reads your portal stats

## Installation

### From the repo

```bash
cd interview-prep-portal
bash scripts/install-plugin.sh
hermes plugins enable career-prep
```

### Manual

```bash
mkdir -p ~/.hermes/plugins/career-prep
cp -r plugin/career-prep/* ~/.hermes/plugins/career-prep/
hermes plugins enable career-prep
```

## Verification

```bash
hermes plugins list | grep career-prep
# Should show: career-prep | enabled | 1.0.0
```

Start a Hermes session:

```bash
hermes
```

You should see the Career Prep banner at session start.

## Slash Commands

All commands start with `/prep`:

| Command | Example | Description |
|---------|---------|-------------|
| `help` | `/prep` | Show commands |
| `evaluate` | `/prep evaluate https://jobs.co/ai-engineer` | Evaluate a JD |
| `cover` | `/prep cover Anthropic "AI Engineer"` | Cover letter |
| `research` | `/prep research "OpenAI"` | Company research |
| `scan` | `/prep scan` | Find jobs |
| `stories` | `/prep stories leadership` | Interview stories |
| `negotiate` | `/prep negotiate` | Negotiation script |
| `portal` | `/prep portal` | Open dashboard |
| `status` | `/prep status` | Pipeline stats |

## CLI Commands

```bash
hermes career-prep                    # Show help
hermes career-prep serve              # Start web portal
hermes career-prep status             # Show stats
hermes career-prep evaluate URL       # Evaluate JD
hermes career-prep cover CO ROLE      # Generate cover letter
hermes career-prep research CO        # Research company
```

## Tool Details

### evaluate_jd

Uses web extraction + LLM reasoning to produce a structured A-F evaluation:

- A) Role Summary
- B) CV Match Score (1-5)
- C) Level Strategy
- D) Compensation Research
- E) Personalization Hooks
- F) Interview Prep Roadmap

### generate_cover_letter

Generates a tailored cover letter in markdown. Angles:

- `impact` — what you'll deliver (default)
- `why_them` — why you want the company
- `why_me` — why you're the right fit
- `mission` — alignment with mission

### research_company

Searches the web for recent news, products, leadership, culture, and interview process.

### scan_jobs

Searches LinkedIn, Indeed, Wellfound for roles matching your profile.

### generate_interview_stories

Produces STAR+Reflection stories. Focus areas:

- leadership
- conflict
- failure
- innovation
- collaboration
- technical

### generate_negotiation_script

Takes offer details and produces talking points, anchor strategies, and phrasing.

### serve_portal

Starts the Interview Prep Portal React app at `http://localhost:8766`.

### portal_status

Returns a JSON summary of your applications, interviews, skills, and study progress.

## Development

Edit plugin files in `plugin/career-prep/`:

```
plugin/career-prep/
├── __init__.py      # Registration + CLI + slash commands
├── plugin.yaml      # Manifest
├── schemas.py       # Tool schemas
├── tools.py         # Tool implementations
└── skills/
    └── career-prep/
        └── SKILL.md   # Bundled skill
```

After editing, reinstall:

```bash
bash scripts/install-plugin.sh
```

## Troubleshooting

**Plugin not showing?**

```bash
hermes plugins list
hermes plugins enable career-prep
```

**Tools not being called?**

Make sure the model knows about the tools. Tools are auto-discovered when the plugin loads.

**Portal won't start?**

Check that `npm run build` succeeded and `dist/` exists. The plugin serves files from the portal's `dist/` directory.

## Extending

To add a new tool:

1. Add a schema in `schemas.py`
2. Add a handler in `tools.py`
3. Register it in `__init__.py`
4. Document it here and in `SKILL.md`

