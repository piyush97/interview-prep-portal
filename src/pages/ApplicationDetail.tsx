import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  addApplicationDocument,
  addCompany,
  addInterview,
  addReminder,
  getApplications,
  getCompanies,
  getReminders,
  getResumes,
  getStories,
  updateApplication,
} from "../store";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import type { Application, ApplicationStatus, Contact, ResumeVersion, TimelineEvent } from "../types";
import { ArrowLeft, ExternalLink, UserPlus, Plus, Download, ClipboardCheck, FileSearch, Wand2, FilePlus2 } from "lucide-react";
import { analyzeResumeMatch } from "../utils/resumeMatch";
import { buildPrepFromApplication } from "../utils/prepGenerator";
import {
  buildCompanyResearchSeed,
  buildPrepPacket,
  extractPrepSignals,
  nextFollowUpDate,
  prepChecklist,
} from "../utils/applicationPrepPacket";

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stripKnownPostingMetadata(text: string, app: Application) {
  return [app.company, app.role].filter(Boolean).reduce((cleaned, value) => {
    return cleaned.replace(new RegExp(escapeRegex(value), "gi"), " ");
  }, text);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [contactForm, setContactForm] = useState<Contact>({ name: "", role: "", email: "", phone: "", linkedin: "", notes: "" });
  const [noteText, setNoteText] = useState("");
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [prepActionMessage, setPrepActionMessage] = useState("");

  useEffect(() => {
    const found = getApplications().find((a) => a.id === id);
    if (found) setApp(found);
  }, [id]);

  useEffect(() => {
    const savedResumes = getResumes();
    setResumes(savedResumes);
    setSelectedResumeId((current) => current || savedResumes[0]?.id || "");
  }, []);

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

  const updateCurrentApplication = (updates: Partial<Application>) => {
    const updated = { ...app, ...updates, updatedAt: new Date().toISOString() };
    updateApplication(app.id, updated);
    setApp(updated);
    return updated;
  };

  const handleBuildPrepWorkspace = () => {
    const now = new Date();
    const stories = getStories();
    const prep = buildPrepFromApplication(app, stories, generateId("prep"), now);
    addInterview(prep);

    const existingResearch = getCompanies().some((company) => company.company.toLowerCase() === app.company.toLowerCase());
    if (!existingResearch) {
      addCompany({
        id: generateId("co"),
        company: app.company,
        url: app.url,
        industry: "",
        notes: buildCompanyResearchSeed(app),
        products: [],
        techStack: extractPrepSignals(app),
        people: app.contacts.map((contact) => ({
          name: contact.name,
          role: contact.role,
          linkedin: contact.linkedin,
          notes: contact.notes,
        })),
        culture: "",
        interviewProcess: prep.stage,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    const reminderExists = getReminders().some((reminder) => reminder.relatedId === app.id && reminder.type === "follow-up");
    const closedStatus = ["rejected", "accepted", "withdrawn"].includes(app.status);
    const followUpDate = app.followUpDate || (!closedStatus ? nextFollowUpDate(now) : undefined);
    const createdReminder = Boolean(followUpDate && !reminderExists && !closedStatus);
    if (followUpDate && createdReminder) {
      addReminder({
        id: generateId("rm"),
        title: `Follow up with ${app.company}`,
        date: followUpDate,
        status: "pending",
        type: "follow-up",
        relatedId: app.id,
        notes: `Prep packet built for ${app.role}. Confirm next step, stage, and decision timeline.`,
      });
    }

    const event: TimelineEvent = {
      date: now.toISOString(),
      type: "prep",
      description: `Prep workspace built: ${[
        "interview session",
        existingResearch ? "" : "research seed",
        createdReminder ? "follow-up reminder" : "",
      ].filter(Boolean).join(", ")}.`,
    };
    updateCurrentApplication({
      ...(followUpDate ? { followUpDate } : {}),
      timeline: [...app.timeline, event],
    });
    setPrepActionMessage(event.description);
  };

  const handleSavePrepPacket = () => {
    const now = new Date();
    const title = `Prep Packet - ${now.toLocaleDateString()}`;
    const doc = addApplicationDocument(app.id, {
      id: generateId("doc"),
      type: "other",
      title,
      content: buildPrepPacket(app, { resumeTitle: selectedResume?.title, resumeMatch }),
      createdAt: now.toISOString(),
    });
    if (!doc) return;
    const updatedDocuments = [...app.documents, doc];
    const event: TimelineEvent = {
      date: now.toISOString(),
      type: "document",
      description: `Saved ${title}.`,
    };
    updateCurrentApplication({
      documents: updatedDocuments,
      timeline: [...app.timeline, event],
    });
    setPrepActionMessage("Prep packet saved into application documents.");
  };

  const statuses: ApplicationStatus[] = [
    "saved", "applied", "phone-screen", "technical", "onsite", "offer", "rejected", "accepted", "withdrawn"
  ];
  const checklist = prepChecklist(app);
  const prepReady = checklist.filter((item) => item.done).length;
  const prepSignals = extractPrepSignals(app);
  const packetFilename = `${app.company}-${app.role}-prep-packet.md`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId);
  const resumeMatch = selectedResume && app.jdText
    ? analyzeResumeMatch(stripKnownPostingMetadata(app.jdText, app), selectedResume.content)
    : null;
  const packetContext = { resumeTitle: selectedResume?.title, resumeMatch };
  const packetContent = buildPrepPacket(app, packetContext);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back + header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button onClick={() => navigate("/applications")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{app.role}</h1>
          <p className="text-gray-500 text-lg">{app.company}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {app.url && (
            <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
              <ExternalLink size={14} /> Job Posting
            </a>
          )}
          <button
            onClick={() => downloadText(packetFilename, packetContent)}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Download size={14} /> Prep Packet
          </button>
        </div>
      </div>

      {/* Status + Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex justify-between"><span className="text-gray-500">Salary</span><span>{app.salaryRange || "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span>{app.location || "-"}{app.remote && " (Remote)"}</span></div>
          </div>
        </div>
      </div>

      {/* Resume Match */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileSearch size={18} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-900">Resume Match Matrix</h3>
          </div>
          {resumes.length > 0 && (
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="max-w-[260px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>{resume.title}</option>
              ))}
            </select>
          )}
        </div>
        {resumes.length === 0 ? (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-medium text-gray-900">No resume versions yet</p>
            <p className="text-sm text-gray-600 mt-1">Create a resume version, then compare it against this JD for keyword gaps and evidence lines.</p>
            <button onClick={() => navigate("/resume")} className="mt-3 text-sm text-indigo-600 hover:text-indigo-700">Create resume version</button>
          </div>
        ) : !app.jdText ? (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-medium text-gray-900">JD text missing</p>
            <p className="text-sm text-gray-600 mt-1">Paste the full JD through the evaluator or add it to this application before scoring resume fit.</p>
          </div>
        ) : resumeMatch && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">JD keyword coverage</span>
                <span className="text-sm font-semibold text-gray-900">{resumeMatch.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${resumeMatch.score}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-emerald-700 mb-2">Matched Evidence</h4>
                {resumeMatch.matchedTerms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {resumeMatch.matchedTerms.map((term) => (
                      <span key={term.term} className="px-2 py-1 text-xs rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">{term.term}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No strong matches found.</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-700 mb-2">Missing / Underplayed</h4>
                {resumeMatch.missingTerms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {resumeMatch.missingTerms.map((term) => (
                      <span key={term.term} className="px-2 py-1 text-xs rounded-full bg-amber-50 border border-amber-100 text-amber-700">{term.term}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No obvious keyword gaps.</p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Resume Lines To Reuse</h4>
              {resumeMatch.evidenceLines.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-700">
                  {resumeMatch.evidenceLines.map((line) => <li key={line}>• {line}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Add quantified bullets that mirror the missing JD terms.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Prep Packet */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-indigo-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Application Prep Packet</h3>
              <p className="text-xs text-gray-500">Agent-ready workspace for interview prep, company research, reminders, and exports.</p>
            </div>
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">{prepReady}/{checklist.length} ready</span>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            onClick={handleBuildPrepWorkspace}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Wand2 size={15} /> Build Workspace
          </button>
          <button
            onClick={handleSavePrepPacket}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FilePlus2 size={15} /> Save Packet
          </button>
          <button
            onClick={() => navigate("/interviews")}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ClipboardCheck size={15} /> Open Prep
          </button>
        </div>
        {prepActionMessage && (
          <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {prepActionMessage}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {checklist.map((item) => (
            <div key={item.label} className={`rounded-lg border p-3 ${item.done ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`h-2.5 w-2.5 rounded-full ${item.done ? "bg-emerald-500" : "bg-amber-500"}`} />
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
              </div>
              <p className="text-xs text-gray-600 pl-4">{item.detail}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Interview Angles</h4>
          {prepSignals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {prepSignals.map((signal) => (
                <span key={signal} className="px-2 py-1 text-xs rounded-full bg-white border border-gray-200 text-gray-700">{signal}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Add the full JD to detect interview format, role risks, and prep themes.</p>
          )}
        </div>
        {resumeMatch && (
          <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <h4 className="text-sm font-medium text-indigo-950 mb-2">Packet Resume Summary</h4>
            <p className="text-sm text-indigo-900">
              {selectedResume?.title || "Selected resume"} covers {resumeMatch.score}% of detected JD terms.
              {resumeMatch.missingTerms.length > 0
                ? ` Tighten: ${resumeMatch.missingTerms.slice(0, 5).map((term) => term.term).join(", ")}.`
                : " No obvious keyword gaps."}
            </p>
          </div>
        )}
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
