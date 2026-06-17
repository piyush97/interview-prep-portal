// TypeScript client for the Python backend (v1.4.0).
//
// The React app talks to the Python FastAPI backend at
// http://localhost:8766 instead of doing AI calls in-browser.

const BACKEND_URL =
  (import.meta.env.VITE_PREP_BACKEND_URL as string | undefined) ||
  "http://localhost:8766";

export type BackendHealth = {
  ok: boolean;
  version: string;
  agent: string;
  profile_path: string;
};

export type Profile = {
  schema_version: number;
  identity: {
    name: string;
    pronouns: string;
    location: string;
    work_authorization: string;
    contact: {
      email: string;
      phone: string;
      linkedin: string;
      portfolio: string;
    };
  };
  career: {
    current_title: string;
    years_experience: number;
    level: string;
    industry: string;
  };
  target_roles: string[];
  target_industries: string[];
  work_types: string[];
  skills: {
    core: string[];
    growing: string[];
    certifications: string[];
  };
  compensation: {
    currency: string;
    fte_target: number;
    contract_target_hourly: number;
    negotiable: boolean;
  };
  work_history: Array<{
    company: string;
    title: string;
    start: string;
    end: string;
    highlights: string[];
    tech: string[];
  }>;
  education: Array<{
    school: string;
    credential: string;
    year: number;
  }>;
  preferences: {
    remote: boolean;
    hybrid: boolean;
    onsite: boolean;
    willing_to_relocate: boolean;
    visa_sponsorship_needed: boolean;
    notice_period: string;
  };
  stories_seed: string[];
  agent: {
    backend: "hermes" | "claude" | "codex" | "http" | "offline";
    model: string;
    command: string;
    endpoint: string;
    api_key_env: string;
    max_tokens: number;
    temperature: number;
  };
};

async function _fetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const resp = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Backend ${resp.status}: ${text}`);
  }
  return resp.json();
}

export const backend = {
  url: BACKEND_URL,

  async health(): Promise<BackendHealth | null> {
    try {
      return await _fetch<BackendHealth>("/health");
    } catch {
      return null;
    }
  },

  async getProfile(): Promise<Profile> {
    return _fetch<Profile>("/profile");
  },

  async saveProfile(profile: Profile): Promise<Profile> {
    return _fetch<Profile>("/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  },

  async loadProfileFromYaml(yaml_text: string): Promise<Profile> {
    return _fetch<Profile>("/profile/from_yaml", {
      method: "POST",
      body: JSON.stringify({ yaml_text }),
    });
  },

  async evaluateJD(jd_text: string): Promise<{
    evaluation: string;
    model: string;
    agent: string;
  }> {
    return _fetch("/api/evaluate_jd", {
      method: "POST",
      body: JSON.stringify({ jd_text }),
    });
  },

  async coverLetter(args: {
    company: string;
    role: string;
    jd_text?: string;
    angle?: string;
  }): Promise<{ cover_letter: string; model: string; agent: string }> {
    return _fetch("/api/cover_letter", {
      method: "POST",
      body: JSON.stringify(args),
    });
  },

  async researchCompany(args: { company: string; role?: string }): Promise<{
    research: string;
    model: string;
    agent: string;
  }> {
    return _fetch("/api/research_company", {
      method: "POST",
      body: JSON.stringify(args),
    });
  },

  async scanJobs(args: {
    search_terms?: string;
    location?: string;
    max_results?: number;
  }): Promise<{ listings: string; model: string; agent: string }> {
    return _fetch("/api/scan_jobs", {
      method: "POST",
      body: JSON.stringify(args),
    });
  },

  async interviewStories(focus = "all"): Promise<{
    stories: string;
    model: string;
    agent: string;
  }> {
    return _fetch("/api/interview_stories", {
      method: "POST",
      body: JSON.stringify({ focus }),
    });
  },

  async negotiationScript(args: {
    offer_details: string;
    c2c?: boolean;
  }): Promise<{ script: string; model: string; agent: string }> {
    return _fetch("/api/negotiation_script", {
      method: "POST",
      body: JSON.stringify(args),
    });
  },

  async scoreResume(args: {
    resume_text: string;
    jd_text?: string;
  }): Promise<{
    score: string;
    has_jd: boolean;
    jd_provided: boolean;
    resume_length: number;
    model: string;
    agent: string;
  }> {
    return _fetch("/api/score_resume", {
      method: "POST",
      body: JSON.stringify(args),
    });
  },
};

export async function isBackendUp(): Promise<boolean> {
  const h = await backend.health();
  return h !== null && h.ok;
}
