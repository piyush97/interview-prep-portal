import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  backend,
  type Profile,
  type BackendHealth,
} from "../lib/backend";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Server,
  Sparkles,
  Stethoscope,
  Code2,
  GraduationCap,
  Megaphone,
  Loader2,
  RefreshCw,
} from "lucide-react";

type Step = "welcome" | "backend" | "persona" | "identity" | "career" | "skills" | "agent" | "done";

const PERSONAS: Array<{
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  file: string;
}> = [
  {
    id: "engineer",
    label: "Software Engineer",
    description: "AI/ML, full-stack, backend, frontend, DevOps, mobile — any engineering discipline",
    icon: <Code2 className="w-6 h-6" />,
    file: "example-software-engineer.yaml",
  },
  {
    id: "nurse",
    label: "Healthcare Professional",
    description: "RN, NP, pharmacist, therapist, technician — clinical practice",
    icon: <Stethoscope className="w-6 h-6" />,
    file: "example-nurse.yaml",
  },
  {
    id: "teacher",
    label: "Educator",
    description: "K-12 teacher, professor, instructional designer, corporate trainer",
    icon: <GraduationCap className="w-6 h-6" />,
    file: "example-teacher.yaml",
  },
  {
    id: "marketer",
    label: "Marketing / Sales",
    description: "B2B/B2C marketing, growth, content, sales, partnerships",
    icon: <Megaphone className="w-6 h-6" />,
    file: "example-marketer.yaml",
  },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [backendStatus, setBackendStatus] = useState<"checking" | "up" | "down">("checking");
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Persona selection
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  // Form fields (kept flat for simple state mgmt)
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [years, setYears] = useState("0");
  const [level, setLevel] = useState("Mid");
  const [coreSkills, setCoreSkills] = useState("");
  const [targetRoles, setTargetRoles] = useState("");
  const [backendChoice, setBackendChoice] = useState<"offline" | "hermes" | "claude" | "codex" | "http">("offline");

  useEffect(() => {
    checkBackend();
  }, []);

  async function checkBackend() {
    setBackendStatus("checking");
    setError("");
    const h = await backend.health();
    if (h) {
      setBackendStatus("up");
      setHealth(h);
      try {
        const p = await backend.getProfile();
        setProfile(p);
        // Pre-fill from existing profile
        if (p.identity.name) setName(p.identity.name);
        if (p.career.current_title) setTitle(p.career.current_title);
        if (p.career.years_experience) setYears(String(p.career.years_experience));
        if (p.career.level) setLevel(p.career.level);
        if (p.skills.core.length) setCoreSkills(p.skills.core.join(", "));
        if (p.target_roles.length) setTargetRoles(p.target_roles.join(", "));
        if (p.agent.backend) setBackendChoice(p.agent.backend);
      } catch {
        // ignore
      }
    } else {
      setBackendStatus("down");
    }
  }

  const loadPersona = async (file: string) => {
    setBusy(true);
    setError("");
    try {
      // Fetch the example YAML from the public folder
      const url = `${import.meta.env.BASE_URL || "/"}profiles/${file}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to load ${file}`);
      const yamlText = await resp.text();
      // We can't import the Python YAML parser in the browser,
      // so we ask the backend to load it via a new POST endpoint.
      // For v1.4.0 we'll add this; for now, parse locally with a minimal YAML→JSON shim
      // OR post the YAML to the backend as a string and let it parse.
      const parsed = await backend.loadProfileFromYaml(yamlText);
      setProfile(parsed);
      // Pre-fill
      setName(parsed.identity.name || "");
      setTitle(parsed.career.current_title || "");
      setYears(String(parsed.career.years_experience || 0));
      setLevel(parsed.career.level || "Mid");
      setCoreSkills(parsed.skills.core.join(", "));
      setTargetRoles(parsed.target_roles.join(", "));
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load persona"));
    } finally {
      setBusy(false);
    }
  };

  const saveAndFinish = async () => {
    if (!profile) return;
    setBusy(true);
    setError("");
    try {
      const updated = structuredClone(profile);
      updated.identity.name = name;
      updated.career.current_title = title;
      updated.career.years_experience = Number(years) || 0;
      updated.career.level = level;
      updated.skills.core = coreSkills.split(",").map((s) => s.trim()).filter(Boolean);
      updated.target_roles = targetRoles.split(",").map((s) => s.trim()).filter(Boolean);
      updated.agent.backend = backendChoice;
      const saved = await backend.saveProfile(updated);
      setProfile(saved);
      setStep("done");
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    const flow: Step[] = ["welcome", "backend", "persona", "identity", "career", "skills", "agent", "done"];
    const idx = flow.indexOf(step);
    if (idx < flow.length - 1) setStep(flow[idx + 1]);
  };
  const back = () => {
    const flow: Step[] = ["welcome", "backend", "persona", "identity", "career", "skills", "agent", "done"];
    const idx = flow.indexOf(step);
    if (idx > 0) setStep(flow[idx - 1]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Progress step={step} />

      {step === "welcome" && (
        <Card title="Welcome to Interview Prep Portal" icon={<Sparkles className="w-6 h-6 text-indigo-600" />}>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            This portal is <strong>profession-agnostic</strong> — it works for any job seeker, not
            just software engineers. You bring your own profile, your own AI agent, and the portal
            gives you cover letters, JD evaluations, and company research tailored to you.
          </p>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            In the next few minutes we'll:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 mb-6">
            <li>Check that the Python backend is running</li>
            <li>Pick a starter template (or start blank)</li>
            <li>Fill in your identity, career, and skills</li>
            <li>Choose which AI agent powers the tools</li>
            <li>Save — and you're ready to use cover letters, JD evaluator, etc.</li>
          </ol>
          <NavButtons onNext={next} />
        </Card>
      )}

      {step === "backend" && (
        <Card title="Backend Connection" icon={<Server className="w-6 h-6 text-indigo-600" />}>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            The AI tools (cover letters, JD evaluator, company research) need the Python backend
            running. Let's check the connection.
          </p>
          {backendStatus === "checking" && (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking…
            </div>
          )}
          {backendStatus === "up" && health && (
            <div className="bg-green-50 border border-green-200 rounded p-4 text-sm text-green-900">
              <p className="font-semibold mb-1">● Connected</p>
              <p>Version: {health.version}</p>
              <p>AI Agent: <span className="font-mono">{health.agent}</span></p>
              <p>Profile: <span className="font-mono text-xs">{health.profile_path}</span></p>
            </div>
          )}
          {backendStatus === "down" && (
            <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-900 space-y-2">
              <p className="font-semibold">○ Backend not running</p>
              <p>Start it in a terminal:</p>
              <pre className="bg-amber-100 px-2 py-1 rounded text-xs font-mono">uv run python -m backend.cli serve</pre>
              <button
                onClick={checkBackend}
                className="flex items-center gap-1 text-amber-700 hover:text-amber-900"
              >
                <RefreshCw size={14} /> Re-check
              </button>
            </div>
          )}
          <NavButtons onBack={back} onNext={next} disabledNext={backendStatus !== "up"} />
        </Card>
      )}

      {step === "persona" && (
        <Card title="Choose a starter template" icon={<Sparkles className="w-6 h-6 text-indigo-600" />}>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            Pick the template closest to your profession. You can edit everything on the next
            steps and later in <strong>Settings → Backend Profile</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={async () => {
                  setSelectedPersona(p.id);
                  await loadPersona(p.file);
                }}
                disabled={busy}
                className={`text-left p-4 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition ${
                  selectedPersona === p.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 dark:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {p.icon}
                  <span className="font-semibold">{p.label}</span>
                </div>
                <p className="text-xs text-slate-600">{p.description}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setSelectedPersona(null);
              setProfile({
                schema_version: 1,
                identity: { name: "", pronouns: "", location: "", work_authorization: "", contact: { email: "", phone: "", linkedin: "", portfolio: "" } },
                career: { current_title: "", years_experience: 0, level: "Mid", industry: "" },
                target_roles: [],
                target_industries: [],
                work_types: ["FTE"],
                skills: { core: [], growing: [], certifications: [] },
                compensation: { currency: "CAD", fte_target: 0, contract_target_hourly: 0, negotiable: true },
                work_history: [],
                education: [],
                preferences: { remote: true, hybrid: true, onsite: false, willing_to_relocate: false, visa_sponsorship_needed: false, notice_period: "2 weeks" },
                stories_seed: [],
                agent: { backend: "offline", model: "", command: "", endpoint: "", api_key_env: "", max_tokens: 2048, temperature: 0.7 },
              });
            }}
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-100 underline"
          >
            Or start with a blank profile →
          </button>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <NavButtons onBack={back} onNext={next} disabledNext={!profile} />
        </Card>
      )}

      {step === "identity" && (
        <Card title="Who are you?" icon={<Sparkles className="w-6 h-6 text-indigo-600" />}>
          <Field label="Full name" value={name} onChange={setName} placeholder="Jane Doe" />
          <Field label="Current title" value={title} onChange={setTitle} placeholder="ICU Nurse (Senior)" />
          <NavButtons onBack={back} onNext={next} disabledNext={!name || !title} />
        </Card>
      )}

      {step === "career" && (
        <Card title="Career basics" icon={<Sparkles className="w-6 h-6 text-indigo-600" />}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Years of experience" value={years} onChange={setYears} type="number" />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {["Entry", "Mid", "Senior", "Lead", "Principal", "Staff", "Director", "Executive"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <Field
            label="Core skills (comma-separated)"
            value={coreSkills}
            onChange={setCoreSkills}
            placeholder="Python, React, AWS, RAG"
          />
          <Field
            label="Target roles (comma-separated)"
            value={targetRoles}
            onChange={setTargetRoles}
            placeholder="Senior AI Engineer, Full-Stack Developer"
          />
          <NavButtons onBack={back} onNext={next} />
        </Card>
      )}

      {step === "skills" && (
        <Card title="Anything else?" icon={<Sparkles className="w-6 h-6 text-indigo-600" />}>
          <p className="text-slate-700 dark:text-slate-300 mb-3">
            You can add work history, education, growing skills, certifications, and compensation
            in <strong>Settings → Backend Profile</strong> after onboarding. For now, the basics
            you entered on the previous step are enough to start using the tools.
          </p>
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded p-3 text-sm text-slate-600 space-y-1">
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Title:</strong> {title}</p>
            <p><strong>Experience:</strong> {years} years ({level})</p>
            <p><strong>Skills:</strong> {coreSkills || "(none)"}</p>
            <p><strong>Target roles:</strong> {targetRoles || "(none)"}</p>
          </div>
          <NavButtons onBack={back} onNext={next} />
        </Card>
      )}

      {step === "agent" && (
        <Card title="Pick an AI agent" icon={<Server className="w-6 h-6 text-indigo-600" />}>
          <p className="text-slate-700 dark:text-slate-300 mb-3">
            The backend uses your chosen agent to generate cover letters, evaluate JDs, and do
            company research. You can change this later in <strong>Settings → Backend Profile → AI Agent</strong>.
          </p>
          <div className="space-y-2">
            {(
              [
                ["offline", "Offline", "No AI. Returns canned text. Good for trying the UI."],
                ["hermes", "Hermes Agent (recommended)", "Uses the `hermes` CLI you already have."],
                ["claude", "Claude Code", "Uses the `claude` CLI from Anthropic."],
                ["codex", "Codex CLI", "Uses the `codex` CLI from OpenAI."],
                ["http", "Custom HTTP endpoint", "Calls any OpenAI-compatible API."],
              ] as [typeof backendChoice, string, string][]
            ).map(([id, label, desc]) => (
              <label
                key={id}
                className={`block p-3 border rounded-lg cursor-pointer ${
                  backendChoice === id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 dark:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="agent"
                    value={id}
                    checked={backendChoice === id}
                    onChange={() => setBackendChoice(id)}
                  />
                  <span className="font-semibold">{label}</span>
                </div>
                <p className="text-xs text-slate-600 ml-6">{desc}</p>
              </label>
            ))}
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <NavButtons
            onBack={back}
            onNext={saveAndFinish}
            nextLabel="Save & Finish"
            busy={busy}
          />
        </Card>
      )}

      {step === "done" && (
        <Card title="You're all set! 🎉" icon={<Check className="w-6 h-6 text-green-600" />}>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            Your profile is saved. Try out the tools:
          </p>
          <ul className="space-y-2 text-slate-700 dark:text-slate-300 mb-6">
            <li>
              <button
                onClick={() => navigate("/evaluate")}
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                → JD Evaluator
              </button>{" "}
              — paste a job description, get an A-F analysis
            </li>
            <li>
              <button
                onClick={() => navigate("/interviews")}
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                → Interview Prep
              </button>{" "}
              — generate STAR+Reflection stories
            </li>
            <li>
              <button
                onClick={() => navigate("/settings")}
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                → Settings
              </button>{" "}
              — add more detail to your profile
            </li>
          </ul>
          <button
            onClick={() => navigate("/")}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </Card>
      )}
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  disabledNext,
  nextLabel = "Next",
  busy,
}: {
  onBack?: () => void;
  onNext: () => void;
  disabledNext?: boolean;
  nextLabel?: string;
  busy?: boolean;
}) {
  return (
    <div className="flex justify-between pt-4">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-100"
        >
          <ChevronLeft size={16} /> Back
        </button>
      ) : (
        <span />
      )}
      <button
        onClick={onNext}
        disabled={disabledNext || busy}
        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {nextLabel} <ChevronRight size={16} />
      </button>
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  const steps: Step[] = ["welcome", "backend", "persona", "identity", "career", "skills", "agent", "done"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-1 w-8 rounded ${
            i <= idx ? "bg-indigo-600" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}
