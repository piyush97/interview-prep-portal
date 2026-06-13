import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "../components/StatusBadge";

describe("StatusBadge", () => {
  it("renders 'Applied' for applied status", () => {
    render(<StatusBadge status="applied" />);
    expect(screen.getByText("Applied")).toBeInTheDocument();
  });

  it("renders 'Phone Screen' for phone-screen", () => {
    render(<StatusBadge status="phone-screen" />);
    expect(screen.getByText("Phone Screen")).toBeInTheDocument();
  });

  it("renders 'Offer' for offer status", () => {
    render(<StatusBadge status="offer" />);
    expect(screen.getByText("Offer")).toBeInTheDocument();
  });

  it("renders 'Rejected' for rejected", () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("renders fallback for unknown status", () => {
    render(<StatusBadge status="ghosted" />);
    expect(screen.getByText("ghosted")).toBeInTheDocument();
  });
});
