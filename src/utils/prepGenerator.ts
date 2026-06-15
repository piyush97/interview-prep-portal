import type { Application, InterviewPrep, InterviewQuestion, StoryBankEntry } from "../types";
import { storyToAnswer } from "./storyBank";

const STOP_WORDS = new Set([
  "about", "after", "also", "and", "are", "candidate", "company", "description",
  "for", "from", "have", "include", "including", "interview", "job", "must",
  "need", "our", "role", "that", "the", "this", "with", "work", "you", "your",
]);

const TECH_SIGNALS = [
  "api", "architecture", "automation", "cloud", "data", "database", "design",
  "engineering", "integration", "javascript", "kubernetes", "leadership", "metrics",
  "migration", "platform", "python", "react", "security", "stakeholder", "strategy",
  "system", "testing", "typescript",
];

export function buildPrepFromApplication(
  app: Application,
  stories: StoryBankEntry[],
  id: string,
  now = new Date(),
): InterviewPrep {
  const jdText = app.jdText || "";
  const terms = extractPrepTerms(`${app.role} ${jdText}`);
  const story = selectStory(app, stories);
  const stage = stageFromStatus(app.status);
  const date = app.interviewDate || now.toISOString();

  return {
    id,
    company: app.company,
    role: app.role,
    stage,
    date,
    research: buildResearch(app, terms),
    notes: buildNotes(app, terms, story),
    questions: buildQuestions(app, terms, story),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function buildQuestions(app: Application, terms: string[], story?: StoryBankEntry): InterviewQuestion[] {
  const topTerms = terms.slice(0, 5);
  const termText = topTerms.length ? topTerms.join(", ") : "the highest-impact role requirements";
  const questions: InterviewQuestion[] = [
    {
      category: "general",
      question: `Walk me through why ${app.company}, why this ${app.role} role, and why now.`,
      answer: "",
    },
    {
      category: "behavioral",
      question: `Tell me about a time you delivered measurable impact relevant to ${app.role}.`,
      answer: story ? storyToAnswer(story) : "",
    },
    {
      category: "technical",
      question: `How have you applied ${termText} in real work?`,
      answer: "",
    },
    {
      category: "system-design",
      question: systemDesignQuestion(app, terms),
      answer: "",
    },
    {
      category: "general",
      question: `What smart questions will you ask ${app.company} about success metrics, scope, team, and risks?`,
      answer: "",
    },
  ];

  return questions;
}

function buildResearch(app: Application, terms: string[]) {
  const lines = [
    `${app.company} - ${app.role}`,
    app.url ? `Job posting: ${app.url}` : "",
    terms.length ? `Prep focus: ${terms.slice(0, 8).join(", ")}` : "",
    app.location ? `Location: ${app.location}${app.remote ? " (remote)" : ""}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

function buildNotes(app: Application, terms: string[], story?: StoryBankEntry) {
  const notes = [
    "Generated from saved application. Validate against the latest recruiter notes before interview.",
    app.notes ? `Application notes: ${app.notes}` : "",
    terms.length ? `Map proof to: ${terms.slice(0, 8).join(", ")}` : "",
    story ? `Suggested story: ${story.title}` : "Add one STAR story with metrics before rehearsing.",
    "Close with: role priorities, first 90 days, decision criteria, and next steps.",
  ].filter(Boolean);
  return notes.join("\n");
}

function systemDesignQuestion(app: Application, terms: string[]) {
  const text = `${app.role} ${app.jdText || ""}`.toLowerCase();
  if (/architecture|platform|scale|system|database|api|integration|cloud|data/.test(text)) {
    return `Design a ${app.role.toLowerCase()} solution for ${app.company}: architecture, tradeoffs, reliability, and metrics.`;
  }
  if (/manager|lead|director|stakeholder|strategy|customer/.test(text)) {
    return `How would you structure the first 30-60-90 days for this role and measure success?`;
  }
  const focus = terms[0] || "the main workflow";
  return `How would you improve ${focus} for this team while balancing speed, quality, and risk?`;
}

function stageFromStatus(status: Application["status"]) {
  const stages: Partial<Record<Application["status"], string>> = {
    "phone-screen": "Phone Screen",
    technical: "Technical",
    onsite: "Onsite",
    offer: "Offer Discussion",
  };
  return stages[status] || "Interview";
}

function selectStory(app: Application, stories: StoryBankEntry[]) {
  const target = `${app.role} ${app.jdText || ""}`.toLowerCase();
  return stories
    .map((story) => ({
      story,
      score: [...story.tags, ...story.targetRoles, story.title]
        .filter(Boolean)
        .reduce((sum, token) => sum + (target.includes(token.toLowerCase()) ? 1 : 0), 0)
        + (story.metrics.length > 0 ? 0.5 : 0),
    }))
    .sort((a, b) => b.score - a.score || new Date(b.story.updatedAt).getTime() - new Date(a.story.updatedAt).getTime())[0]?.story;
}

function extractPrepTerms(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9+#.\s-]/g, " ");
  const counts = new Map<string, number>();
  for (const word of normalized.split(/\s+/).map(normalizeWord).filter(Boolean)) {
    if (word.length < 3 || STOP_WORDS.has(word)) continue;
    const weight = TECH_SIGNALS.includes(word) ? 3 : 1;
    counts.set(word, (counts.get(word) || 0) + weight);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word)
    .slice(0, 10);
}

function normalizeWord(word: string) {
  const clean = word.replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, "");
  if (clean.length > 4 && clean.endsWith("ies")) return `${clean.slice(0, -3)}y`;
  if (clean.length > 4 && clean.endsWith("s")) return clean.slice(0, -1);
  return clean;
}
