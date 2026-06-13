import { useEffect, useState } from "react";
import { getInterviews, addInterview, updateInterview, deleteInterview } from "../store";
import Modal from "../components/Modal";
import type { InterviewPrep as Prep, InterviewQuestion } from "../types";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

function generateId() {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const questionCategories = ["technical", "behavioral", "system-design", "general"] as const;

export default function InterviewPrep() {
  const [interviews, setInterviews] = useState<Prep[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ company: "", role: "", stage: "", date: "", notes: "", research: "" });

  useEffect(() => { setInterviews(getInterviews()); }, []);

  const refresh = () => setInterviews(getInterviews());

  const handleAdd = () => {
    if (!form.company || !form.role) return;
    const now = new Date().toISOString();
    addInterview({
      id: generateId(),
      ...form,
      date: form.date || now,
      questions: [],
      createdAt: now,
      updatedAt: now,
    });
    setForm({ company: "", role: "", stage: "", date: "", notes: "", research: "" });
    setShowModal(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this interview prep?")) { deleteInterview(id); refresh(); }
  };

  const addQuestion = (interviewId: string) => {
    const q = prompt("Enter interview question:");
    if (!q) return;
    const interview = interviews.find((i) => i.id === interviewId);
    if (!interview) return;
    const question: InterviewQuestion = { question: q, answer: "", category: "technical" };
    updateInterview(interviewId, {
      questions: [...interview.questions, question],
    });
    refresh();
  };

  const updateQuestion = (interviewId: string, index: number, updates: Partial<InterviewQuestion>) => {
    const interview = interviews.find((i) => i.id === interviewId);
    if (!interview) return;
    const qs = [...interview.questions];
    qs[index] = { ...qs[index], ...updates };
    updateInterview(interviewId, { questions: qs });
    refresh();
  };

  const deleteQuestion = (interviewId: string, index: number) => {
    const interview = interviews.find((i) => i.id === interviewId);
    if (!interview) return;
    const qs = interview.questions.filter((_, i) => i !== index);
    updateInterview(interviewId, { questions: qs });
    refresh();
  };

  const today = new Date();
  const upcoming = interviews.filter((i) => new Date(i.date) > today);
  const past = interviews.filter((i) => new Date(i.date) <= today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Prep</h1>
          <p className="text-gray-500 mt-1">{interviews.length} prep sessions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={16} /> New Prep
        </button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h2>
          {upcoming.map((prep) => (
            <PrepCard key={prep.id} prep={prep} expanded={expanded === prep.id}
              onToggle={() => setExpanded(expanded === prep.id ? null : prep.id)}
              onDelete={() => handleDelete(prep.id)}
              onAddQuestion={() => addQuestion(prep.id)}
              onUpdateQuestion={(i, u) => updateQuestion(prep.id, i, u)}
              onDeleteQuestion={(i) => deleteQuestion(prep.id, i)}
            />
          ))}
        </section>
      )}

      {/* Past */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Past Sessions</h2>
        {past.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No prep sessions yet. Create one!
          </div>
        )}
        {past.map((prep) => (
          <PrepCard key={prep.id} prep={prep} expanded={expanded === prep.id}
            onToggle={() => setExpanded(expanded === prep.id ? null : prep.id)}
            onDelete={() => handleDelete(prep.id)}
            onAddQuestion={() => addQuestion(prep.id)}
            onUpdateQuestion={(i, u) => updateQuestion(prep.id, i, u)}
            onDeleteQuestion={(i) => deleteQuestion(prep.id, i)}
          />
        ))}
      </section>

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Interview Prep">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company *</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Google" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. AI Engineer" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stage</label>
              <input value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Phone Screen" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company Research</label>
            <textarea value={form.research} onChange={(e) => setForm({ ...form, research: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Company overview, products, tech stack..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Prep notes..." />
          </div>
          <button onClick={handleAdd} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Create Prep Session
          </button>
        </div>
      </Modal>
    </div>
  );
}

function PrepCard({
  prep, expanded, onToggle, onDelete, onAddQuestion, onUpdateQuestion, onDeleteQuestion,
}: {
  prep: Prep;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (index: number, updates: Partial<InterviewQuestion>) => void;
  onDeleteQuestion: (index: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-3 overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <div>
            <p className="font-medium text-gray-900">{prep.company} — {prep.role}</p>
            <p className="text-xs text-gray-500">
              {prep.stage && <span className="mr-2">{prep.stage}</span>}
              {new Date(prep.date).toLocaleDateString()}
              <span className="ml-2 text-gray-400">{prep.questions.length} questions</span>
            </p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Research */}
          {prep.research && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Research</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{prep.research}</p>
            </div>
          )}
          {prep.notes && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{prep.notes}</p>
            </div>
          )}

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-500 uppercase">Questions</h4>
              <button onClick={onAddQuestion} className="text-xs text-indigo-600 hover:text-indigo-700">+ Add</button>
            </div>
            {prep.questions.length === 0 && <p className="text-sm text-gray-400">No questions yet.</p>}
            <div className="space-y-2">
              {prep.questions.map((q, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-medium text-gray-400 uppercase">{q.category}</span>
                    <button onClick={() => onDeleteQuestion(i)} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{q.question}</p>
                  <textarea
                    value={q.answer}
                    onChange={(e) => onUpdateQuestion(i, { answer: e.target.value })}
                    placeholder="Type your answer..."
                    rows={2}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex gap-1 mt-1">
                    {questionCategories.map((cat) => (
                      <button key={cat}
                        onClick={() => onUpdateQuestion(i, { category: cat })}
                        className={`text-xs px-2 py-0.5 rounded-full ${q.category === cat ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
