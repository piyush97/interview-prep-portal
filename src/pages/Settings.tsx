import { useEffect, useState } from "react";
import { getProfile, updateProfile, getTheme, setTheme, exportData, importData, resetData, needsBackup, recordBackup } from "../store";
import type { UserProfile } from "../types";
import { Save, Download, Upload, AlertTriangle, Check, Moon, Sun, Monitor } from "lucide-react";

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(getTheme());
  const [saved, setSaved] = useState(false);
  const [backupNeeded, setBackupNeeded] = useState(needsBackup());
  const [importError, setImportError] = useState("");

  useEffect(() => {
    setProfile(getProfile());
    setThemeState(getTheme());
  }, []);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setProfile(p => ({ ...p, [field]: value }));
  };

  const saveProfile = () => {
    updateProfile(profile);
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
    reader.onload = ev => {
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

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Settings & Profile</h1>

      {backupNeeded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Backup recommended</p>
            <p className="text-sm text-amber-700">You haven’t backed up your data in 7+ days.</p>
          </div>
          <button onClick={downloadBackup} className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700">Backup Now</button>
        </div>
      )}

      <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Theme</h2>
        <div className="flex gap-2">
          {["light", "dark", "system"].map((t) => (
            <button
              key={t}
              onClick={() => handleTheme(t as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border capitalize ${theme === t ? "bg-blue-50 border-blue-300 text-blue-700" : "hover:bg-slate-50"}`}
            >
              {t === "light" ? <Sun className="w-4 h-4" /> : t === "dark" ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Your Profile</h2>
          <button onClick={saveProfile} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved" : "Save Profile"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value={profile.name} onChange={v => handleChange("name", v)} />
          <Input label="Title" value={profile.title} onChange={v => handleChange("title", v)} />
          <Input label="Email" value={profile.email} onChange={v => handleChange("email", v)} />
          <Input label="Phone" value={profile.phone} onChange={v => handleChange("phone", v)} />
          <Input label="LinkedIn" value={profile.linkedin} onChange={v => handleChange("linkedin", v)} />
          <Input label="GitHub" value={profile.github} onChange={v => handleChange("github", v)} />
          <Input label="Website" value={profile.website} onChange={v => handleChange("website", v)} />
          <Input label="Location" value={profile.location} onChange={v => handleChange("location", v)} />
          <Input label="Target Hourly Rate (USD)" type="number" value={String(profile.targetRate)} onChange={v => handleChange("targetRate", Number(v))} />
          <Input label="Target Salary (CAD/yr)" type="number" value={String(profile.targetSalary)} onChange={v => handleChange("targetSalary", Number(v))} />
          <Input label="Work Authorization" value={profile.workAuthorization} onChange={v => handleChange("workAuthorization", v)} />
          <Input label="Availability" value={profile.availability} onChange={v => handleChange("availability", v)} />
          <Input label="Relocation" value={profile.relocation} onChange={v => handleChange("relocation", v)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
          <textarea
            value={profile.summary}
            onChange={e => handleChange("summary", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Preferences (comma-separated)</label>
          <input
            type="text"
            value={profile.preferences.join(", ")}
            onChange={e => handleChange("preferences", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Data Management</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={downloadBackup} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export Backup
          </button>
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 cursor-pointer">
            <Upload className="w-4 h-4" /> Import Backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={confirmReset} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
            <AlertTriangle className="w-4 h-4" /> Reset All Data
          </button>
        </div>
        {importError && <p className="text-sm text-red-600">{importError}</p>}
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}
