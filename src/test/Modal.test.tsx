import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Modal from "../components/Modal";

describe("Modal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <MemoryRouter>
        <Modal isOpen={false} onClose={() => {}} title="Test">Content</Modal>
      </MemoryRouter>
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders title and children when open", () => {
    render(
      <MemoryRouter>
        <Modal isOpen={true} onClose={() => {}} title="My Modal">
          <p>Hello world</p>
        </Modal>
      </MemoryRouter>
    );
    expect(screen.getByText("My Modal")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    let called = false;
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Modal isOpen={true} onClose={() => { called = true; }} title="Modal">
          Content
        </Modal>
      </MemoryRouter>
    );
    await user.click(screen.getByText("×"));
    expect(called).toBe(true);
  });
});
