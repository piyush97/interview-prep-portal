import type { Application } from "../types";
import type { ResumeMatchAnalysis } from "./resumeMatch";

export type PrepChecklistItem = {
  label: string;
  done: boolean;
  detail: string;
};

export type PrepPacketContext = {
  resumeTitle?: string;
  resumeMatch?: ResumeMatchAnalysis | null;
};

export function extractPrepSignals(app: Application) {
  const text = `${app.jdText || ""} ${app.notes || ""}`.toLowerCase();
  const signals = [
    "technical", "case study", "presentation", "panel", "behavioral", "portfolio",
    "assignment", "coding", "scenario", "stakeholder", "customer", "leadership",
    "communication", "license", "certification", "degree", "travel", "on-call",
  ];
  return signals.filter((signal) => text.includes(signal)).slice(0, 8);
}

export function prepChecklist(app: Application): PrepChecklistItem[] {
  const hasJd = Boolean(app.jdText?.trim());
  const hasContacts = app.contacts.length > 0;
  const hasFollowUp = Boolean(app.followUpDate);
  const hasInterview = Boolean(app.interviewDate || ["phone-screen", "technical", "onsite"].includes(app.status));
  const hasDocs = app.documents.length > 0;
  const hasNotes = Boolean(app.notes?.trim());
  return [
    { label: "JD captured", done: hasJd, detail: hasJd ? "Role requirements saved" : "Paste the full JD for better prep" },
    { label: "Resume or cover letter attached", done: hasDocs, detail: hasDocs ? `${app.documents.length} document(s)` : "Attach a tailored resume or cover letter" },
    { label: "Contact path", done: hasContacts, detail: hasContacts ? `${app.contacts.length} contact(s)` : "Add recruiter, referral, or hiring manager" },
    { label: "Interview plan", done: hasInterview, detail: hasInterview ? "Stage needs prep coverage" : "Create prep once interview is scheduled" },
    { label: "Follow-up date", done: hasFollowUp, detail: hasFollowUp ? new Date(app.followUpDate || "").toLocaleDateString() : "Set next follow-up" },
    { label: "Notes and positioning", done: hasNotes, detail: hasNotes ? "Notes available" : "Add why-you/why-them notes" },
  ];
}

export function buildPrepPacket(app: Application, context: PrepPacketContext = {}) {
  const checklist = prepChecklist(app);
  const signals = extractPrepSignals(app);
  return `# ${app.company} - ${app.role} Prep Packet

## Snapshot
- Status: ${app.status}
- Location: ${app.location || "Not set"}${app.remote ? " (remote)" : ""}
- Salary: ${app.salaryRange || "Not set"}
- Job URL: ${app.url || "Not set"}

## Readiness Checklist
${checklist.map((item) => `- [${item.done ? "x" : " "}] ${item.label}: ${item.detail}`).join("\n")}

## Resume Match
${resumeMatchMarkdown(context)}

## Positioning
- Why this role: Add 2-3 specific reasons tied to company, team, product, mission, or customers.
- Why you: Map 3 achievements to the highest-value requirements.
- Risk to clarify: Ask about scope, interview stages, compensation range, schedule, and success metrics.

## Detected Prep Signals
${signals.length ? signals.map((signal) => `- ${signal}`).join("\n") : "- No strong signals detected yet. Add the full JD for better extraction."}

## Follow-Up Plan
${followUpPlanMarkdown(app)}

## Contacts
${app.contacts.length ? app.contacts.map((c) => `- ${c.name}${c.role ? `, ${c.role}` : ""}${c.email ? ` (${c.email})` : ""}`).join("\n") : "- Add recruiter, referral, or hiring manager."}

## Notes
${app.notes || "Add application notes, talking points, recruiter context, and blockers."}

## JD
${app.jdText || "Paste the job description into the application for a complete packet."}
`;
}

export function buildCompanyResearchSeed(app: Application) {
  const signals = extractPrepSignals(app);
  const lines = [
    `${app.company} - ${app.role}`,
    app.url ? `Job posting: ${app.url}` : "",
    signals.length ? `Interview signals: ${signals.join(", ")}` : "Interview signals: add full JD to improve detection.",
    app.notes ? `Application notes: ${app.notes}` : "",
    "Research next: products, customers, business model, recent news, competitors, team priorities, interview process.",
  ].filter(Boolean);
  return lines.join("\n");
}

export function nextFollowUpDate(from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + 2);
  if (date.getDay() === 6) date.setDate(date.getDate() + 2);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function resumeMatchMarkdown({ resumeTitle, resumeMatch }: PrepPacketContext) {
  if (!resumeMatch) return "- Not scored yet. Select a resume version to add fit evidence.";
  const matched = resumeMatch.matchedTerms.map((term) => term.term).slice(0, 8);
  const missing = resumeMatch.missingTerms.map((term) => term.term).slice(0, 8);
  return [
    `- Resume: ${resumeTitle || "Selected resume"}`,
    `- JD keyword coverage: ${resumeMatch.score}%`,
    `- Matched: ${matched.length ? matched.join(", ") : "No strong matches yet"}`,
    `- Missing or underplayed: ${missing.length ? missing.join(", ") : "No obvious keyword gaps"}`,
    resumeMatch.evidenceLines.length
      ? `- Evidence lines:\n${resumeMatch.evidenceLines.map((line) => `  - ${line}`).join("\n")}`
      : "- Evidence lines: Add quantified bullets that mirror the missing terms.",
  ].join("\n");
}

function followUpPlanMarkdown(app: Application) {
  if (app.followUpDate) return `- Next follow-up: ${new Date(app.followUpDate).toLocaleDateString()}`;
  if (["rejected", "accepted", "withdrawn"].includes(app.status)) return "- No follow-up needed for closed status unless you want to reopen the relationship.";
  return "- Set a follow-up reminder 2 business days from now unless recruiter gave another timeline.";
}
