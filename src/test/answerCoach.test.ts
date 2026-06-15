import { describe, expect, it } from "vitest";
import { coachInterviewAnswer } from "../utils/answerCoach";

describe("coachInterviewAnswer", () => {
  it("returns an empty-state coaching cue", () => {
    const result = coachInterviewAnswer("", "behavioral");
    expect(result.score).toBe(0);
    expect(result.level).toBe("empty");
    expect(result.improvements[0]).toMatch(/Write an answer/i);
  });

  it("scores a structured, measurable answer as strong", () => {
    const answer = `
      Situation: Our customer onboarding team was missing activation targets across 12 clinics.
      Task: I owned the rollout plan and had to improve quality without slowing adoption.
      Action: I coordinated stakeholders, trained the team, designed weekly review dashboards,
      and prioritized the three highest-friction workflow issues.
      Result: We reduced onboarding time by 28%, improved customer satisfaction, and delivered
      the launch two weeks earlier than the revised plan.
      Reflection: I learned to make tradeoffs explicit and align every team on one metric.
    `;
    const result = coachInterviewAnswer(answer, "behavioral");
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.strengths).toContain("Includes measurable evidence");
  });

  it("flags vague and under-evidenced answers", () => {
    const result = coachInterviewAnswer("I am a hard worker and team player. I was responsible for many things.", "general");
    expect(result.score).toBeLessThan(40);
    expect(result.improvements.some((item) => item.includes("vague"))).toBe(true);
  });
});
