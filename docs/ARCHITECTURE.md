# Architecture

## Overview

Interview Prep Portal is a **single-page React application** with no backend. Data persistence is handled entirely through the browser's `localStorage`.

The Hermes Agent plugin lives in `plugin/career-prep/` and adds AI-powered tools, slash commands, and CLI commands.

## Design Principles

1. **No backend required** — clone and run anywhere
2. **Privacy-first** — data stays on the user's device
3. **Forkable** — easy to customize profile, content, and theme
4. **AI-native** — works with Hermes Agent for AI workflows
5. **Testable** — all core logic has unit tests

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Build Tool | Vite 6 |
| Routing | React Router v7 |
| Testing | Vitest + React Testing Library |
| Icons | Lucide React |
| Data | localStorage |
| Plugin API | Hermes Agent plugin SDK |

## Component Architecture

```
App.tsx
└── Layout.tsx
    ├── Sidebar.tsx          # Navigation
    ├── Modal.tsx            # Reusable modal
    └── pages/
        ├── Dashboard.tsx
        ├── Applications.tsx
        ├── ApplicationDetail.tsx
        ├── InterviewPrep.tsx
        ├── Skills.tsx
        ├── Resume.tsx
        ├── Research.tsx
        ├── Learn.tsx
        ├── Flashcards.tsx
        ├── Resources.tsx
        ├── JDEvaluator.tsx
        ├── Settings.tsx
        ├── OfferComparison.tsx
        ├── JobComparison.tsx
        ├── Contacts.tsx
        ├── Scheduler.tsx
        └── Journal.tsx
```

## Data Flow

```
User Action → Page Component → store.ts → localStorage
                ↓
          Re-render UI with updated state
```

`store.ts` is the single source of truth. It provides:

- `loadData()` / `saveData()` — localStorage I/O
- `getData()` / `resetData()` — in-memory cache management
- CRUD functions for each entity
- Export/import helpers

## State Management

No Redux or Zustand. State is managed through:

1. `localStorage` for persistence
2. Module-level singleton `_data` for in-memory cache
3. React component state for UI interactions

This keeps the bundle small and the architecture simple.

## Plugin Architecture

The Hermes plugin uses the official plugin API:

```python
# __init__.py
def register(ctx):
    ctx.register_tool(...)
    ctx.register_hook("on_session_start", on_session_start)
    ctx.register_cli_command(...)
    ctx.register_command("prep", _handle_slash)
```

Tools are invoked by the LLM, CLI commands by the user, and slash commands during sessions.

## Build & Deploy

```bash
npm run build     # Creates dist/
                  # Vite bundles for production
```

The `base` path in `vite.config.ts` is set for GitHub Pages. For other hosts, change `base` or use the environment variable `VITE_BASE_PATH`.

## Testing Strategy

- **Unit tests**: Store logic, pure functions
- **Component tests**: StatusBadge, Modal, Sidebar
- **Integration**: Build + CI pipeline
- **No E2E**: Kept lightweight; PWA testing manual

## Security

- No secrets in the repo
- No network requests from the portal (except Hermes plugin tools)
- User data stored locally
- Plugin tools run in subprocesses with sanitized inputs

## Future Considerations

If a backend is ever added:

- Keep localStorage as offline cache
- Add encrypted cloud sync
- Add shareable public profiles
- Add team/collaboration features
