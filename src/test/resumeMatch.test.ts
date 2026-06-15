import { describe, expect, it } from "vitest";
import { analyzeResumeMatch } from "../utils/resumeMatch";

describe("analyzeResumeMatch", () => {
  it("scores matched resume evidence against JD requirements", () => {
    const jd = `
      Requirements: healthcare operations experience, customer communication,
      stakeholder leadership, presentation skills, and case study delivery.
    `;
    const resume = `
      Led healthcare operations rollout across 12 clinics.
      Owned customer communication and stakeholder leadership for onboarding.
      Delivered quarterly presentation reviews to executives.
    `;
    const analysis = analyzeResumeMatch(jd, resume);
    expect(analysis.score).toBeGreaterThan(50);
    expect(analysis.matchedTerms.some((term) => term.term === "healthcare")).toBe(true);
    expect(analysis.evidenceLines.length).toBeGreaterThan(0);
  });

  it("surfaces missing terms when resume lacks JD language", () => {
    const jd = "Must have Salesforce certification, territory planning, and renewal forecasting.";
    const resume = "Built customer onboarding playbooks and managed executive relationships.";
    const analysis = analyzeResumeMatch(jd, resume);
    expect(analysis.score).toBeLessThan(50);
    expect(analysis.missingTerms.some((term) => term.term.includes("certification"))).toBe(true);
  });

  it("returns empty analysis for empty JD text", () => {
    const analysis = analyzeResumeMatch("", "Lots of experience");
    expect(analysis.score).toBe(0);
    expect(analysis.totalTerms).toBe(0);
  });
});
