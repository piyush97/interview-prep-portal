# Data Model

All data is stored in a single localStorage key: `interview-prep-portal-v1`.

## Top-Level Schema

```typescript
interface AppData {
  version: string;
  profile: UserProfile;
  applications: Application[];
  interviews: Interview[];
  skills: Skill[];
  companies: CompanyResearch[];
  resumes: ResumeVersion[];
  learningPaths: LearningPath[];
  flashcards: Flashcard[];
  resources: CuratedResource[];
  contacts: Contact[];
  offers: Offer[];
  journal: JournalEntry[];
  theme: "light" | "dark" | "system";
}
```

## Entities

### UserProfile

```typescript
interface UserProfile {
  name: string;
  title: string;
  summary: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  location: string;
  targetRate: number;        // hourly C2C rate
  targetSalary: number;      // annual FTE target
  workAuthorization: string; // e.g. "Canadian PR"
  relocation: string;        // e.g. "No"
  availability: string;      // e.g. "2 weeks"
  preferences: string[];     // e.g. ["remote", "AI-first"]
}
```

### Application

```typescript
interface Application {
  id: string;
  company: string;
  role: string;
  status: "wishlist" | "applied" | "phone" | "interview" | "offer" | "rejected" | "ghosted";
  dateApplied: string;       // ISO date
  url: string;
  location: string;
  salaryRange: string;
  notes: string;
  contacts: string[];        // contact IDs
  interviews: string[];      // interview IDs
  createdAt: string;
  updatedAt: string;
}
```

### Interview

```typescript
interface Interview {
  id: string;
  applicationId: string;
  type: "phone" | "video" | "onsite" | "takehome" | "technical" | "behavioral";
  date: string;              // ISO datetime
  duration: number;          // minutes
  interviewer: string;
  notes: string;
  prepNotes: string;
  feedback: string;
}
```

### Skill

```typescript
interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;             // 1-5
  targetLevel: number;       // 1-5
  notes: string;
  resources: LinkResource[];
}
```

### CompanyResearch

```typescript
interface CompanyResearch {
  id: string;
  name: string;
  industry: string;
  size: string;
  stage: string;             // startup, growth, enterprise
  products: string[];
  techStack: string[];
  competitors: string[];
  culture: string;
  recentNews: string;
  interviewProcess: string;
  pros: string[];
  cons: string[];
  questions: string[];
}
```

### ResumeVersion

```typescript
interface ResumeVersion {
  id: string;
  name: string;
  content: string;           // markdown
  targetRoles: string[];
  isDefault: boolean;
}
```

### LearningPath

```typescript
interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  modules: LearningModule[];
}

interface LearningModule {
  id: string;
  title: string;
  completed: boolean;
  resources: LinkResource[];
}
```

### Flashcard

```typescript
interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: number;        // 1-3
  level: number;             // spaced repetition level
}
```

### CuratedResource

```typescript
interface CuratedResource {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  type: "article" | "video" | "course" | "book" | "repo" | "tool" | "newsletter" | "podcast" | "doc";
}
```

### Contact

```typescript
interface Contact {
  id: string;
  name: string;
  role: string;              // recruiter, hiring_manager, referrer, etc.
  company: string;
  email: string;
  linkedin: string;
  notes: string;
  lastContacted: string;
}
```

### Offer

```typescript
interface Offer {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  baseSalary: number;
  bonus: number;
  equity: number;
  equityDesc: string;
  benefits: string;
  location: string;
  remote: string;
  pto: number;
  startDate: string;
  expiryDate: string;
  notes: string;
  score: number;             // calculated score
}
```

### JournalEntry

```typescript
interface JournalEntry {
  id: string;
  date: string;
  wins: string[];
  blockers: string[];
  tomorrow: string[];
  mood: number;              // 1-5
  notes: string;
}
```

## Migrations

When the schema changes, `store.ts` applies migrations in `migrateData()`:

```typescript
function migrateData(data: any): AppData {
  const defaults = defaultData;
  return {
    ...defaults,
    ...data,
    // ensure new fields exist
    contacts: data.contacts ?? defaults.contacts,
    offers: data.offers ?? defaults.offers,
    journal: data.journal ?? defaults.journal,
  };
}
```

## Export Format

Export is a JSON file with the same shape as `AppData`:

```json
{
  "version": "1.0.0",
  "profile": { ... },
  "applications": [ ... ],
  ...
}
```

## Backup Strategy

- Manual export from Settings page
- Automatic backup reminder every 7 days
- Import overwrites current localStorage (with confirmation)

