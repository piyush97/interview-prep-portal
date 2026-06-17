import { describe, expect, it } from "vitest";
import { parseAiStarterContent } from "../utils/aiStarterContent";

describe("parseAiStarterContent", () => {
  it("normalizes schema-bound AI starter content", () => {
    const parsed = parseAiStarterContent(JSON.stringify({
      learning_path: {
        title: "Clinic Manager Prep",
        description: "Role-specific prep",
        modules: [
          { title: "Patient Flow", description: "Practice patient-flow stories", duration: "45m", resources: [] },
        ],
      },
      flashcards: [
        {
          question: "How did you improve patient flow?",
          answer: "Use STAR with baseline, action, and result.",
          category: "behavioral",
          deck: "Clinic Manager",
          difficulty: "medium",
        },
      ],
    }), "seed");

    expect(parsed.learningPath.id).toBe("lp_ai_seed");
    expect(parsed.learningPath.modules[0].id).toBe("seed_m0");
    expect(parsed.flashcards[0]).toMatchObject({
      id: "seed_fc0",
      category: "behavioral",
      level: 1,
    });
  });

  it("accepts fenced JSON and falls back for unknown enum values", () => {
    const parsed = parseAiStarterContent(`\`\`\`json
{
  "learning_path": {
    "title": "Prep",
    "description": "Desc",
    "modules": [{ "title": "Module", "description": "Desc", "duration": "1hr", "resources": [] }]
  },
  "flashcards": [{ "question": "Q", "answer": "A", "category": "unknown", "deck": "", "difficulty": "odd" }]
}
\`\`\``, "fenced");

    expect(parsed.flashcards[0].category).toBe("general");
    expect(parsed.flashcards[0].difficulty).toBe("medium");
    expect(parsed.flashcards[0].deck).toBe("AI Generated");
  });

  it("rejects incomplete content", () => {
    expect(() => parseAiStarterContent("{}", "bad")).toThrow(/learning_path/i);
  });
});
