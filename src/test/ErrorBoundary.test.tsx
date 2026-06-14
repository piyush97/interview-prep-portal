import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "../components/ErrorBoundary";

function Bomb({ shouldExplode }: { shouldExplode: boolean }) {
  if (shouldExplode) throw new Error("Boom!");
  return <div>Safe</div>;
}

describe("ErrorBoundary", () => {
  // Silence the error log for these tests
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldExplode={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Safe")).toBeInTheDocument();
  });

  it("shows fallback UI when child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldExplode />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Boom!/)).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom Fallback</div>}>
        <Bomb shouldExplode />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom Fallback")).toBeInTheDocument();
  });

  it("Try Again resets error state", async () => {
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Bomb shouldExplode />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: /try again/i });
    await user.click(resetBtn);
    // After reset, ErrorBoundary re-renders children (which still throw),
    // so the fallback appears again. The reset action itself should not crash.
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
