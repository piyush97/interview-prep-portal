import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { addReminder, resetData } from "../store";

// Mock the backend client so tests don't hit a real HTTP server
vi.mock("../lib/backend", () => ({
  backend: {
    getProfile: vi.fn().mockRejectedValue(new Error("no backend")),
  },
}));

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.clear();
    resetData();
  });

  it("renders all navigation links", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();
    expect(screen.getByText("Interview Prep")).toBeInTheDocument();
    expect(screen.getByText("Learn")).toBeInTheDocument();
    expect(screen.getByText("Flashcards")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Resume")).toBeInTheDocument();
    expect(screen.getByText("Research")).toBeInTheDocument();
  });

  it("does NOT hardcode user name — name comes from backend", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.queryByText("Piyush Mehta")).not.toBeInTheDocument();
  });

  it("renders brand name (one or more elements match)", async () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    const matches = screen.getAllByText("Interview Prep Portal");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT show version string in UI", async () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.queryByText("v1.4.0 — Universal")).not.toBeInTheDocument();
    expect(screen.queryByText("v1.4.0")).not.toBeInTheDocument();
    expect(screen.queryByText("Piyush Mehta")).not.toBeInTheDocument();
  });

  it("groups nav items under category headings", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Prep")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Config")).toBeInTheDocument();
  });

  it("uses a mobile-friendly horizontal nav before the desktop sidebar layout", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const sidebar = screen.getByLabelText("Primary navigation");
    const nav = screen.getByRole("navigation", { name: "Primary" });

    expect(sidebar).toHaveClass("w-full", "lg:w-64");
    expect(nav).toHaveClass("overflow-x-auto", "lg:overflow-y-auto");
  });

  it("renders all link labels (no items lost in grouping)", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    const expected = [
      "Dashboard", "Applications", "Compare Jobs", "Contacts", "Offers", "Journal",
      "Interview Prep", "Learn", "Flashcards", "Resources",
      "JD Evaluator", "Reminders",
      "Skills", "Resume", "Research",
      "Settings",
    ];
    for (const label of expected) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("shows pending reminder count badge when reminders exist", async () => {
    addReminder({
      id: "rm_test_1", title: "Test", date: new Date().toISOString(),
      type: "follow-up", status: "pending",
    } as any);
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });
});
