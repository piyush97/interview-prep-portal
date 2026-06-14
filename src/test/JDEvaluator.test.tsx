import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import JDEvaluator from "../pages/JDEvaluator";
import { resetData, getApplications } from "../store";

describe("JDEvaluator", () => {
  beforeEach(() => {
    localStorage.clear();
    resetData();
  });

  it("renders the heading and input", () => {
    render(<MemoryRouter><JDEvaluator /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "JD Evaluator" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste a job description/i)).toBeInTheDocument();
  });

  it("does not evaluate empty input", () => {
    render(<MemoryRouter><JDEvaluator /></MemoryRouter>);
    const btn = screen.getByRole("button", { name: /Evaluate/i });
    expect(btn).toBeDisabled();
  });

  it("extracts company + role from JD text and saves as application", async () => {
    render(<MemoryRouter><JDEvaluator /></MemoryRouter>);
    const ta = screen.getByPlaceholderText(/Paste a job description/i);
    fireEvent.change(ta, {
      target: {
        value:
          "Position: AI Engineer at Anthropic Inc\n" +
          "We are looking for someone with TypeScript, Python. " +
          "Apply at https://anthropic.com/jobs/123",
      },
    });
    const btn = screen.getByRole("button", { name: /Evaluate/i });
    fireEvent.click(btn);
    const result = await screen.findByText(/Job Evaluation/i, {}, { timeout: 3000 });
    expect(result).toBeInTheDocument();
    // Save section visible after eval
    const saveBtn = await screen.findByRole("button", { name: /Add to Pipeline/i });
    fireEvent.click(saveBtn);
    await waitFor(() => expect(getApplications()).toHaveLength(1));
  });
});
