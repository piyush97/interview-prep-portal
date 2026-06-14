# 🎯 Interview Prep Portal

> A complete, open-source interview preparation dashboard for software engineers, AI/ML engineers, and technical professionals.

Track applications, evaluate job descriptions, practice with flashcards, compare offers, manage contacts, schedule interviews, and run your entire job search like a senior architect.

Pairs with the **Career Prep** Hermes Agent plugin for AI-powered JD evaluation, cover letters, company research, negotiation scripts, and interview story generation.

---

## 🚀 Why This Exists

Most job-hunt tools are either:

- **Spreadsheets** that don't help you prepare
- **Career coaches** that cost money
- **Generic job boards** that don't understand your profile

This portal is **opinionated but forkable**. It bundles everything you need to run a modern, data-driven job search:

- Application pipeline with status tracking
- JD evaluation with CV match scoring
- Spaced-repetition flashcards
- Structured learning paths
- Company research
- Offer comparison
- Interview scheduling + contact tracker
- Daily journal
- ATS-friendly resume versioning
- Hermes Agent native integration

All data lives in **your browser** (localStorage). No backend, no account, no lock-in.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Pipeline overview, upcoming interviews, study progress, flashcards due |
| **Applications** | Track every role with status, notes, dates, JD, contacts, interviews |
| **JD Evaluator** | Paste a JD, get structured A-F scoring, match analysis, prep roadmap |
| **Interview Prep** | Per-application prep notes, questions, answers, company context |
| **Flashcards** | 35+ cards across system design, AI/ML, TypeScript, React, behavioral |
| **Learn** | 7 structured learning paths with modules, resources, progress tracking |
| **Resources** | 35+ curated links by topic with search + filtering |
| **Skills Matrix** | Rate yourself across 15+ skills, track gaps |
| **Resume** | Version your resume and tailor for specific roles |
| **Research** | Company profiles, SWOT, recent news, interview intel |
|| **Settings** | Profile, theme, import/export/reset, backup reminders |
|| **Offer Comparison** | Compare offers on comp, remote, PTO with auto-scoring |
|| **Job Comparison** | Side-by-side pros/cons before applying |
|| **Contacts** | Track recruiters, hiring managers, referrals, last contacted |
|| **Scheduler** | Interview schedule with dates, times, prep links |
|| **Daily Journal** | Daily standup-style log for your job hunt |
|| **Data Portability** | Export/import JSON, automatic backups, schema migrations |
|| **PWA** | Installable app with offline service worker |
|| **Keyboard Shortcuts** | Ctrl/Cmd + letter navigation across pages |
|| **Hermes Plugin** | Native AI tools for cover letters, research, negotiation, stories |

---

## 📱 Live Demo

Deploy to GitHub Pages automatically via the included CI workflow, or run locally.

```bash
# Run locally
npm install
npm run dev
```

---

## 📝 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/piyush97/interview-prep-portal.git
cd interview-prep-portal
npm install
```

### 2. Run

```bash
npm run dev
# Open http://localhost:5173/interview-prep-portal/
```

### 3. Test

```bash
npm test
```

### 4. Build

```bash
npm run build
```

---

## 📦 Docker

```bash
# Run with Docker Compose
docker-compose up --build

# Open http://localhost:8766
```

Or with plain Docker:

```bash
docker build -t interview-prep-portal .
docker run -p 8766:80 interview-prep-portal
```

---

## 🤖 Hermes Agent Plugin

This project is designed to be a **first-class Hermes Agent citizen**.

### Install

```bash
bash scripts/install-plugin.sh
hermes plugins enable career-prep
```

### In-session Commands

```
/prep                 Show all commands
/prep evaluate URL    Evaluate a job description
/prep cover CO ROLE   Generate a cover letter
/prep research CO     Research a company
/prep scan            Find matching jobs
/prep stories         Generate STAR interview stories
/prep negotiate       Get negotiation scripts
/prep portal          Open the web dashboard
/prep status          Show your pipeline stats
```

### CLI Commands

```bash
hermes career-prep serve         # Start web portal
hermes career-prep status        # Your stats
hermes career-prep evaluate URL  # Evaluate a JD
hermes career-prep cover CO ROLE # Generate cover letter
hermes career-prep research CO   # Research company
```

### Available Tools

| Tool | Purpose |
|------|---------|
| `evaluate_jd` | Score a JD against your profile |
| `generate_cover_letter` | Tailored cover letter |
| `research_company` | Company deep-dive |
| `scan_jobs` | Search job boards |
| `generate_interview_stories` | STAR stories |
| `generate_negotiation_script` | Negotiation talking points |
| `serve_portal` | Start/stop web dashboard |
| `portal_status` | Pipeline stats |

---

### Keyboard Shortcuts

Press `Ctrl` (Windows/Linux) or `Cmd` (Mac) plus:

| Key | Page |
|-----|------|
| `D` | Dashboard |
| `A` | Applications |
| `I` | Interviews |
| `S` | Skills |
| `F` | Flashcards |
| `R` | Resources |
| `E` | JD Evaluator |
| `O` | Offers |
| `J` | Journal |
| `,` | Settings |

---

## 📂 Project Structure

```
interview-prep-portal/
├── public/              # Static assets
├── src/
│   ├── components/      # UI components
│   ├── pages/           # Route pages
│   ├── store.ts         # localStorage data layer
│   ├── types.ts         # TypeScript types
│   └── test/            # Tests
├── plugin/              # Hermes Agent plugin
├── scripts/             # Install & utility scripts
├── docs/                # Detailed documentation
├── .github/workflows/   # CI/CD + issue templates
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .env.example
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── LICENSE
```

---

## 🔧 Customization

### Your Profile

Open **Settings** in the portal, or edit `src/store.ts`:

```typescript
const defaultProfile: UserProfile = {
  name: "Your Name",
  title: "Your Role",
  summary: "Your one-line pitch",
  targetRate: 120,
  targetSalary: 160000,
  location: "Remote / Toronto",
  skills: [...],
};
```

### Learning Content

Add flashcards, learning paths, or resources in `src/store.ts`.

### Themes

Toggle between light and dark themes in the Settings page.

---

## 📊 Data & Privacy

- **No backend**: All data is stored in your browser's localStorage
- **Export anytime**: Settings → Export JSON
- **Import**: Drag-and-drop JSON backup
- **Migrate**: Automatic schema migrations on version updates
- **Private**: Your data never leaves your machine unless you export it

---

## 🧪 Testing

```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

We use:

- Vitest
- React Testing Library
- jsdom

---

## 🚀 Deploy

### GitHub Pages

1. Push to `main`
2. GitHub Actions builds and deploys automatically
3. Visit `https://yourusername.github.io/interview-prep-portal/`

### Other Hosts

```bash
npm run build
# Deploy the `dist/` folder to Netlify, Vercel, Cloudflare Pages, etc.
```

---

## 🎯 Roadmap

- [ ] AI-native JD parsing from URLs
- [ ] Cloud sync option (encrypted)
- [ ] Mobile app (PWA improvements)
- [ ] Resume PDF generation
- [ ] LinkedIn integration
- [ ] Calendar sync for interviews
- [ ] More learning paths (ML ops, platform engineering)
- [ ] Multi-language support

See [ROADMAP.md](docs/ROADMAP.md) for details.

---

## 👨‍💼 Built For

- Software Engineers
- AI/ML Engineers
- Full-Stack Developers
- Technical Leads
- Staff+ Engineers
- Anyone running a serious job search

---

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Hermes Plugin Guide](docs/HERMES_PLUGIN.md)
- [Data Model](docs/DATA_MODEL.md)
- [Contributing](CONTRIBUTING.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)

---

## 💝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📜 License

MIT License. See [LICENSE](LICENSE).

## 💫 Acknowledgements

- Inspired by [career-ops](https://github.com/santifer/career-ops)
- Built with React, TypeScript, Tailwind CSS, Vite, and Hermes Agent
