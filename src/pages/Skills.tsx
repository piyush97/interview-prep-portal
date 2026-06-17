import { useEffect, useState } from "react";
import { addFlashcards, addLearningPath, getApplications, getProfile, getSkills, updateSkill } from "../store";
import Modal from "../components/Modal";
import type { Application, Flashcard, LearningModule, LearningPath, Skill, SkillCategory } from "../types";
import { Bot, CheckCircle2, Sparkles, Star, Search, X } from "lucide-react";
import { backend } from "../lib/backend";
import { parseAiStarterContent } from "../utils/aiStarterContent";

const categories: { key: SkillCategory; label: string }[] = [
  { key: "ai-ml", label: "AI / ML" },
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "cloud", label: "Cloud" },
  { key: "database", label: "Database" },
  { key: "devops", label: "DevOps" },
  { key: "tools", label: "Tools" },
  { key: "soft-skills", label: "Soft Skills" },
];

const priorityRank: Record<Skill["priority"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

type PendingPrepKit = {
  learningPath: LearningPath;
  flashcards: Flashcard[];
  agent: string;
  groundedInJd: boolean;
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onChange(star)} className="p-0.5">
          <Star size={14} className={star <= value ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
        </button>
      ))}
    </div>
  );
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [generationStatus, setGenerationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [generationMessage, setGenerationMessage] = useState("");
  const [pendingPrepKit, setPendingPrepKit] = useState<PendingPrepKit | null>(null);

  useEffect(() => {
    setSkills(getSkills());
    setApplications(getApplications());
    setTargetRole(getProfile().title);
  }, []);

  const refresh = () => setSkills(getSkills());

  const filtered = skills.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || s.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const gapSkills = skills
    .filter((s) => s.level < s.targetLevel)
    .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority] || (b.targetLevel - b.level) - (a.targetLevel - a.level));
  const selectedApplication = applications.find((app) => app.id === selectedApplicationId);
  const applicationsWithJd = applications.filter((app) => app.jdText?.trim());

  const selectApplication = (id: string) => {
    setSelectedApplicationId(id);
    const app = applications.find((candidate) => candidate.id === id);
    if (app) setTargetRole(`${app.role} at ${app.company}`);
  };

  const generatePrepKit = async () => {
    if (gapSkills.length === 0) {
      setGenerationStatus("error");
      setGenerationMessage("No skill gaps available. Lower a current level or raise a target level first.");
      return;
    }
    setGenerationStatus("loading");
    setGenerationMessage("");
    setPendingPrepKit(null);
    try {
      const result = await backend.generateStarterContent({
        target_role: targetRole,
        jd_text: selectedApplication?.jdText,
        skill_gaps: gapSkills.slice(0, 10).map((skill) => ({
          name: skill.name,
          category: skill.category,
          current: skill.level,
          target: skill.targetLevel,
          priority: skill.priority,
          notes: skill.notes,
        })),
      });
      const parsed = parseAiStarterContent(result.content);
      setPendingPrepKit({
        ...parsed,
        agent: result.agent,
        groundedInJd: Boolean(selectedApplication),
      });
      setGenerationStatus("success");
      setGenerationMessage(`Review "${parsed.learningPath.title}" and ${parsed.flashcards.length} flashcards from ${result.agent} before saving.`);
    } catch (error) {
      setGenerationStatus("error");
      setGenerationMessage(error instanceof Error ? error.message : "Could not generate prep kit.");
    }
  };

  const updatePendingPath = (updates: Partial<LearningPath>) => {
    setPendingPrepKit((current) => current && {
      ...current,
      learningPath: { ...current.learningPath, ...updates },
    });
  };

  const updatePendingModule = (id: string, updates: Partial<LearningModule>) => {
    setPendingPrepKit((current) => current && {
      ...current,
      learningPath: {
        ...current.learningPath,
        modules: current.learningPath.modules.map((module) => module.id === id ? { ...module, ...updates } : module),
      },
    });
  };

  const updatePendingFlashcard = (id: string, updates: Partial<Flashcard>) => {
    setPendingPrepKit((current) => current && {
      ...current,
      flashcards: current.flashcards.map((card) => card.id === id ? { ...card, ...updates } : card),
    });
  };

  const savePendingPrepKit = () => {
    if (!pendingPrepKit) return;
    addLearningPath(pendingPrepKit.learningPath);
    addFlashcards(pendingPrepKit.flashcards);
    setGenerationStatus("success");
    setGenerationMessage(`Saved "${pendingPrepKit.learningPath.title}" plus ${pendingPrepKit.flashcards.length} flashcards from ${pendingPrepKit.agent}${pendingPrepKit.groundedInJd ? " using saved JD context" : ""}.`);
    setPendingPrepKit(null);
  };

  const discardPendingPrepKit = () => {
    setPendingPrepKit(null);
    setGenerationStatus("idle");
    setGenerationMessage("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skills Matrix</h1>
        <p className="text-gray-500 mt-1">
          {skills.filter((s) => s.level >= s.targetLevel).length}/{skills.length} at target level
        </p>
      </div>

      {/* Gap Analysis */}
      {gapSkills.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Focus Areas</h3>
          <div className="flex flex-wrap gap-2">
            {gapSkills.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                {s.name} {s.level}→{s.targetLevel}
                <span className={`px-1 ${s.priority === "high" ? "text-red-500" : "text-amber-500"}`}>
                  {s.priority}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-indigo-100 rounded-xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">AI Prep Kit From Skill Gaps</h3>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Generate a saved learning path and flashcard deck from skill gaps, optionally grounded in a saved JD.
            </p>
            <p className="mt-1 text-xs text-gray-500">Provider keys stay in backend env or agent login; generated content saves locally.</p>
          </div>
          <div className="flex w-full flex-col gap-2 lg:w-[360px]">
            <select
              value={selectedApplicationId}
              onChange={(e) => selectApplication(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">No saved JD selected</option>
              {applicationsWithJd.map((app) => (
                <option key={app.id} value={app.id}>{app.role} at {app.company}</option>
              ))}
            </select>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Target role, e.g. Clinic Operations Manager"
            />
            <button
              onClick={generatePrepKit}
              disabled={generationStatus === "loading"}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              <Sparkles size={15} /> {generationStatus === "loading" ? "Generating..." : "Generate Prep Kit"}
            </button>
          </div>
        </div>
        {generationMessage && (
          <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            generationStatus === "error" ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-800"
          }`}>
            {generationMessage}
          </div>
        )}
        {pendingPrepKit && (
          <div className="mt-4 border-t border-indigo-100 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Review AI Prep Kit</h4>
                <p className="text-xs text-gray-500">Edit generated data before it becomes part of your local prep library.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={discardPendingPrepKit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <X size={15} /> Discard
                </button>
                <button
                  type="button"
                  onClick={savePendingPrepKit}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <CheckCircle2 size={15} /> Save Prep Kit
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-700">
                  Learning path title
                  <input
                    value={pendingPrepKit.learningPath.title}
                    onChange={(e) => updatePendingPath({ title: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-700">
                  Learning path description
                  <textarea
                    value={pendingPrepKit.learningPath.description}
                    onChange={(e) => updatePendingPath({ description: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Modules</p>
                  {pendingPrepKit.learningPath.modules.map((module) => (
                    <div key={module.id} className="space-y-1 border-l-2 border-indigo-100 pl-3">
                      <input
                        value={module.title}
                        onChange={(e) => updatePendingModule(module.id, { title: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        aria-label={`Module title: ${module.title}`}
                      />
                      <textarea
                        value={module.description}
                        onChange={(e) => updatePendingModule(module.id, { description: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        aria-label={`Module description: ${module.title}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Flashcards</p>
                {pendingPrepKit.flashcards.map((card) => (
                  <div key={card.id} className="space-y-1 border-l-2 border-emerald-100 pl-3">
                    <input
                      value={card.question}
                      onChange={(e) => updatePendingFlashcard(card.id, { question: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      aria-label={`Flashcard question: ${card.question}`}
                    />
                    <textarea
                      value={card.answer}
                      onChange={(e) => updatePendingFlashcard(card.id, { answer: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      aria-label={`Flashcard answer: ${card.question}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((skill) => (
          <div
            key={skill.id}
            onClick={() => setEditingSkill(skill)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900 text-sm">{skill.name}</p>
                <span className="text-xs text-gray-400">{skill.category}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                skill.priority === "high" ? "bg-red-50 text-red-600" :
                skill.priority === "medium" ? "bg-amber-50 text-amber-600" :
                "bg-gray-50 text-gray-500"
              }`}>
                {skill.priority}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Current</span>
                <StarRating value={skill.level} onChange={() => {}} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Target</span>
                <StarRating value={skill.targetLevel} onChange={() => {}} />
              </div>
            </div>
            {skill.notes && <p className="text-xs text-gray-500 mt-2 truncate">{skill.notes}</p>}
          </div>
        ))}
      </div>

      {/* Edit Skill Modal */}
      {editingSkill && (
        <Modal isOpen={!!editingSkill} onClose={() => setEditingSkill(null)} title={`Edit: ${editingSkill.name}`}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Current Level</label>
              <StarRating value={editingSkill.level} onChange={(v) => setEditingSkill({ ...editingSkill, level: v })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Target Level</label>
              <StarRating value={editingSkill.targetLevel} onChange={(v) => setEditingSkill({ ...editingSkill, targetLevel: v })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select value={editingSkill.priority} onChange={(e) => setEditingSkill({ ...editingSkill, priority: e.target.value as "high" | "medium" | "low" })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={editingSkill.notes} onChange={(e) => setEditingSkill({ ...editingSkill, notes: e.target.value })}
                rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <button onClick={() => { updateSkill(editingSkill.id, { level: editingSkill.level, targetLevel: editingSkill.targetLevel, priority: editingSkill.priority, notes: editingSkill.notes }); setEditingSkill(null); refresh(); }}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Save Changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
