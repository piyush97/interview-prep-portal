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
});
