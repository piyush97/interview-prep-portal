import { useEffect, useState } from "react";
import { getJournal, addJournal, deleteJournal } from "../store";
import type { JournalEntry } from "../types";
import { Plus, Trash2, Calendar } from "lucide-react";
import Modal from "../components/Modal";

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { setEntries(getJournal()); }, []);

  const handleAdd = (entry: JournalEntry) => {
    addJournal(entry);
    setEntries(getJournal());
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete entry?")) { deleteJournal(id); setEntries(getJournal()); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Daily Journal</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {entries.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center text-slate-500">Log daily wins, rejections, learnings, and next steps.</div>
          ) : entries.map(e => (
            <div key={e.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" /> {new Date(e.date).toLocaleDateString()}
                </div>
                <button onClick={() => handleDelete(e.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
              <p className="text-slate-800 whitespace-pre-line">{e.content}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {e.tags.map(t => <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">#{t}</span>)}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5 h-fit">
          <h2 className="font-semibold text-slate-900 mb-3">Prompts</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• What did I apply to today?</li>
            <li>• What interview question stumped me?</li>
            <li>• What did I learn?</li>
            <li>• Who did I network with?</li>
            <li>• What will I do tomorrow?</li>
          </ul>
        </div>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Journal Entry">
        <JournalForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}

function JournalForm({ onSubmit, onCancel }: { onSubmit: (e: JournalEntry) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<JournalEntry>>({
    id: crypto.randomUUID(), date: new Date().toISOString().split("T")[0], content: "", tags: [],
  });
  const update = (field: keyof JournalEntry, value: JournalEntry[keyof JournalEntry]) =>
    setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="space-y-3">
      <input type="date" className="w-full px-3 py-2 border rounded-lg" value={form.date} onChange={e => update("date", e.target.value)} />
      <textarea placeholder="What happened today?" rows={6} className="w-full px-3 py-2 border rounded-lg" value={form.content} onChange={e => update("content", e.target.value)} />
      <input placeholder="Tags (comma separated)" className="w-full px-3 py-2 border rounded-lg" value={form.tags?.join(", ")} onChange={e => update("tags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button onClick={() => onSubmit(form as JournalEntry)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save Entry</button>
      </div>
    </div>
  );
}
