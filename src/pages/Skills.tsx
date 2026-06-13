import { useEffect, useState } from "react";
import { getSkills, updateSkill } from "../store";
import Modal from "../components/Modal";
import type { Skill, SkillCategory } from "../types";
import { Star, Search } from "lucide-react";

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

  useEffect(() => { setSkills(getSkills()); }, []);

  const refresh = () => setSkills(getSkills());

  const filtered = skills.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || s.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const gapSkills = skills.filter((s) => s.level < s.targetLevel).sort((a, b) => b.priority.localeCompare(a.priority));

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
