import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Skills from "../pages/Skills";
import { getFlashcardDecks, getLearningPaths, resetData } from "../store";

const backendMocks = vi.hoisted(() => ({
  generateStarterContent: vi.fn(),
}));

vi.mock("../lib/backend", () => ({
  backend: {
    generateStarterContent: backendMocks.generateStarterContent,
  },
}));

const starterJson = JSON.stringify({
  learning_path: {
    title: "AI Clinic Ops Prep",
    description: "Generated from skill gaps",
    modules: [
      { title: "Role Scorecard", description: "Map requirements", duration: "45m", resources: [] },
      { title: "Story Bank", description: "Draft metrics stories", duration: "1hr", resources: [] },
      { title: "Screen Practice", description: "Practice recruiter answers", duration: "45m", resources: [] },
      { title: "Company Research", description: "Build brief", duration: "1hr", resources: [] },
      { title: "Follow Up", description: "Prepare follow-up", duration: "30m", resources: [] },
    ],
  },
  flashcards: [
    { question: "How did you improve patient flow?", answer: "Use STAR with baseline and result.", category: "behavioral", deck: "AI Clinic Ops", difficulty: "medium" },
    { question: "What do you ask the recruiter?", answer: "Ask scope, stages, timeline, and success metrics.", category: "general", deck: "AI Clinic Ops", difficulty: "easy" },
  ],
});

describe("Skills AI prep kit", () => {
  beforeEach(() => {
    localStorage.clear();
    resetData();
    backendMocks.generateStarterContent.mockReset();
  });

  it("generates and saves AI-native learning path and flashcards from skill gaps", async () => {
    backendMocks.generateStarterContent.mockResolvedValue({
      content: starterJson,
      target_role: "Clinic Operations Manager",
      skill_gap_count: 7,
      has_jd: false,
      model: "openclaw",
      agent: "http",
    });

    render(<Skills />);

    fireEvent.change(screen.getByPlaceholderText(/Target role/i), {
      target: { value: "Clinic Operations Manager" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Generate Prep Kit/i }));

    await waitFor(() => {
      expect(backendMocks.generateStarterContent).toHaveBeenCalled();
    });
    expect(await screen.findByText(/Saved "AI Clinic Ops Prep"/i)).toBeInTheDocument();
    expect(getLearningPaths().some((path) => path.title === "AI Clinic Ops Prep")).toBe(true);
    expect(getFlashcardDecks()).toContain("AI Clinic Ops");
  });

  it("does not save invalid AI output", async () => {
    backendMocks.generateStarterContent.mockResolvedValue({
      content: "{}",
      target_role: "",
      skill_gap_count: 1,
      has_jd: false,
      model: "",
      agent: "offline",
    });

    render(<Skills />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Prep Kit/i }));

    expect(await screen.findByText(/missing learning_path/i)).toBeInTheDocument();
    expect(getLearningPaths().some((path) => path.title === "AI Clinic Ops Prep")).toBe(false);
  });
});
