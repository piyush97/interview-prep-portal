import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Skills from "../pages/Skills";
import { addApplication, getFlashcardDecks, getLearningPaths, resetData } from "../store";
import type { Application } from "../types";

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

  it("previews, edits, and saves AI-native learning path and flashcards from skill gaps", async () => {
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
    expect(await screen.findByText(/Review "AI Clinic Ops Prep"/i)).toBeInTheDocument();
    expect(screen.getByText("Review AI Prep Kit")).toBeInTheDocument();
    expect(getLearningPaths().some((path) => path.title === "AI Clinic Ops Prep")).toBe(false);

    fireEvent.change(screen.getByDisplayValue("AI Clinic Ops Prep"), {
      target: { value: "Edited Clinic Ops Prep" },
    });
    fireEvent.change(screen.getByDisplayValue("How did you improve patient flow?"), {
      target: { value: "How did you reduce patient wait time?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Prep Kit/i }));

    expect(await screen.findByText(/Saved "Edited Clinic Ops Prep"/i)).toBeInTheDocument();
    expect(getLearningPaths().some((path) => path.title === "Edited Clinic Ops Prep")).toBe(true);
    expect(getFlashcardDecks()).toContain("AI Clinic Ops");
  });

  it("grounds AI prep generation in a selected saved JD", async () => {
    addApplication(mockApplication({
      id: "app_with_jd",
      company: "North Clinic",
      role: "Clinic Operations Manager",
      jdText: "Own patient flow, scheduling, staff coordination, and quality metrics.",
    }));
    backendMocks.generateStarterContent.mockResolvedValue({
      content: starterJson,
      target_role: "Clinic Operations Manager at North Clinic",
      skill_gap_count: 7,
      has_jd: true,
      model: "openclaw",
      agent: "http",
    });

    render(<Skills />);

    fireEvent.change(screen.getByDisplayValue("No saved JD selected"), {
      target: { value: "app_with_jd" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Generate Prep Kit/i }));

    await waitFor(() => {
      expect(backendMocks.generateStarterContent).toHaveBeenCalledWith(expect.objectContaining({
        target_role: "Clinic Operations Manager at North Clinic",
        jd_text: "Own patient flow, scheduling, staff coordination, and quality metrics.",
      }));
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Prep Kit/i }));
    expect(await screen.findByText(/using saved JD context/i)).toBeInTheDocument();
  });

  it("can discard generated AI prep before it mutates local data", async () => {
    backendMocks.generateStarterContent.mockResolvedValue({
      content: starterJson,
      target_role: "Clinic Operations Manager",
      skill_gap_count: 7,
      has_jd: false,
      model: "openclaw",
      agent: "http",
    });

    render(<Skills />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Prep Kit/i }));

    expect(await screen.findByText("Review AI Prep Kit")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Discard/i }));

    expect(screen.queryByText("Review AI Prep Kit")).not.toBeInTheDocument();
    expect(getLearningPaths().some((path) => path.title === "AI Clinic Ops Prep")).toBe(false);
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

function mockApplication(overrides: Partial<Application>): Application {
  const now = "2026-06-17T00:00:00.000Z";
  return {
    id: "app",
    company: "Company",
    role: "Role",
    url: "",
    status: "saved",
    dateApplied: "",
    contacts: [],
    documents: [],
    notes: "",
    timeline: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
