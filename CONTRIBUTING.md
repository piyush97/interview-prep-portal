# Contributing to Interview Prep Portal

Thanks for considering contributing! This project is designed to be forked, cloned, and customized by anyone preparing for technical interviews.

## Quick Start for Contributors

```bash
# 1. Fork the repo
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/interview-prep-portal.git
cd interview-prep-portal

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev

# 5. Run tests
npm test
```

## Project Structure

```
interview-prep-portal/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route-level page components
│   ├── store.ts         # localStorage data layer
│   ├── types.ts         # TypeScript interfaces
│   └── test/            # Unit tests
├── plugin/              # Hermes Agent plugin
├── docs/                # Architecture and guides
├── scripts/             # Utility scripts
└── .github/workflows/   # CI/CD
```

## Development Workflow

We follow **Test-Driven Development (TDD)**:

1. Write a failing test first
2. Write the minimal code to pass
3. Refactor
4. Run `npm test`
5. Run `npm run build`

## Adding Features

When adding a new feature, please also:

- Update relevant TypeScript types in `src/types.ts`
- Add store functions in `src/store.ts` if data is persisted
- Write tests in `src/test/`
- Update the README and relevant docs
- Add a note to `CHANGELOG.md`

## Adding Learning Content

To add flashcards, learning paths, or resources:

1. Edit `src/store.ts`
2. Follow the existing data shape
3. Add unique IDs
4. Run tests and build

## Code Style

- TypeScript strict mode enabled
- Tailwind CSS for styling
- Lucide React for icons
- React Router for navigation

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add offer comparison page
fix: prevent duplicate resource IDs
docs: update plugin installation guide
test: add coverage for contact tracker
```

## Pull Request Process

1. Ensure tests pass: `npm test && npm run build`
2. Update documentation if needed
3. Describe what changed and why
4. Link any related issues

## Reporting Bugs

Open an issue with:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS
- Screenshots if helpful

## Questions?

Open a [Discussion](https://github.com/piyush97/interview-prep-portal/discussions) or ping in the Hermes community.
