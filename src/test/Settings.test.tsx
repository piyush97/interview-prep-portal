import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Settings from "../pages/Settings";
import { resetData } from "../store";

const backendMocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
  health: vi.fn(),
  isBackendUp: vi.fn(),
}));

vi.mock("../lib/backend", () => ({
  backend: {
    getProfile: backendMocks.getProfile,
    saveProfile: backendMocks.saveProfile,
    health: backendMocks.health,
  },
  isBackendUp: backendMocks.isBackendUp,
}));

function baseProfile() {
  return {
    schema_version: 1,
    identity: {
      name: "Candidate",
      pronouns: "",
      location: "",
      work_authorization: "",
      contact: { email: "", phone: "", linkedin: "", portfolio: "" },
    },
    career: { current_title: "", years_experience: 0, level: "", industry: "" },
    target_roles: [],
    target_industries: [],
    work_types: [],
    skills: { core: [], growing: [], certifications: [] },
    compensation: { currency: "CAD", fte_target: 0, contract_target_hourly: 0, negotiable: true },
    work_history: [],
    education: [],
    preferences: {
      remote: false,
      hybrid: false,
      onsite: false,
      willing_to_relocate: false,
      visa_sponsorship_needed: false,
      notice_period: "",
    },
    stories_seed: [],
    agent: {
      backend: "offline",
      model: "",
      command: "",
      endpoint: "",
      api_key_env: "",
      max_tokens: 4000,
      temperature: 0.7,
    },
  };
}

describe("Settings AI subscription configuration", () => {
  beforeEach(() => {
    localStorage.clear();
    resetData();
    backendMocks.getProfile.mockReset();
    backendMocks.saveProfile.mockReset();
    backendMocks.health.mockReset();
    backendMocks.isBackendUp.mockReset();
    backendMocks.isBackendUp.mockResolvedValue(true);
    backendMocks.getProfile.mockResolvedValue(baseProfile());
  });

  it("surfaces bring-your-own-AI presets without raw key fields", async () => {
    render(<Settings />);

    expect(await screen.findByText("Bring your own AI subscription")).toBeInTheDocument();
    expect(screen.getByText("Hermes Agent")).toBeInTheDocument();
    expect(screen.getByText("OpenClaw Gateway")).toBeInTheDocument();
    expect(screen.getByText("Custom AI Gateway")).toBeInTheDocument();
    expect(screen.getByText(/Store only the environment variable name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/API Key$/i)).not.toBeInTheDocument();
  });

  it("applies the OpenClaw gateway preset to HTTP env-var config", async () => {
    render(<Settings />);

    fireEvent.click(await screen.findByRole("button", { name: /OpenClaw Gateway/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("OPENCLAW_API_KEY")).toBeInTheDocument();
    });
    expect(screen.getByText(/export OPENCLAW_API_KEY=/i)).toBeInTheDocument();
  });

  it("shows AI subscription setup guidance even when backend is offline", async () => {
    backendMocks.isBackendUp.mockResolvedValue(false);

    render(<Settings />);

    expect(await screen.findByText("Backend not running")).toBeInTheDocument();
    expect(screen.getByText("Bring your own AI subscription")).toBeInTheDocument();
    expect(screen.getByText("OpenClaw Gateway")).toBeInTheDocument();
    expect(screen.getByText(/export OPENCLAW_API_KEY=/i)).toBeInTheDocument();
  });
});
