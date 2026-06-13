import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getApplications, updateApplication } from "../store";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import type { Application, ApplicationStatus, Contact, TimelineEvent } from "../types";
import { ArrowLeft, ExternalLink, UserPlus, Plus } from "lucide-react";

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [contactForm, setContactForm] = useState<Contact>({ name: "", role: "", email: "", phone: "", linkedin: "", notes: "" });
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    const found = getApplications().find((a) => a.id === id);
    if (found) setApp(found);
  }, [id]);

  if (!app) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Application not found</p>
        <button onClick={() => navigate("/applications")} className="text-indigo-600 mt-2 text-sm">&larr; Back to applications</button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    const event: TimelineEvent = {
      date: new Date().toISOString(),
      type: "status",
      description: `Status changed to: ${newStatus}`,
    };
    const updated = { ...app, status: newStatus, timeline: [...app.timeline, event], updatedAt: new Date().toISOString() };
    updateApplication(app.id, updated);
    setApp(updated);
  };

  const handleAddContact = () => {
    if (!contactForm.name) return;
    const updated = { ...app, contacts: [...app.contacts, contactForm], updatedAt: new Date().toISOString() };
    updateApplication(app.id, updated);
    setApp(updated);
    setContactForm({ name: "", role: "", email: "", phone: "", linkedin: "", notes: "" });
    setShowContactModal(false);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const event: TimelineEvent = {
      date: new Date().toISOString(),
      type: "note",
      description: noteText,
    };
    const updated = { ...app, notes: app.notes + (app.notes ? "\n\n" : "") + noteText, timeline: [...app.timeline, event], updatedAt: new Date().toISOString() };
    updateApplication(app.id, updated);
    setApp(updated);
    setNoteText("");
    setShowNoteModal(false);
  };

  const statuses: ApplicationStatus[] = [
    "saved", "applied", "phone-screen", "technical", "onsite", "offer", "rejected", "accepted", "withdrawn"
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back + header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate("/applications")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{app.role}</h1>
          <p className="text-gray-500 text-lg">{app.company}</p>
        </div>
        <div className="flex items-center gap-3">
          {app.url && (
            <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
              <ExternalLink size={14} /> Job Posting
            </a>
          )}
        </div>
      </div>

      {/* Status + Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Status</h3>
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status={app.status} />
          </div>
          <select
            value={app.status}
            onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s.replace("-", " ")}</option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Applied</span><span>{new Date(app.dateApplied).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Salary</span><span>{app.salary || "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span>{app.location || "-"}{app.remote && " (Remote)"}</span></div>
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Contacts</h3>
          <button onClick={() => setShowContactModal(true)} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
            <UserPlus size={14} /> Add Contact
          </button>
        </div>
        {app.contacts.length === 0 && <p className="text-sm text-gray-400 py-2">No contacts yet.</p>}
        <div className="space-y-3">
          {app.contacts.map((c, i) => (
            <div key={i} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500">{c.role}</p>
                {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                {c.linkedin && (
                  <a href={`https://linkedin.com/in/${c.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600">LinkedIn</a>
                )}
              </div>
              {c.notes && <p className="text-xs text-gray-400 max-w-[200px] text-right">{c.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Notes</h3>
          <button onClick={() => setShowNoteModal(true)} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
            <Plus size={14} /> Add Note
          </button>
        </div>
        {app.notes ? (
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{app.notes}</pre>
        ) : (
          <p className="text-sm text-gray-400">No notes yet.</p>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
        <div className="space-y-0">
          {[...app.timeline].reverse().map((event, i) => (
            <div key={i} className="flex gap-3 pb-4 border-l-2 border-gray-100 pl-4 ml-2 last:pb-0">
              <div className="flex-1">
                <p className="text-sm text-gray-700">{event.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(event.date).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="Add Contact">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
              <input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <input value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn (handle)</label>
            <input value={contactForm.linkedin} onChange={(e) => setContactForm({ ...contactForm, linkedin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleAddContact} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Save</button>
            <button onClick={() => setShowContactModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Add Note">
        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
          rows={5} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="Write your note..." />
        <div className="flex gap-2 mt-3">
          <button onClick={handleAddNote} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Save</button>
          <button onClick={() => setShowNoteModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
