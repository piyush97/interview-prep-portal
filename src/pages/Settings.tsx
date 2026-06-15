import { useEffect, useState } from "react";
import {
  getProfile as getLocalProfile,
  updateProfile as updateLocalProfile,
  getTheme,
  setTheme,
  exportData,
  importData,
  resetData,
  needsBackup,
  recordBackup,
} from "../store";
import type { UserProfile } from "../types";
import { backend, type Profile, isBackendUp } from "../lib/backend";
import {
  Save,
  Download,
  Upload,
  AlertTriangle,
  Check,
  Moon,
  Sun,
  Monitor,
  Server,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

type BackendStatus = "checking" | "up" | "down";

export default function Settings() {
  // Local app data (unchanged from v1.x)
  const [localProfile, setLocalProfile] = useState<UserProfile>(getLocalProfile());
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(getTheme());
  const [saved, setSaved] = useState(false);
  const [backupNeeded, setBackupNeeded] = useState(needsBackup());
  const [importError, setImportError] = useState("");

  // Backend profile (v1.4.0)
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    identity: true,
    career: true,
    skills: false,
    work_history: false,
    education: false,
    compensation: false,
    preferences: false,
    agent: false,
  });

  useEffect(() => {
    setLocalProfile(getLocalProfile());
    setThemeState(getTheme());
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setBackendStatus("checking");
    const up = await isBackendUp();
    setBackendStatus(up ? "up" : "down");
    if (up) {
      setProfileLoading(true);
      try {
        const p = await backend.getProfile();
        setProfile(p);
        setProfileError("");
      } catch (e: any) {
        setProfileError(e.message || "Failed to load profile");
      } finally {
        setProfileLoading(false);
      }
    }
  };

  // --- Local profile handlers ---
  const handleLocalChange = (field: keyof UserProfile, value: any) => {
    setLocalProfile((p) => ({ ...p, [field]: value }));
  };
  const saveLocalProfile = () => {
    updateLocalProfile(localProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  const handleTheme = (t: "light" | "dark" | "system") => {
    setTheme(t);
    setThemeState(t);
    document.documentElement.classList.remove("dark", "light");
    if (t === "dark") document.documentElement.classList.add("dark");
    else if (t === "light") document.documentElement.classList.add("light");
  };
  const downloadBackup = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-prep-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordBackup();
    setBackupNeeded(false);
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importData(ev.target?.result as string);
      setImportError(ok ? "" : "Import failed. File must be valid portal data.");
      if (ok) window.location.reload();
    };
    reader.readAsText(file);
  };
  const confirmReset = () => {
    if (window.confirm("This will wipe ALL data and restore defaults. Export first if unsure. Continue?")) {
      resetData();
      window.location.reload();
    }
  };

  // --- Backend profile handlers ---
  const updateProfileField = (path: string, value: any) => {
    if (!profile) return;
    const next = structuredClone(profile);
    const parts = path.split(".");
    let cur: any = next;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = value;
    setProfile(next);
  };

  const saveBackendProfile = async () => {
    if (!profile) return;
    setProfileLoading(true);
    setProfileError("");
    try {
      const saved = await backend.saveProfile(profile);
      setProfile(saved);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (e: any) {
      setProfileError(e.message || "Save failed");
    } finally {
      setProfileLoading(false);
    }
  };

  const toggleSection = (key: string) =>
    setExpanded((e) => ({ ...e, [key]: !e[key] }));

  // --- Render helpers ---
  const renderIdentity = () =>
    profile && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded">
        <Field
          label="Name"
          value={profile.identity.name}
          onChange={(v) => updateProfileField("identity.name", v)}
        />
        <Field
          label="Pronouns"
          value={profile.identity.pronouns}
          onChange={(v) => updateProfileField("identity.pronouns", v)}
        />
        <Field
          label="Location"
          value={profile.identity.location}
          onChange={(v) => updateProfileField("identity.location", v)}
        />
        <Field
          label="Work Authorization"
          value={profile.identity.work_authorization}
          onChange={(v) => updateProfileField("identity.work_authorization", v)}
        />
        <Field
          label="Email"
          value={profile.identity.contact.email}
          onChange={(v) => updateProfileField("identity.contact.email", v)}
        />
        <Field
          label="Phone"
          value={profile.identity.contact.phone}
          onChange={(v) => updateProfileField("identity.contact.phone", v)}
        />
        <Field
          label="LinkedIn"
          value={profile.identity.contact.linkedin}
          onChange={(v) => updateProfileField("identity.contact.linkedin", v)}
        />
        <Field
          label="Portfolio"
          value={profile.identity.contact.portfolio}
          onChange={(v) => updateProfileField("identity.contact.portfolio", v)}
        />
      </div>
    );

  const renderCareer = () =>
    profile && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded">
        <Field
          label="Current Title"
          value={profile.career.current_title}
          onChange={(v) => updateProfileField("career.current_title", v)}
        />
        <Field
          label="Years Experience"
          type="number"
          value={String(profile.career.years_experience)}
          onChange={(v) => updateProfileField("career.years_experience", Number(v))}
        />
        <Field
          label="Level"
          value={profile.career.level}
          onChange={(v) => updateProfileField("career.level", v)}
        />
        <Field
          label="Industry"
          value={profile.career.industry}
          onChange={(v) => updateProfileField("career.industry", v)}
        />
        <ListField
          label="Target Roles"
          values={profile.target_roles}
          onChange={(v) => updateProfileField("target_roles", v)}
        />
        <ListField
          label="Target Industries"
          values={profile.target_industries}
          onChange={(v) => updateProfileField("target_industries", v)}
        />
        <ListField
          label="Work Types (FTE, C2C, PT)"
          values={profile.work_types}
          onChange={(v) => updateProfileField("work_types", v)}
        />
      </div>
    );

  const renderSkills = () =>
    profile && (
      <div className="grid grid-cols-1 gap-3 p-3 bg-slate-50 rounded">
        <ListField
          label="Core Skills"
          values={profile.skills.core}
          onChange={(v) => updateProfileField("skills.core", v)}
        />
        <ListField
          label="Growing In"
          values={profile.skills.growing}
          onChange={(v) => updateProfileField("skills.growing", v)}
        />
        <ListField
          label="Certifications"
          values={profile.skills.certifications}
          onChange={(v) => updateProfileField("skills.certifications", v)}
        />
      </div>
    );

  const renderWorkHistory = () =>
    profile && (
      <div className="space-y-3 p-3 bg-slate-50 rounded">
        {profile.work_history.map((job, idx) => (
          <div key={idx} className="border border-slate-200 rounded p-3 bg-white space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Job #{idx + 1}</span>
              <button
                onClick={() =>
                  updateProfileField(
                    "work_history",
                    profile.work_history.filter((_, i) => i !== idx),
                  )
                }
                className="text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="Company"
                value={job.company}
                onChange={(v) => updateProfileField(`work_history.${idx}.company`, v)}
              />
              <Field
                label="Title"
                value={job.title}
                onChange={(v) => updateProfileField(`work_history.${idx}.title`, v)}
              />
              <Field
                label="Start"
                value={job.start}
                onChange={(v) => updateProfileField(`work_history.${idx}.start`, v)}
              />
              <Field
                label="End"
                value={job.end}
                onChange={(v) => updateProfileField(`work_history.${idx}.end`, v)}
              />
            </div>
            <ListField
              label="Highlights"
              values={job.highlights}
              onChange={(v) => updateProfileField(`work_history.${idx}.highlights`, v)}
            />
            <ListField
              label="Tech / Tools"
              values={job.tech}
              onChange={(v) => updateProfileField(`work_history.${idx}.tech`, v)}
            />
          </div>
        ))}
        <button
          onClick={() =>
            updateProfileField("work_history", [
              ...profile.work_history,
              { company: "", title: "", start: "", end: "", highlights: [], tech: [] },
            ])
          }
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Job
        </button>
      </div>
    );

  const renderEducation = () =>
    profile && (
      <div className="space-y-3 p-3 bg-slate-50 rounded">
        {profile.education.map((edu, idx) => (
          <div key={idx} className="border border-slate-200 rounded p-3 bg-white space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Entry #{idx + 1}</span>
              <button
                onClick={() =>
                  updateProfileField(
                    "education",
                    profile.education.filter((_, i) => i !== idx),
                  )
                }
                className="text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field
                label="School"
                value={edu.school}
                onChange={(v) => updateProfileField(`education.${idx}.school`, v)}
              />
              <Field
                label="Credential"
                value={edu.credential}
                onChange={(v) => updateProfileField(`education.${idx}.credential`, v)}
              />
              <Field
                label="Year"
                type="number"
                value={String(edu.year)}
                onChange={(v) => updateProfileField(`education.${idx}.year`, Number(v))}
              />
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            updateProfileField("education", [
              ...profile.education,
              { school: "", credential: "", year: new Date().getFullYear() },
            ])
          }
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Education
        </button>
      </div>
    );

  const renderCompensation = () =>
    profile && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded">
        <Field
          label="Currency"
          value={profile.compensation.currency}
          onChange={(v) => updateProfileField("compensation.currency", v)}
        />
        <Field
          label="FTE Target (annual)"
          type="number"
          value={String(profile.compensation.fte_target)}
          onChange={(v) => updateProfileField("compensation.fte_target", Number(v))}
        />
        <Field
          label="Contract Target (hourly)"
          type="number"
          value={String(profile.compensation.contract_target_hourly)}
          onChange={(v) => updateProfileField("compensation.contract_target_hourly", Number(v))}
        />
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            checked={profile.compensation.negotiable}
            onChange={(e) => updateProfileField("compensation.negotiable", e.target.checked)}
            id="negotiable"
          />
          <label htmlFor="negotiable" className="text-sm text-slate-700">
            Negotiable
          </label>
        </div>
      </div>
    );

  const renderPreferences = () =>
    profile && (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded">
        {(
          [
            ["remote", "Open to remote"],
            ["hybrid", "Open to hybrid"],
            ["onsite", "Open to onsite"],
            ["willing_to_relocate", "Willing to relocate"],
            ["visa_sponsorship_needed", "Needs visa sponsorship"],
          ] as [keyof typeof profile.preferences, string][]
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={profile.preferences[key] as boolean}
              onChange={(e) => updateProfileField(`preferences.${key}`, e.target.checked)}
            />
            {label}
          </label>
        ))}
        <Field
          label="Notice Period"
          value={profile.preferences.notice_period}
          onChange={(v) => updateProfileField("preferences.notice_period", v)}
        />
      </div>
    );

  const renderAgent = () =>
    profile && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Backend</label>
          <select
            value={profile.agent.backend}
            onChange={(e) => updateProfileField("agent.backend", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="offline">offline (no AI — uses canned responses)</option>
            <option value="hermes">hermes (Hermes Agent CLI)</option>
            <option value="claude">claude (Claude Code CLI)</option>
            <option value="codex">codex (Codex CLI)</option>
            <option value="http">http (custom endpoint)</option>
          </select>
        </div>
        <Field
          label="Model"
          value={profile.agent.model}
          onChange={(v) => updateProfileField("agent.model", v)}
        />
        <Field
          label="Command"
          value={profile.agent.command}
          onChange={(v) => updateProfileField("agent.command", v)}
        />
        <Field
          label="Endpoint (http only)"
          value={profile.agent.endpoint}
          onChange={(v) => updateProfileField("agent.endpoint", v)}
        />
        <Field
          label="API Key Env Var"
          value={profile.agent.api_key_env}
          onChange={(v) => updateProfileField("agent.api_key_env", v)}
        />
        <Field
          label="Max Tokens"
          type="number"
          value={String(profile.agent.max_tokens)}
          onChange={(v) => updateProfileField("agent.max_tokens", Number(v))}
        />
        <Field
          label="Temperature"
          type="number"
          value={String(profile.agent.temperature)}
          onChange={(v) => updateProfileField("agent.temperature", Number(v))}
        />
      </div>
    );

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Settings & Profile</h1>

      {backupNeeded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Backup recommended</p>
            <p className="text-sm text-amber-700">You haven't backed up your data in 7+ days.</p>
          </div>
          <button
            onClick={downloadBackup}
            className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700"
          >
            Backup Now
          </button>
        </div>
      )}

      {/* ---- v1.4.0: Backend Profile Section ---- */}
      <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Backend Profile (v1.4.0)</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
              Universal — works for any profession
            </span>
          </div>
          <div className="flex items-center gap-2">
            {backendStatus === "up" && (
              <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                ● Connected
              </span>
            )}
            {backendStatus === "down" && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                ○ Backend offline — start with `prep serve`
              </span>
            )}
            {backendStatus === "checking" && (
              <span className="text-xs text-slate-500">Checking…</span>
            )}
            <button
              onClick={checkBackend}
              className="p-1.5 hover:bg-slate-100 rounded"
              title="Re-check"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {backendStatus === "down" && (
          <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-900">
            <p className="font-semibold mb-1">Backend not running</p>
            <p>
              The AI features need the Python backend running. Start it in another terminal:
            </p>
            <pre className="mt-2 bg-amber-100 px-2 py-1 rounded text-xs font-mono">
              python3 -m backend.cli serve
            </pre>
            <p className="mt-2 text-xs text-amber-800">
              The backend is what actually calls your AI agent. The React app is just the UI.
            </p>
          </div>
        )}

        {backendStatus === "up" && profile && (
          <>
            <div className="flex justify-between items-center pt-2">
              <p className="text-sm text-slate-600">
                This is the profile the backend uses to generate cover letters, JD evaluations,
                and company research. <span className="font-semibold">{profile.identity.name || "(unnamed)"}</span>
              </p>
              <button
                onClick={saveBackendProfile}
                disabled={profileLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {profileSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {profileSaved ? "Saved" : "Save Profile"}
              </button>
            </div>

            {profileError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{profileError}</div>
            )}

            <Section
              title="Identity & Contact"
              open={expanded.identity}
              onToggle={() => toggleSection("identity")}
            >
              {renderIdentity()}
            </Section>

            <Section
              title="Career & Targets"
              open={expanded.career}
              onToggle={() => toggleSection("career")}
            >
              {renderCareer()}
            </Section>

            <Section
              title="Skills"
              open={expanded.skills}
              onToggle={() => toggleSection("skills")}
            >
              {renderSkills()}
            </Section>

            <Section
              title="Work History"
              open={expanded.work_history}
              onToggle={() => toggleSection("work_history")}
            >
              {renderWorkHistory()}
            </Section>

            <Section
              title="Education"
              open={expanded.education}
              onToggle={() => toggleSection("education")}
            >
              {renderEducation()}
            </Section>

            <Section
              title="Compensation"
              open={expanded.compensation}
              onToggle={() => toggleSection("compensation")}
            >
              {renderCompensation()}
            </Section>

            <Section
              title="Preferences"
              open={expanded.preferences}
              onToggle={() => toggleSection("preferences")}
            >
              {renderPreferences()}
            </Section>

            <Section
              title="AI Agent"
              open={expanded.agent}
              onToggle={() => toggleSection("agent")}
            >
              {renderAgent()}
            </Section>
          </>
        )}

        {backendStatus === "up" && !profile && !profileLoading && (
          <div className="text-sm text-slate-500">
            <Sparkles className="inline w-4 h-4 mr-1" />
            Backend is up but no profile loaded. Try re-checking.
          </div>
        )}
      </section>

      {/* ---- Local App Profile (unchanged) ---- */}
      <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">App Profile (local data)</h2>
          <button
            onClick={saveLocalProfile}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved" : "Save App Profile"}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          These fields are stored in your browser only. They feed the Resume page and contact
          cards. The Backend Profile (above) feeds AI tools.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={localProfile.name}
            onChange={(v) => handleLocalChange("name", v)}
          />
          <Input
            label="Title"
            value={localProfile.title}
            onChange={(v) => handleLocalChange("title", v)}
          />
          <Input
            label="Email"
            value={localProfile.email}
            onChange={(v) => handleLocalChange("email", v)}
          />
          <Input
            label="Phone"
            value={localProfile.phone}
            onChange={(v) => handleLocalChange("phone", v)}
          />
          <Input
            label="LinkedIn"
            value={localProfile.linkedin}
            onChange={(v) => handleLocalChange("linkedin", v)}
          />
          <Input
            label="GitHub"
            value={localProfile.github}
            onChange={(v) => handleLocalChange("github", v)}
          />
          <Input
            label="Website"
            value={localProfile.website}
            onChange={(v) => handleLocalChange("website", v)}
          />
          <Input
            label="Location"
            value={localProfile.location}
            onChange={(v) => handleLocalChange("location", v)}
          />
          <Input
            label="Target Hourly Rate (USD)"
            type="number"
            value={String(localProfile.targetRate)}
            onChange={(v) => handleLocalChange("targetRate", Number(v))}
          />
          <Input
            label="Target Salary (CAD/yr)"
            type="number"
            value={String(localProfile.targetSalary)}
            onChange={(v) => handleLocalChange("targetSalary", Number(v))}
          />
          <Input
            label="Work Authorization"
            value={localProfile.workAuthorization}
            onChange={(v) => handleLocalChange("workAuthorization", v)}
          />
          <Input
            label="Availability"
            value={localProfile.availability}
            onChange={(v) => handleLocalChange("availability", v)}
          />
          <Input
            label="Relocation"
            value={localProfile.relocation}
            onChange={(v) => handleLocalChange("relocation", v)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
          <textarea
            value={localProfile.summary}
            onChange={(e) => handleLocalChange("summary", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Preferences (comma-separated)
          </label>
          <input
            type="text"
            value={localProfile.preferences.join(", ")}
            onChange={(e) =>
              handleLocalChange(
                "preferences",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </section>

      {/* ---- Theme ---- */}
      <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Theme</h2>
        <div className="flex gap-2">
          {["light", "dark", "system"].map((t) => (
            <button
              key={t}
              onClick={() => handleTheme(t as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border capitalize ${
                theme === t ? "bg-blue-50 border-blue-300 text-blue-700" : "hover:bg-slate-50"
              }`}
            >
              {t === "light" ? (
                <Sun className="w-4 h-4" />
              ) : t === "dark" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* ---- Data Management ---- */}
      <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Data Management</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadBackup}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> Export Backup
          </button>
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 cursor-pointer">
            <Upload className="w-4 h-4" /> Import Backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={confirmReset}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            <AlertTriangle className="w-4 h-4" /> Reset All Data
          </button>
        </div>
        {importError && <p className="text-sm text-red-600">{importError}</p>}
      </section>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}

function ListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="col-span-1 md:col-span-2">
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label} <span className="text-slate-400 font-normal">(comma-separated)</span>
      </label>
      <input
        type="text"
        value={values.join(", ")}
        onChange={(e) =>
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
        }
        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center px-4 py-2 hover:bg-slate-50"
      >
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="border-t border-slate-200">{children}</div>}
    </div>
  );
}
