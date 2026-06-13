import { useEffect, useState } from "react";
import { getCompanies, addCompany, deleteCompany } from "../store";
import Modal from "../components/Modal";
import type { CompanyResearch } from "../types";
import { Plus, Trash2, ExternalLink, Search } from "lucide-react";

function generateId() {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function Research() {
  const [companies, setCompanies] = useState<CompanyResearch[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ company: "", url: "", industry: "", notes: "", products: "", techStack: "", culture: "", interviewProcess: "" });

  useEffect(() => { setCompanies(getCompanies()); }, []);

  const refresh = () => setCompanies(getCompanies());

  const handleAdd = () => {
    if (!form.company) return;
    const now = new Date().toISOString();
    addCompany({
      id: generateId(),
      company: form.company,
      url: form.url,
      industry: form.industry,
      notes: form.notes,
      products: form.products.split("\n").filter(Boolean),
      techStack: form.techStack.split("\n").filter(Boolean),
      people: [],
      culture: form.culture,
      interviewProcess: form.interviewProcess,
      createdAt: now,
      updatedAt: now,
    });
    setForm({ company: "", url: "", industry: "", notes: "", products: "", techStack: "", culture: "", interviewProcess: "" });
    setShowModal(false);
    refresh();
  };

  const filtered = companies.filter((c: CompanyResearch) =>
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Research</h1>
          <p className="text-gray-500 mt-1">{companies.length} companies tracked</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={16} /> Add Company
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          {search ? "No companies match." : "No companies researched yet."}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((company) => (
          <div key={company.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(expanded === company.id ? null : company.id)}
            >
              <div>
                <p className="font-medium text-gray-900">{company.company}</p>
                <p className="text-xs text-gray-500">{company.industry || "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                {company.url && (
                  <a href={company.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-indigo-600"><ExternalLink size={14} /></a>
                )}
                <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) { deleteCompany(company.id); refresh(); } }}
                  className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>

            {expanded === company.id && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {company.products.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Products</h4>
                      <div className="flex flex-wrap gap-1">
                        {company.products.map((p, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {company.techStack.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Tech Stack</h4>
                      <div className="flex flex-wrap gap-1">
                        {company.techStack.map((t, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {company.notes && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{company.notes}</p>
                  </div>
                )}
                {company.culture && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Culture</h4>
                    <p className="text-sm text-gray-700">{company.culture}</p>
                  </div>
                )}
                {company.interviewProcess && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Interview Process</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{company.interviewProcess}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Company Research" wide>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company *</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
              <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Products (one per line)</label>
              <textarea value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })}
                rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tech Stack (one per line)</label>
              <textarea value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Culture</label>
              <textarea value={form.culture} onChange={(e) => setForm({ ...form, culture: e.target.value })}
                rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Interview Process</label>
              <textarea value={form.interviewProcess} onChange={(e) => setForm({ ...form, interviewProcess: e.target.value })}
                rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <button onClick={handleAdd} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Add Company
          </button>
        </div>
      </Modal>
    </div>
  );
}
