export interface Application {
  id: string;
  company: string;
  role: string;
  url: string;
  jdText?: string;
  status: ApplicationStatus;
  dateApplied: string;
  salaryRange?: string;
  location?: string;
  remote?: boolean;
  score?: number; // 1-5 from JD evaluation
  followUpDate?: string;
  interviewDate?: string;
  contacts: Contact[];
  documents: ApplicationDocument[];
  notes: string;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDocument {
  id: string;
  type: "cv" | "cover-letter" | "portfolio" | "other";
  title: string;
  content: string;
  createdAt: string;
}

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "phone-screen"
  | "technical"
  | "onsite"
  | "offer"
  | "rejected"
  | "accepted"
  | "withdrawn";

export interface Contact {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes: string;
}

export interface TimelineEvent {
  date: string;
  type: string;
  description: string;
}

export interface InterviewPrep {
  id: string;
  company: string;
  role: string;
  stage: string;
  date: string;
  questions: InterviewQuestion[];
  notes: string;
  research: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  category: "technical" | "behavioral" | "system-design" | "general";
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: number;
  targetLevel: number;
  priority: "high" | "medium" | "low";
  notes: string;
  resources: Resource[];
}

export type SkillCategory =
  | "frontend"
  | "backend"
  | "ai-ml"
  | "cloud"
  | "database"
  | "devops"
  | "tools"
  | "soft-skills";

export interface Resource {
  title: string;
  url: string;
  type: "article" | "video" | "course" | "book" | "project";
  completed: boolean;
}

export interface CompanyResearch {
  id: string;
  company: string;
  url: string;
  industry: string;
  notes: string;
  products: string[];
  techStack: string[];
  people: Person[];
  culture: string;
  interviewProcess: string;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  name: string;
  role: string;
  linkedin?: string;
  notes: string;
}

export interface ResumeVersion {
  id: string;
  title: string;
  targetRole: string;
  content: string;
  lastUpdated: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: SkillCategory;
  priority: "high" | "medium" | "low";
  modules: LearningModule[];
  completedModules: string[]; // module IDs
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  resources: LinkResource[];
  duration: string; // e.g. "2hrs"
}

export interface LinkResource {
  title: string;
  url: string;
  type: "article" | "video" | "course" | "book" | "repo" | "doc" | "tool";
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: "technical" | "behavioral" | "system-design" | "ai-ml" | "cloud" | "general";
  deck: string; // group name
  difficulty: "easy" | "medium" | "hard";
  level: number; // 1-5 based on how well known
}

export interface CuratedResource {
  id: string;
  title: string;
  url: string;
  description: string;
  category: SkillCategory;
  type: "article" | "video" | "course" | "book" | "repo" | "tool" | "newsletter" | "podcast" | "doc";
  tags: string[];
}

export interface AppData {
  version: string;
  profile: UserProfile;
  theme: "light" | "dark" | "system";
  applications: Application[];
  interviews: InterviewPrep[];
  skills: Skill[];
  companies: CompanyResearch[];
  resumes: ResumeVersion[];
  learningPaths: LearningPath[];
  flashcards: Flashcard[];
  resources: CuratedResource[];
  contacts: StandaloneContact[];
  offers: Offer[];
  journal: JournalEntry[];
  reminders: Reminder[];
  lastBackup?: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  status: "pending" | "done" | "snoozed";
  type: "follow-up" | "interview" | "deadline" | "study" | "general";
  relatedId?: string; // application id or other
  notes?: string;
}

export interface UserProfile {
  name: string;
  title: string;
  summary: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  location: string;
  targetRate: number;
  targetSalary: number;
  workAuthorization: string;
  relocation: string;
  availability: string;
  preferences: string[];
}

export interface StandaloneContact {
  id: string;
  name: string;
  role: string;
  company?: string;
  email?: string;
  linkedin?: string;
  phone?: string;
  notes?: string;
  status: "cold" | "warm" | "inactive";
  lastContacted: string;
}

export interface Offer {
  id: string;
  applicationId?: string;
  company: string;
  role: string;
  level?: string;
  baseSalary: number;
  bonus: number;
  equity: number;
  equityDesc?: string;
  benefits?: string;
  location?: string;
  remote: "fully-remote" | "hybrid" | "onsite";
  pto: number;
  startDate?: string;
  deadline?: string;
  expiryDate?: string;
  notes?: string;
  score: number;
  selected?: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  tags: string[];
  wins?: string[];
  blockers?: string[];
  tomorrow?: string[];
  mood?: number;
  notes?: string;
}

