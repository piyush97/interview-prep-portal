# Interview Prep Portal 🎯

> A complete, open-source interview preparation dashboard for software engineers, AI/ML engineers, and technical professionals. Track applications, practice with flashcards, follow structured learning paths, manage resumes, and research companies — all in one place.

![License](https://img.shields.io/badge/license-MIT-blue)
![Tests](https://github.com/piyush97/interview-prep-portal/actions/workflows/deploy.yml/badge.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## Features

### 📊 Dashboard
- **At-a-glance stats**: active applications, interview stages, offers, rejections
- **Study progress**: learning module completion, flashcards due
- **Recent activity**: last 5 applications with status

### 💼 Application Tracker
- Full CRUD for job applications — company, role, status, salary, location
- **Status pipeline**: Saved → Applied → Phone Screen → Technical → Onsite → Offer → Accepted/Rejected
- **Contacts**: track recruiters, hiring managers, referrals
- **Timeline**: every status change and note is timestamped
- **Notes**: free-form notes per application
- **Export/Import**: JSON backup and restore

### 🧠 Flashcards (Spaced Repetition)
- Pre-seeded with 25+ interview Q&A across:
  - System Design, MCP & Agents, RAG, Behavioral, TypeScript, React, Architecture
- **Decks**: study by topic
- **Practice mode**: rate your recall (knew it / partially / struggled) → level adjusts
- **Due cards**: filter cards needing review (levels 1-4)
- Levels 1-5: lower = less familiar

### 📖 Learning Paths
- 7 structured curricula with 30+ modules:
  - **System Design for AI & Full-Stack** (5 modules)
  - **MCP & Agentic Workflows** (4 modules)
  - **RAG & Vector Databases** (4 modules)
  - **LangChain & LLM Frameworks** (4 modules)
  - **Azure AI Services** (3 modules)
  - **Advanced TypeScript & React Patterns** (3 modules)
  - **Technical & Behavioral Interview Prep** (3 modules)
- Each module has curated resources (docs, repos, videos, courses)
- Check off completed modules → progress tracking

### 🌐 Resources
- 28+ curated links to docs, tools, courses, repos, newsletters
- Filter by category (AI/ML, Frontend, Cloud, DevOps, Career)
- Tag-based search

### 📄 Resume Manager
- Store tailored resume versions for different roles
- Markdown editor with save/load
- Download as `.md`

### 🏢 Company Research
- Track companies you're targeting
- Products, tech stack, culture notes, interview process
- People/contacts tracking

### 📤 Data Portability
- Export all data as JSON
- Import from backup
- Reset to defaults
- All data stored in `localStorage` — zero backend, zero servers

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested with 22)
- npm 9+

### Install & Run

```bash
git clone https://github.com/piyush97/interview-prep-portal.git
cd interview-prep-portal
npm install
npm run dev
```

Open http://localhost:5173/interview-prep-portal/

### Build for Production

```bash
npm run build
npm run preview
```

The built files are in `dist/` — deploy to any static host.

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run specific file
npx vitest run src/test/store.test.ts
```

**Test stack:** Vitest + React Testing Library + jsdom.  
**Coverage:** 40+ tests covering store logic, components, and UI behavior.

Tests follow **strict TDD** (Red-Green-Refactor). See [test-driven-development skill](./.hermes/skills/software-development/test-driven-development/SKILL.md) for methodology.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build | [Vite 8](https://vite.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Routing | [React Router 7](https://reactrouter.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Testing | [Vitest 4](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react) |
| Persistence | localStorage (zero backend) |

---

## Project Structure

```
src/
├── components/     # Reusable UI (Sidebar, Modal, StatusBadge, Layout)
├── pages/          # Route pages (Dashboard, Applications, Learn, Flashcards, etc.)
├── test/           # Unit & component tests
├── store.ts        # Data layer (localStorage CRUD, default data)
├── types.ts        # TypeScript interfaces
├── App.tsx         # Route definitions
├── main.tsx        # Entry point
└── index.css       # Tailwind imports
```

---

## Extending with AI Agents

This portal is designed to be AI-agent friendly:

- **All data is JSON** — agents can read/write `localStorage` via the exported store functions
- **Structured types** — every entity has a TypeScript interface in `types.ts`
- **Seed content** — learning paths, flashcards, and resources are plain data arrays in `store.ts`
- **TDD workflow** — tests validate every store operation and component

### Adding new flashcards

```typescript
// In store.ts, add to defaultFlashcards array:
{
  id: "fc-mycard",
  question: "What is a Bloom Filter?",
  answer: "A probabilistic data structure for set membership testing. False positives possible, false negatives impossible. Uses multiple hash functions.",
  category: "system-design",
  deck: "System Design",
  difficulty: "hard",
  level: 1  // Start at 1 (needs practice)
}
```

### Adding new learning paths

```typescript
// In store.ts, add to defaultLearningPaths:
{
  id: "lp-my-path",
  title: "Kubernetes for AI Workloads",
  description: "Deploying and scaling LLM inference on Kubernetes",
  category: "devops",
  priority: "medium",
  completedModules: [],
  modules: [
    {
      id: "lp-m1",
      title: "K8s Fundamentals",
      description: "Pods, deployments, services, configmaps",
      duration: "3hrs",
      resources: [
        { title: "K8s Docs", url: "https://kubernetes.io/docs/", type: "doc" }
      ]
    }
  ]
}
```

---

## Roadmap

- [x] Application tracking with status pipeline
- [x] Interview prep with company-specific Q&A
- [x] Skills matrix with gap analysis
- [x] Resume version management
- [x] Company research
- [x] Structured learning paths with resources
- [x] Flashcards with spaced repetition
- [x] Curated resource library
- [x] Data export/import
- [x] Comprehensive test suite
- [ ] Dark mode
- [ ] AI-powered interview question generator
- [ ] GitHub Gist sync for data portability
- [ ] Collaborative resume feedback

---

## Contributing

PRs welcome! This project follows TDD — please write tests before code.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Write a failing test (RED)
4. Implement the feature (GREEN)
5. Refactor if needed
6. Run `npm test` to verify everything passes
7. Commit and push
8. Open a Pull Request

---

## License

MIT — use freely, modify freely, share freely.

Built by [Piyush Mehta](https://github.com/piyush97) for the job-seeking community.
