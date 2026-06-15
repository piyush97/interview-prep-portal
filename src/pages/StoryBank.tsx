import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BookMarked, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "../components/Modal";
import { addStory, deleteStory, getStories, updateStory } from "../store";
import type { StoryBankEntry } from "../types";
import { splitList, storyHasProof, storyToAnswer } from "../utils/storyBank";

type StoryFormState = Omit<StoryBankEntry, "createdAt" | "updatedAt">;

function emptyStory(): StoryFormState {
  return {
    id: crypto.randomUUID?.() || Date.now().toString(36),
    title: "",
    situation: "",
    task: "",
    action: "",
    result: "",
    reflection: "",
    metrics: [],
    tags: [],
    targetRoles: [],
  };
}

export default function StoryBank() {
  const [stories, setStories] = useState<StoryBankEntry[]>([]);
  const [form, setForm] = useState<StoryFormState>(emptyStory());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const refresh = () => setStories(getStories());

  useEffect(() => { refresh(); }, []);

  const openNew = () => {
    setForm(emptyStory());
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (story: StoryBankEntry) => {
    setForm({
      id: story.id,
      title: story.title,
      situation: story.situation,
      task: story.task,
      action: story.action,
      result: story.result,
      reflection: story.reflection,
      metrics: story.metrics,
      tags: story.tags,
      targetRoles: story.targetRoles,
    });
    setEditingId(story.id);
    setShowModal(true);
  };

  const save = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      updateStory(editingId, form);
    } else {
      addStory({ ...form, createdAt: now, updatedAt: now });
    }
    setShowModal(false);
    refresh();
  };

  const remove = (id: string) => {
    if (confirm("Delete this story?")) {
      deleteStory(id);
      refresh();
    }
  };

  const proofCount = stories.filter(storyHasProof).length;
  const reusableCount = stories.filter((story) => story.tags.length > 0 || story.targetRoles.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Story Bank</h1>
          <p className="text-gray-500 mt-1">Reusable STAR stories for behavioral, leadership, and role-fit answers.</p>
        </div>
        <button onClick={openNew} className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={16} /> New Story
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard label="Stories" value={stories.length.toString()} detail="Reusable interview evidence" />
        <MetricCard label="With proof" value={proofCount.toString()} detail="Metric or numeric result included" />
        <MetricCard label="Tagged" value={reusableCount.toString()} detail="Mapped to roles or themes" />
      </div>

      {stories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <BookMarked className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
          <p className="font-medium text-gray-900">Build your evidence library.</p>
          <p className="text-sm text-gray-500 mt-1">Add wins, failures, conflicts, launches, and leadership moments before interviews get close.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {stories.map((story) => (
            <article key={story.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{story.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {story.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                    {story.targetRoles.map((role) => <Badge key={role}>{role}</Badge>)}
                    {storyHasProof(story) && <Badge tone="green">proof</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(story)} className="p-1.5 text-gray-400 hover:text-indigo-600" aria-label={`Edit ${story.title}`}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(story.id)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label={`Delete ${story.title}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <StoryField label="Situation" value={story.situation} />
                <StoryField label="Task" value={story.task} />
                <StoryField label="Action" value={story.action} />
                <StoryField label="Result" value={story.result} />
              </dl>

              {story.metrics.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Metrics</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {story.metrics.map((metric) => <Badge key={metric} tone="green">{metric}</Badge>)}
                  </div>
                </div>
              )}

              {story.reflection && (
                <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Reflection:</span> {story.reflection}</p>
              )}

              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                {storyToAnswer(story)}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Story" : "New Story"} wide>
        <StoryForm form={form} onChange={setForm} onCancel={() => setShowModal(false)} onSave={save} />
      </Modal>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <CheckCircle2 size={15} className="text-indigo-500" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function StoryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
      <dd className="mt-1 text-gray-700">{value || "Not captured"}</dd>
    </div>
  );
}

function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "green" }) {
  const color = tone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600";
  return <span className={`rounded-full px-2 py-0.5 text-xs ${color}`}>{children}</span>;
}

function StoryForm({
  form,
  onChange,
  onCancel,
  onSave,
}: {
  form: StoryFormState;
  onChange: (form: StoryFormState) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const update = (field: keyof StoryFormState, value: StoryFormState[keyof StoryFormState]) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
        <input value={form.title} onChange={(e) => update("title", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Reduced onboarding time by 28%" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextArea label="Situation" value={form.situation} onChange={(value) => update("situation", value)} />
        <TextArea label="Task" value={form.task} onChange={(value) => update("task", value)} />
        <TextArea label="Action" value={form.action} onChange={(value) => update("action", value)} />
        <TextArea label="Result" value={form.result} onChange={(value) => update("result", value)} />
      </div>
      <TextArea label="Reflection" value={form.reflection} onChange={(value) => update("reflection", value)} rows={2} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ListInput label="Metrics" value={form.metrics} onChange={(value) => update("metrics", value)} placeholder="28% faster, $120k saved" />
        <ListInput label="Tags" value={form.tags} onChange={(value) => update("tags", value)} placeholder="leadership, conflict" />
        <ListInput label="Target Roles" value={form.targetRoles} onChange={(value) => update("targetRoles", value)} placeholder="PM, engineer, manager" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
        <button onClick={onSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save Story</button>
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
    </div>
  );
}

function ListInput({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (value: string[]) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input value={value.join(", ")} onChange={(e) => onChange(splitList(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder={placeholder} />
    </div>
  );
}
