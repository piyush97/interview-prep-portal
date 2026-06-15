import { useEffect, useState } from "react";
import { getContacts, addContact, deleteContact, updateContact } from "../store";
import type { StandaloneContact } from "../types";
import { Plus, Trash2, Mail, Link, MessageSquare, Calendar } from "lucide-react";
import Modal from "../components/Modal";

export default function Contacts() {
  const [contacts, setContacts] = useState<StandaloneContact[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { setContacts(getContacts()); }, []);

  const handleAdd = (contact: StandaloneContact) => {
    addContact(contact);
    setContacts(getContacts());
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete contact?")) { deleteContact(id); setContacts(getContacts()); }
  };

  const bumpContact = (c: StandaloneContact) => {
    updateContact(c.id, { lastContacted: new Date().toISOString() });
    setContacts(getContacts());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Network & Contacts</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-slate-500">Track recruiters, hiring managers, referrals, and mentors here.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{c.name}</h3>
                  <p className="text-sm text-slate-600">{c.role} {c.company && `• ${c.company}`}</p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-slate-700 mb-3">
                {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded"><Mail className="w-3 h-3" /> Email</a>}
                {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded"><Link className="w-3 h-3" /> LinkedIn</a>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-slate-500"><Calendar className="w-3 h-3" /> Last: {new Date(c.lastContacted).toLocaleDateString()}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${c.status === "warm" ? "bg-green-100 text-green-700" : c.status === "cold" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{c.status}</span>
              </div>
              {c.notes && <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">{c.notes}</p>}
              <button onClick={() => bumpContact(c)} className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:underline"><MessageSquare className="w-3 h-3" /> Log contact today</button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Contact">
        <ContactForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}

function ContactForm({ onSubmit, onCancel }: { onSubmit: (c: StandaloneContact) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<StandaloneContact>>({
    id: crypto.randomUUID(), name: "", role: "", company: "", email: "", linkedin: "",
    status: "cold", notes: "", lastContacted: new Date().toISOString(),
  });
  const update = (field: keyof StandaloneContact, value: StandaloneContact[keyof StandaloneContact]) =>
    setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="space-y-3">
      <input placeholder="Name" className="w-full px-3 py-2 border rounded-lg" value={form.name} onChange={e => update("name", e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Role" className="px-3 py-2 border rounded-lg" value={form.role} onChange={e => update("role", e.target.value)} />
        <input placeholder="Company" className="px-3 py-2 border rounded-lg" value={form.company} onChange={e => update("company", e.target.value)} />
      </div>
      <input placeholder="Email" className="w-full px-3 py-2 border rounded-lg" value={form.email} onChange={e => update("email", e.target.value)} />
      <input placeholder="LinkedIn URL" className="w-full px-3 py-2 border rounded-lg" value={form.linkedin} onChange={e => update("linkedin", e.target.value)} />
      <select className="w-full px-3 py-2 border rounded-lg" value={form.status} onChange={e => update("status", e.target.value)}>
        <option value="cold">Cold</option>
        <option value="warm">Warm</option>
        <option value="inactive">Inactive</option>
      </select>
      <textarea placeholder="Notes" rows={3} className="w-full px-3 py-2 border rounded-lg" value={form.notes} onChange={e => update("notes", e.target.value)} />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button onClick={() => onSubmit(form as StandaloneContact)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add Contact</button>
      </div>
    </div>
  );
}
