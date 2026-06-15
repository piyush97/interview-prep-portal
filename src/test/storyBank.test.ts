import { describe, expect, it } from "vitest";
import type { StoryBankEntry } from "../types";
import { splitList, storyHasProof, storyToAnswer } from "../utils/storyBank";

const story: StoryBankEntry = {
  id: "story-1",
  title: "Improved onboarding",
  situation: "Onboarding took too long.",
  task: "Reduce time to value.",
  action: "Mapped blockers and created a weekly review.",
  result: "Reduced cycle time by 28%.",
  reflection: "I now align stakeholders on one metric first.",
  metrics: ["28% faster"],
  tags: ["customer-success"],
  targetRoles: ["CSM"],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("storyBank utils", () => {
  it("formats a STAR story as an interview answer", () => {
    expect(storyToAnswer(story)).toContain("Situation: Onboarding took too long.");
    expect(storyToAnswer(story)).toContain("Result: Reduced cycle time by 28%.");
    expect(storyToAnswer(story)).toContain("Reflection: I now align stakeholders on one metric first.");
  });

  it("detects proof from metrics or numeric results", () => {
    expect(storyHasProof(story)).toBe(true);
    expect(storyHasProof({ ...story, metrics: [], result: "Customer satisfaction improved." })).toBe(false);
    expect(storyHasProof({ ...story, metrics: [], result: "Customer satisfaction improved 12 points." })).toBe(true);
  });

  it("splits comma-separated fields safely", () => {
    expect(splitList("leadership, conflict, , metrics ")).toEqual(["leadership", "conflict", "metrics"]);
  });
});
