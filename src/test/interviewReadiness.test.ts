import { describe, expect, it } from "vitest";
import type { InterviewPrep } from "../types";
import { buildInterviewReadiness } from "../utils/interviewReadiness";

function prep(overrides: Partial<InterviewPrep> = {}): InterviewPrep {
  return {
    id: "prep-1",
    company: "Acme",
    role: "Product Manager",
    stage: "Panel",
    date: "2026-06-18T12:00:00.000Z",
    questions: [],
    notes: "",
    research: "",
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildInterviewReadiness", () => {
  it("flags empty prep as not started with concrete next actions", () => {
    const result = buildInterviewReadiness(prep(), new Date("2026-06-15T12:00:00.000Z"));

    expect(result.level).toBe("not-started");
    expect(result.score).toBeLessThan(35);
    expect(result.answeredCount).toBe(0);
    expect(result.nextActions).toContain("Add company research and role-specific talking points.");
    expect(result.nextActions).toContain("Write the interview plan: logistics, risks, questions, and close.");
  });

  it("rewards researched prep with category coverage and strong answers", () => {
    const result = buildInterviewReadiness(prep({
      research: "Market, product, customers, team priorities.",
      notes: "Clarify scope, success metrics, and cross-functional expectations.",
      questions: [
        {
          category: "behavioral",
          question: "Tell me about a launch.",
          answer: "Situation: Launch quality was slipping across three squads. Task: I owned the recovery plan. Action: I built a rubric, aligned leaders, and reviewed metrics weekly. Result: defects fell 31% and launch confidence increased. Reflection: I now align teams on one measurable outcome first.",
        },
        {
          category: "technical",
          question: "How would you evaluate a platform migration?",
          answer: "I would define constraints, compare options, model risk, create measurable checkpoints, and communicate tradeoffs. Result: the team can choose an approach with clear ownership and rollback criteria.",
        },
        {
          category: "system-design",
          question: "Design an interview feedback system.",
          answer: "Situation: Feedback was inconsistent. Task: improve quality. Action: I designed structured scoring, reviewer calibration, audit logs, and dashboards. Result: decision time improved by 22% and rejected candidates received clearer feedback.",
        },
        {
          category: "general",
          question: "Why this company?",
          answer: "The role, company, and customer problem match my experience. I can connect product strategy with delivery and show impact through measurable outcomes.",
        },
      ],
    }), new Date("2026-06-15T12:00:00.000Z"));

    expect(result.level).toMatch(/ready|sharp/);
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.missingCategories).toEqual([]);
    expect(result.answeredCount).toBe(4);
  });

  it("surfaces weak drafted answers before a near-term interview", () => {
    const result = buildInterviewReadiness(prep({
      research: "Research done.",
      questions: [
        { category: "behavioral", question: "Tell me about conflict.", answer: "I worked hard and helped the team." },
      ],
    }), new Date("2026-06-16T12:00:00.000Z"));

    expect(result.weakAnswerCount).toBe(1);
    expect(result.nextActions).toContain("Strengthen weak answers with measurable results and reflection.");
    expect(result.nextActions).toContain("Run one timed rehearsal before the interview.");
  });
});
