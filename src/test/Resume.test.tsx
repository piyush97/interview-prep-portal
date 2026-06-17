import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Resume from "../pages/Resume";
import { addApplication, addResume, resetData } from "../store";
import type { Application } from "../types";

const backendMocks = vi.hoisted(() => ({
  health: vi.fn(),
  scoreResume: vi.fn(),
}));

vi.mock("../lib/backend", () => ({
  backend: {
    health: backendMocks.health,
    scoreResume: backendMocks.scoreResume,
  },
}));

function addSeedData() {
  const now = "2026-06-16T12:00:00.000Z";
  addResume({
    id: "resume-1",
    title: "Operations resume",
    targetRole: "Clinic Operations Manager",
    content: "Led patient communication, stakeholder coordination, compliance, and metrics.",
    lastUpdated: now,
  });
  addApplication({
    id: "app-1",
    company: "Northstar Health",
    role: "Clinic Operations Manager",
    url: "https://example.com/job",
    jdText: "Need patient communication, stakeholder coordination, compliance, and metrics.",
    status: "phone-screen",
    dateApplied: now,
    contacts: [],
    documents: [],
    notes: "",
    timeline: [],
    createdAt: now,
    updatedAt: now,
  } satisfies Application);
}

describe("Resume agent scorecard", () => {
  beforeEach(() => {
    localStorage.clear();
    resetData();
    backendMocks.health.mockReset();
    backendMocks.scoreResume.mockReset();
  });

  it("scores the selected resume against a saved JD through the backend", async () => {
    addSeedData();
    backendMocks.health.mockResolvedValue({ ok: true, version: "1.4.0", agent: "http", profile_path: "/tmp/profile.yaml" });
    backendMocks.scoreResume.mockResolvedValue({
      score: "## 1. OVERALL SCORE: 8/10\nStrong keyword match.",
      has_jd: true,
      jd_provided: true,
      resume_length: 72,
      model: "openclaw-score",
      agent: "openclaw",
    });

    render(<Resume />);

    expect(await screen.findByText("Agent Resume Scorecard")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Score With Agent/i }));

    await waitFor(() => {
      expect(backendMocks.scoreResume).toHaveBeenCalledWith({
        resume_text: "Led patient communication, stakeholder coordination, compliance, and metrics.",
        jd_text: "Need patient communication, stakeholder coordination, compliance, and metrics.",
      });
    });
    expect(await screen.findByText(/Scored with openclaw/i)).toBeInTheDocument();
    expect(screen.getByText(/OVERALL SCORE: 8\/10/i)).toBeInTheDocument();
  });

  it("keeps scoring behind the local backend boundary when offline", async () => {
    addSeedData();
    backendMocks.health.mockResolvedValue(null);

    render(<Resume />);

    expect(await screen.findByText("Agent Resume Scorecard")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Score With Agent/i }));

    expect(backendMocks.scoreResume).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Backend offline/i).length).toBeGreaterThan(0);
  });
});
