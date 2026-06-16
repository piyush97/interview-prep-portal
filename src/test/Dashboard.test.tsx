import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import { resetData } from "../store";

const backendMocks = vi.hoisted(() => ({
  health: vi.fn(),
  getProfile: vi.fn(),
}));

vi.mock("../lib/backend", () => ({
  backend: {
    url: "http://localhost:8766",
    health: backendMocks.health,
    getProfile: backendMocks.getProfile,
  },
}));

function profile(agent: Record<string, unknown>) {
  return {
    identity: { name: "Candidate" },
    agent: {
      backend: "offline",
      model: "",
      command: "",
      endpoint: "",
      api_key_env: "",
      max_tokens: 4000,
      temperature: 0.7,
      ...agent,
    },
  };
}

describe("Dashboard agent runtime", () => {
  beforeEach(() => {
    localStorage.clear();
    resetData();
    backendMocks.health.mockReset();
    backendMocks.getProfile.mockReset();
  });

  it("shows Hermes/OpenClaw-native runtime controls when backend is offline", async () => {
    backendMocks.health.mockResolvedValue(null);

    render(<MemoryRouter><Dashboard /></MemoryRouter>);

    expect(screen.getByText("Agent Runtime")).toBeInTheDocument();
    expect(screen.getByText("Configure AI Keys")).toBeInTheDocument();
    expect(screen.getByText("Agent Setup")).toBeInTheDocument();
    expect(screen.getByText("Backend offline")).toBeInTheDocument();
    expect(screen.getByText(/Run: uv run python -m backend.cli serve/i)).toBeInTheDocument();
  });

  it("shows connected Hermes agent health", async () => {
    backendMocks.health.mockResolvedValue({
      ok: true,
      version: "1.4.0",
      agent: "hermes",
      profile_path: "/tmp/profile.yaml",
    });
    backendMocks.getProfile.mockResolvedValue(profile({ backend: "hermes", model: "deepseek/deepseek-v4-flash" }));

    render(<MemoryRouter><Dashboard /></MemoryRouter>);

    expect(await screen.findByText("Backend connected")).toBeInTheDocument();
    expect(screen.getAllByText("Hermes Agent").length).toBeGreaterThan(0);
    expect(screen.getByText("deepseek/deepseek-v4-flash")).toBeInTheDocument();
  });

  it("shows OpenClaw gateway key status for HTTP profiles", async () => {
    backendMocks.health.mockResolvedValue({
      ok: true,
      version: "1.4.0",
      agent: "http",
      profile_path: "/tmp/profile.yaml",
    });
    backendMocks.getProfile.mockResolvedValue(profile({
      backend: "http",
      endpoint: "http://localhost:9010/openclaw",
      api_key_env: "OPENCLAW_API_KEY",
    }));

    render(<MemoryRouter><Dashboard /></MemoryRouter>);

    expect(await screen.findByText("Backend connected")).toBeInTheDocument();
    expect(screen.getByText("OpenClaw gateway")).toBeInTheDocument();
    expect(screen.getByText("Env: OPENCLAW_API_KEY")).toBeInTheDocument();
  });
});
