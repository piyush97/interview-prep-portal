import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApplications, addApplication, deleteApplication, exportData, importData, resetData } from "../store";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import type { Application, ApplicationStatus } from "../types";
import { Plus, Download, Upload, Trash2, RotateCcw, Search } from "lucide-react";

function generateId() {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function Applications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company: "",
    role: "",
    url: "",
    status: "saved" as ApplicationStatus,
    salary: "",
    location: "",
    remote: false,
    notes: "",
  });

  useEffect(() => {
    setApps(getApplications());
  }, []);

  const refresh = () => setApps(getApplications());

  const handleAdd = () => {
    if (!form.company || !form.role) return;
    const now = new Date().toISOString();
    addApplication({
      id: generateId(),
      ...form,
      dateApplied: now,
      contacts: [],
      timeline: [{ date: now, type: "created", description: `Application for ${form.role} at ${form.company} created` }],
      createdAt: now,
      updatedAt: now,
    });
    setForm({ company: "", role: "", url: "", status: "saved", salary: "", location: "", remote: false, notes: "" });
    setShowModal(false);
    refresh();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this application?")) {
      deleteApplication(id);
      refresh();
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-portal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importData(importText)) {
      setImportMsg("Data imported successfully!");
      setImportText("");
      refresh();
      setTimeout(() => { setShowImport(false); setImportMsg(""); }, 1500);
    } else {
      setImportMsg("Invalid data format. Check your JSON.");
    }
  };

  const handleReset = () => {
    if (confirm("This will delete ALL data. Are you sure?")) {
      if (confirm("Really? All applications, interviews, and notes will be gone.")) {
        resetData();
        refresh();
      }
    }
  };

  const filtered = apps.filter(
    (a) =>
      a.company.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
  );

  const statuses: ApplicationStatus[] = [
    "saved", "applied", "phone-screen", "technical", "onsite", "offer", "rejected", "accepted", "withdrawn"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">{apps.length} total applications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Upload size={14} /> Import
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={14} /> Export
          </button>
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus size={16} /> Add Application
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Applied</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    {search ? "No applications match your search." : "No applications yet. Add your first one!"}
                  </td>
                </tr>
              )}
              {filtered.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{app.company}</td>
                  <td className="px-4 py-3 text-gray-700">{app.role}</td>
                  <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(app.dateApplied).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {app.location || "-"}
                    {app.remote && <span className="ml-1 text-xs text-green-500">🏠</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => handleDelete(app.id, e)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Application">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company *</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Google"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Sr. AI Engineer"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Job URL</label>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Salary Range</label>
              <input
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. $100-120/hr C2C"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Toronto (Hybrid)"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remote}
                  onChange={(e) => setForm({ ...form, remote: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Remote</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Any notes about this application..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleAdd} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Add Application
            </button>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImport} onClose={() => { setShowImport(false); setImportMsg(""); }} title="Import Data">
        <p className="text-sm text-gray-500 mb-3">Paste your JSON backup to restore data. This will merge with existing data.</p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder='{"applications":[...],"skills":[...],...}'
        />
        {importMsg && (
          <p className={`text-sm mt-2 ${importMsg.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {importMsg}
          </p>
        )}
        <div className="flex gap-2 mt-3">
          <button onClick={handleImport} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Import
          </button>
          <button onClick={() => { setShowImport(false); setImportMsg(""); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
