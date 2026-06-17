import { useEffect, useState } from "react";
import { getApplications, getResumes, addResume, updateResume, deleteResume } from "../store";
import Modal from "../components/Modal";
import type { Application, ResumeVersion } from "../types";
import { Plus, Trash2, Download, Bot, Sparkles } from "lucide-react";
import { backend } from "../lib/backend";

function generateId() {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function Resume() {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [backendOnline, setBackendOnline] = useState(false);
  const [scoreStatus, setScoreStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [scoreMessage, setScoreMessage] = useState("");
  const [scorecard, setScorecard] = useState("");
  const [form, setForm] = useState({ title: "", targetRole: "", content: "" });

  useEffect(() => {
    const r = getResumes();
    setResumes(r);
    if (r.length > 0 && !selected) setSelected(r[0].id);
    const apps = getApplications();
    setApplications(apps);
    setSelectedApplicationId((current) => current || apps.find((app) => app.jdText?.trim())?.id || "");
  }, [selected]);

  useEffect(() => {
    let cancelled = false;
    backend.health().then((health) => {
      if (!cancelled) setBackendOnline(Boolean(health?.ok));
    });
    return () => { cancelled = true; };
  }, []);

  const refresh = () => {
    setResumes(getResumes());
    setApplications(getApplications());
  };

  const handleAdd = () => {
    if (!form.title) return;
    addResume({ id: generateId(), ...form, lastUpdated: new Date().toISOString() });
    setForm({ title: "", targetRole: "", content: "" });
    setShowModal(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this resume?")) { deleteResume(id); refresh(); if (selected === id) setSelected(null); }
  };

  const currentResume = resumes.find((r) => r.id === selected);
  const selectedApplication = applications.find((app) => app.id === selectedApplicationId);
  const handleDownload = (r: ResumeVersion) => {
    const blob = new Blob([r.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleScoreResume = async () => {
    if (!currentResume?.content.trim()) {
      setScoreStatus("error");
      setScoreMessage("Add resume content before scoring.");
      return;
    }
    if (!backendOnline) {
      setScoreStatus("error");
      setScoreMessage("Backend offline. Start `uv run python -m backend.cli serve`, then score with your configured agent.");
      return;
    }
    setScoreStatus("loading");
    setScoreMessage("");
    setScorecard("");
    try {
      const result = await backend.scoreResume({
        resume_text: currentResume.content,
        jd_text: selectedApplication?.jdText || "",
      });
      setScorecard(result.score);
      setScoreStatus("success");
      setScoreMessage(`Scored with ${result.agent}${result.model ? ` / ${result.model}` : ""}.`);
    } catch (error) {
      setScoreStatus("error");
      setScoreMessage(error instanceof Error ? error.message : "Resume scoring failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resume</h1>
          <p className="text-gray-500 mt-1">Manage versions tailored for different roles</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={16} /> New Version
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-2">No resume versions yet.</p>
          <button onClick={() => setShowModal(true)} className="text-indigo-600 text-sm">Create one</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <div className="space-y-1">
            {resumes.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`p-3 rounded-lg cursor-pointer text-sm ${
                  selected === r.id
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <p className="font-medium truncate">{r.title}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{r.targetRole}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(r.lastUpdated).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          {/* Content */}
          {currentResume && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{currentResume.title}</h2>
                  <p className="text-sm text-gray-500">{currentResume.targetRole}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleDownload(currentResume)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Download size={14} /> Download
                  </button>
                  <button onClick={() => handleDelete(currentResume.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
              <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Bot size={18} className="text-indigo-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Agent Resume Scorecard</h3>
                    </div>
                    <p className="mt-1 text-sm text-indigo-950">
                      Score this resume with Hermes/OpenClaw through the backend, using a saved JD when available.
                    </p>
                    <p className="mt-1 text-xs text-indigo-800">
                      {backendOnline ? "Backend connected" : "Backend offline"} · Raw API keys stay in your agent login or shell env.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2 lg:w-[360px]">
                    <select
                      value={selectedApplicationId}
                      onChange={(e) => setSelectedApplicationId(e.target.value)}
                      className="w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">General resume review</option>
                      {applications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.company} - {app.role}{app.jdText ? "" : " (no JD)"}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleScoreResume}
                      disabled={scoreStatus === "loading" || !currentResume.content.trim()}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    >
                      <Sparkles size={15} /> {scoreStatus === "loading" ? "Scoring..." : "Score With Agent"}
                    </button>
                  </div>
                </div>
                {scoreMessage && (
                  <div
                    className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                      scoreStatus === "error"
                        ? "border-red-100 bg-red-50 text-red-700"
                        : "border-emerald-100 bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {scoreMessage}
                  </div>
                )}
                {scorecard && (
                  <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800">
                    {scorecard}
                  </pre>
                )}
              </div>
              <textarea
                value={currentResume.content}
                onChange={(e) => {
                  updateResume(currentResume.id, { content: e.target.value });
                  refresh();
                }}
                className="w-full h-[500px] px-4 py-3 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Paste your resume content here (markdown format)..."
              />
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Resume Version">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. AI Engineer v2" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target Role</label>
            <input value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Sr. AI Engineer" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Content (Markdown)</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" placeholder="Paste your resume..." />
          </div>
          <button onClick={handleAdd} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Create
          </button>
        </div>
      </Modal>
    </div>
  );
}
