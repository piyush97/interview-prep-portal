import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../components/Sidebar";

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
    expect(screen.getByText("Prep Portal")).toBeInTheDocument();
  });
});
