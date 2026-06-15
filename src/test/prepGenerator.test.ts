import { describe, expect, it } from "vitest";
import type { Application, StoryBankEntry } from "../types";
import { buildPrepFromApplication } from "../utils/prepGenerator";

const app: Application = {
  id: "app-1",
  company: "Acme AI",
  role: "AI Platform Lead",
  url: "https://example.com/job",
  jdText: "Lead platform architecture, API integrations, cloud reliability, data pipelines, stakeholder strategy, and metrics.",
  status: "technical",
  dateApplied: "2026-06-01T00:00:00.000Z",
  interviewDate: "2026-06-20T15:00:00.000Z",
  contacts: [],
  documents: [],
  notes: "Recruiter wants examples with metrics.",
  timeline: [],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const story: StoryBankEntry = {
  id: "story-1",
  title: "Platform metrics turnaround",
  situation: "Platform reliability was below target.",
  task: "Own recovery.",
  action: "Aligned stakeholders, rebuilt dashboards, and improved API monitoring.",
  result: "Reduced incidents 35%.",
  reflection: "I now make operational metrics visible early.",
  metrics: ["35% fewer incidents"],
  tags: ["platform", "metrics"],
  targetRoles: ["AI Platform Lead"],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

describe("buildPrepFromApplication", () => {
  it("creates a role-specific prep session from an application", () => {
    const prep = buildPrepFromApplication(app, [story], "prep-1", new Date("2026-06-15T12:00:00.000Z"));

    expect(prep.id).toBe("prep-1");
    expect(prep.company).toBe("Acme AI");
    expect(prep.stage).toBe("Technical");
    expect(prep.date).toBe("2026-06-20T15:00:00.000Z");
    expect(prep.questions).toHaveLength(5);
    expect(prep.research).toContain("platform");
    expect(prep.notes).toContain("Suggested story: Platform metrics turnaround");
  });

  it("pre-fills behavioral answer with the strongest matching story", () => {
    const prep = buildPrepFromApplication(app, [story], "prep-1", new Date("2026-06-15T12:00:00.000Z"));
    const behavioral = prep.questions.find((question) => question.category === "behavioral");

    expect(behavioral?.answer).toContain("Situation: Platform reliability was below target.");
    expect(behavioral?.answer).toContain("Result: Reduced incidents 35%.");
  });

  it("falls back cleanly when no story is available", () => {
    const prep = buildPrepFromApplication({ ...app, status: "applied", interviewDate: undefined }, [], "prep-2", new Date("2026-06-15T12:00:00.000Z"));

    expect(prep.stage).toBe("Interview");
    expect(prep.date).toBe("2026-06-15T12:00:00.000Z");
    expect(prep.questions.some((question) => question.answer)).toBe(false);
    expect(prep.notes).toContain("Add one STAR story with metrics before rehearsing.");
  });
});
