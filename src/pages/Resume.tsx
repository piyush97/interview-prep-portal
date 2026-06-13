import { useEffect, useState } from "react";
import { getResumes, addResume, updateResume, deleteResume } from "../store";
import Modal from "../components/Modal";
import type { ResumeVersion } from "../types";
import { Plus, Trash2, Download } from "lucide-react";

function generateId() {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function Resume() {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", targetRole: "", content: "" });

  useEffect(() => {
    const r = getResumes();
    setResumes(r);
    if (r.length > 0 && !selected) setSelected(r[0].id);
  }, []);

  const refresh = () => { setResumes(getResumes()); };

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
  const handleDownload = (r: ResumeVersion) => {
    const blob = new Blob([r.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <div className="grid grid-cols-[240px_1fr] gap-4">
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{currentResume.title}</h2>
                  <p className="text-sm text-gray-500">{currentResume.targetRole}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDownload(currentResume)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Download size={14} /> Download
                  </button>
                  <button onClick={() => handleDelete(currentResume.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
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
