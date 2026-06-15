import { useEffect, useState } from "react";
import {
  getApplications,
  getInterviews,
  addInterview,
  updateInterview,
  deleteInterview,
  getStories,
} from "../store";
import Modal from "../components/Modal";
import type { Application, InterviewPrep as Prep, InterviewQuestion, StoryBankEntry } from "../types";
import { Plus, Trash2, ChevronDown, ChevronRight, Sparkles, Wand2 } from "lucide-react";
import { coachInterviewAnswer } from "../utils/answerCoach";
import { buildInterviewReadiness } from "../utils/interviewReadiness";
import { storyToAnswer } from "../utils/storyBank";
import { buildPrepFromApplication } from "../utils/prepGenerator";

function generateId() {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const questionCategories = ["technical", "behavioral", "system-design", "general"] as const;

export default function InterviewPrep() {
  const [interviews, setInterviews] = useState<Prep[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stories, setStories] = useState<StoryBankEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ company: "", role: "", stage: "", date: "", notes: "", research: "" });
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [questionModalFor, setQuestionModalFor] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<InterviewQuestion>({ question: "", answer: "", category: "behavioral" });

  useEffect(() => {
    setInterviews(getInterviews());
    setApplications(getApplications());
    setStories(getStories());
  }, []);

  const refresh = () => {
    setInterviews(getInterviews());
    setApplications(getApplications());
    setStories(getStories());
  };

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

  const openApplicationModal = () => {
    const savedApplications = getApplications();
    setApplications(savedApplications);
    setSelectedApplicationId((current) => current || savedApplications[0]?.id || "");
    setShowApplicationModal(true);
  };

  const createFromApplication = () => {
    const selected = applications.find((application) => application.id === selectedApplicationId);
    if (!selected) return;
    const prep = buildPrepFromApplication(selected, stories, generateId());
    addInterview(prep);
    setExpanded(prep.id);
    setShowApplicationModal(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this interview prep?")) { deleteInterview(id); refresh(); }
  };

  const openQuestionModal = (interviewId: string) => {
    setQuestionForm({ question: "", answer: "", category: "behavioral" });
    setQuestionModalFor(interviewId);
  };

  const addQuestion = () => {
    if (!questionModalFor || !questionForm.question.trim()) return;
    const interview = interviews.find((i) => i.id === questionModalFor);
    if (!interview) return;
    updateInterview(questionModalFor, {
      questions: [...interview.questions, questionForm],
    });
    setQuestionModalFor(null);
    setQuestionForm({ question: "", answer: "", category: "behavioral" });
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Prep</h1>
          <p className="text-gray-500 mt-1">{interviews.length} prep sessions</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={openApplicationModal} className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Wand2 size={16} /> From Application
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50">
            <Plus size={16} /> Blank Prep
          </button>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h2>
          {upcoming.map((prep) => (
            <PrepCard key={prep.id} prep={prep} expanded={expanded === prep.id}
              stories={stories}
              onToggle={() => setExpanded(expanded === prep.id ? null : prep.id)}
              onDelete={() => handleDelete(prep.id)}
              onAddQuestion={() => openQuestionModal(prep.id)}
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
            stories={stories}
            onToggle={() => setExpanded(expanded === prep.id ? null : prep.id)}
            onDelete={() => handleDelete(prep.id)}
            onAddQuestion={() => openQuestionModal(prep.id)}
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

      <Modal isOpen={showApplicationModal} onClose={() => setShowApplicationModal(false)} title="Create Prep From Application">
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm font-medium text-gray-900">No applications yet.</p>
              <p className="mt-1 text-sm text-gray-500">Save a JD or add an application first, then generate targeted interview prep.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Application</label>
                <select
                  value={selectedApplicationId}
                  onChange={(e) => setSelectedApplicationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.company} — {application.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-900">
                Generates research notes, five likely questions, category coverage, and pre-fills one behavioral answer from the best matching story when available.
              </div>
              <button onClick={createFromApplication} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                Generate Prep Session
              </button>
            </>
          )}
        </div>
      </Modal>

      <Modal isOpen={questionModalFor !== null} onClose={() => setQuestionModalFor(null)} title="Add Interview Question">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Question *</label>
            <textarea
              value={questionForm.question}
              onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Tell me about a time..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={questionForm.category}
              onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value as InterviewQuestion["category"] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {questionCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Draft Answer</label>
            <textarea
              value={questionForm.answer}
              onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Optional first pass. Answer Coach will score it after saving."
            />
          </div>
          <button onClick={addQuestion} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Add Question
          </button>
        </div>
      </Modal>
    </div>
  );
}

function PrepCard({
  prep, expanded, stories, onToggle, onDelete, onAddQuestion, onUpdateQuestion, onDeleteQuestion,
}: {
  prep: Prep;
  expanded: boolean;
  stories: StoryBankEntry[];
  onToggle: () => void;
  onDelete: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (index: number, updates: Partial<InterviewQuestion>) => void;
  onDeleteQuestion: (index: number) => void;
}) {
  const readiness = buildInterviewReadiness(prep);
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
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase text-indigo-700">Readiness Plan</h4>
                <p className="text-xs text-gray-600">
                  {readiness.answeredCount}/{prep.questions.length} answered
                  {readiness.weakAnswerCount > 0 && ` • ${readiness.weakAnswerCount} needs evidence`}
                  {readiness.missingCategories.length > 0 && ` • missing ${readiness.missingCategories.join(", ")}`}
                </p>
              </div>
              <div className="min-w-[120px]">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${readinessColor(readiness.level)}`}>
                    {readiness.score}%
                  </span>
                  <span className="capitalize text-gray-500">{readiness.level.replace("-", " ")}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white">
                  <div
                    className={`h-2 rounded-full ${readinessBarColor(readiness.level)}`}
                    style={{ width: `${readiness.score}%` }}
                  />
                </div>
              </div>
            </div>
            {readiness.nextActions.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-gray-700">
                {readiness.nextActions.map((action) => (
                  <li key={action}>• {action}</li>
                ))}
              </ul>
            )}
          </div>

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
                <QuestionCoachCard
                  key={i}
                  question={q}
                  stories={stories}
                  onDelete={() => onDeleteQuestion(i)}
                  onUpdate={(updates) => onUpdateQuestion(i, updates)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCoachCard({
  question,
  stories,
  onDelete,
  onUpdate,
}: {
  question: InterviewQuestion;
  stories: StoryBankEntry[];
  onDelete: () => void;
  onUpdate: (updates: Partial<InterviewQuestion>) => void;
}) {
  const coach = coachInterviewAnswer(question.answer, question.category);
  const suggestedStories = stories.slice(0, 3);
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-medium text-gray-400 uppercase">{question.category}</span>
        <button onClick={onDelete} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1">{question.question}</p>
      <textarea
        value={question.answer}
        onChange={(e) => onUpdate({ answer: e.target.value })}
        placeholder="Type your answer..."
        rows={2}
        className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {suggestedStories.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase text-gray-400">Use story</span>
          {suggestedStories.map((story) => (
            <button
              key={story.id}
              onClick={() => onUpdate({ answer: storyToAnswer(story) })}
              className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
            >
              {story.title}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-500" />
            <span className="text-xs font-semibold uppercase text-gray-500">Answer Coach</span>
          </div>
          <span className={`text-xs font-semibold ${coachColor(coach.level)}`}>
            {coach.level === "empty" ? "not started" : `${coach.score}%`}
          </span>
        </div>
        {coach.strengths.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {coach.strengths.map((strength) => (
              <span key={strength} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">{strength}</span>
            ))}
          </div>
        )}
        <ul className="space-y-1 text-xs text-gray-600">
          {coach.improvements.map((item) => <li key={item}>• {item}</li>)}
        </ul>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {questionCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => onUpdate({ category: cat })}
            className={`text-xs px-2 py-0.5 rounded-full ${question.category === cat ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

function coachColor(level: "empty" | "needs-work" | "solid" | "strong") {
  const colors = {
    empty: "text-gray-400",
    "needs-work": "text-amber-600",
    solid: "text-sky-600",
    strong: "text-emerald-600",
  };
  return colors[level];
}

function readinessColor(level: "not-started" | "at-risk" | "ready" | "sharp") {
  const colors = {
    "not-started": "text-gray-500",
    "at-risk": "text-amber-600",
    ready: "text-sky-600",
    sharp: "text-emerald-600",
  };
  return colors[level];
}

function readinessBarColor(level: "not-started" | "at-risk" | "ready" | "sharp") {
  const colors = {
    "not-started": "bg-gray-300",
    "at-risk": "bg-amber-500",
    ready: "bg-sky-500",
    sharp: "bg-emerald-500",
  };
  return colors[level];
}
