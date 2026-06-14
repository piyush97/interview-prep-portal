import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { addReminder, resetData } from "../store";

describe("Sidebar", () => {
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

  it("renders the user name", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("Piyush Mehta")).toBeInTheDocument();
  });

  it("renders brand name", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("Interview Prep Portal")).toBeInTheDocument();
  });

  it("shows pending reminder count badge when reminders exist", async () => {
    localStorage.clear();
    resetData();
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

  it("groups nav items under category headings", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    // 5 categories from the Big Mick v1.3.2 YELLOW fix
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Prep")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Config")).toBeInTheDocument();
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
});
