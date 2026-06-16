import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import JDEvaluator from "../pages/JDEvaluator";
import { resetData, getApplications, addResume } from "../store";

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

  it("prompts users to add a resume before JD fit can be calculated", () => {
    render(<MemoryRouter><JDEvaluator /></MemoryRouter>);

    expect(screen.getByText("Resume Fit")).toBeInTheDocument();
    expect(screen.getByText(/Add a resume version first/i)).toBeInTheDocument();
  });

  it("compares pasted JD text against a selected resume", async () => {
    addResume({
      id: "resume-1",
      title: "Product Resume",
      targetRole: "Product Manager",
      content: "Delivered TypeScript dashboards with stakeholder leadership and customer research.",
      lastUpdated: "2026-06-16T00:00:00.000Z",
    });

    render(<MemoryRouter><JDEvaluator /></MemoryRouter>);
    const ta = screen.getByLabelText(/Job Description/i);
    fireEvent.change(ta, {
      target: {
        value:
          "Role: Product Manager at Acme Health Inc\n" +
          "Required TypeScript, Python, healthcare workflows, customer research, and stakeholder leadership.",
      },
    });

    expect(await screen.findByLabelText("Resume version")).toBeInTheDocument();
    expect(screen.getByText(/% match/i)).toBeInTheDocument();
    expect(screen.getByText("Matched")).toBeInTheDocument();
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(screen.getByText("Evidence lines")).toBeInTheDocument();
  });

  it("saves resume fit score and selected resume note with the application", async () => {
    addResume({
      id: "resume-1",
      title: "Operator Resume",
      targetRole: "Operations Manager",
      content: "Managed customer operations, stakeholder communication, reporting, and onboarding.",
      lastUpdated: "2026-06-16T00:00:00.000Z",
    });

    render(<MemoryRouter><JDEvaluator /></MemoryRouter>);
    const ta = screen.getByLabelText(/Job Description/i);
    fireEvent.change(ta, {
      target: {
        value:
          "Role: Operations Manager at Acme Health Inc\n" +
          "Required customer operations, stakeholder communication, reporting, and onboarding experience.",
      },
    });

    const saveBtn = await screen.findByRole("button", { name: /Add to Pipeline/i });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(getApplications()).toHaveLength(1));
    expect(getApplications()[0].notes).toContain("Resume checked: Operator Resume");
    expect(getApplications()[0].score).toBeGreaterThanOrEqual(1);
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

  // Big Mick v1.3.2 YELLOW fix: smart extraction should NOT grab
  // mid-sentence phrases like "TestCo. We need 5" as the company name.
  describe("smart extraction (v1.3.2)", () => {
    it("extracts clean company name 'Stripe Inc' from 'at Stripe Inc'", async () => {
      render(<MemoryRouter><JDEvaluator /></MemoryRouter>);
      const ta = screen.getByLabelText(/Job Description/i);
      fireEvent.change(ta, {
        target: {
          value: "Position: Senior Engineer\nat Stripe Inc\nLooking for someone with React and TypeScript skills.",
        },
      });
      // The "Detected" form is the above-the-fold UI
      const companyInput = await screen.findByLabelText("Company");
      expect(companyInput).toBeInTheDocument();
    });

    it("does NOT grab 'TestCo. We need 5' as the company name (mid-sentence boundary)", async () => {
      render(<MemoryRouter><JDEvaluator /></MemoryRouter>);
      const ta = screen.getByLabelText(/Job Description/i);
      fireEvent.change(ta, {
        target: {
          value: "We partner with TestCo. We need 5 engineers to join us at Acme Corp on the React platform.",
        },
      });
      // Should detect "Acme Corp" (clean corporate suffix), not "TestCo. We need 5"
      const companyInput = await screen.findByLabelText("Company");
      expect(companyInput).toBeInTheDocument();
      expect(companyInput).not.toHaveDisplayValue(/TestCo\. We need 5/);
    });

    it("trims trailing punctuation (period, comma) from extracted company", async () => {
      render(<MemoryRouter><JDEvaluator /></MemoryRouter>);
      const ta = screen.getByLabelText(/Job Description/i);
      fireEvent.change(ta, {
        target: {
          value: "Role: Staff Engineer at Wealthsimple, Inc. — fintech experience preferred.",
        },
      });
      const companyInput = await screen.findByLabelText("Company");
      // Trailing period should be stripped
      expect(companyInput).not.toHaveDisplayValue("Wealthsimple, Inc.");
    });

    it("skips garbage matches with no corporate suffix and grabs the next clean one", async () => {
      render(<MemoryRouter><JDEvaluator /></MemoryRouter>);
      const ta = screen.getByLabelText(/Job Description/i);
      fireEvent.change(ta, {
        target: {
          value: "Looking for a Senior Engineer at Loop. The role is at Bench Sciences Inc, a biotech startup.",
        },
      });
      // "Loop." is short + has only period (no Inc/LLC/Corp), so smart regex should skip it
      // and prefer "Bench Sciences Inc"
      const companyInput = await screen.findByLabelText("Company");
      expect(companyInput).toBeInTheDocument();
    });
  });
});
