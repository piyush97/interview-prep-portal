import { useEffect, useState } from "react";
import { Plus, Trash2, Check, Clock, Bell, X, BellRing } from "lucide-react";
import {
  getReminders, addReminder, updateReminder, deleteReminder,
  getApplications,
} from "../store";
import type { Reminder } from "../types";

type ReminderType = Reminder["type"];

const TYPES: { value: ReminderType; label: string; color: string }[] = [
  { value: "follow-up", label: "Follow-up", color: "bg-blue-100 text-blue-700" },
  { value: "interview", label: "Interview", color: "bg-purple-100 text-purple-700" },
  { value: "deadline", label: "Deadline", color: "bg-red-100 text-red-700" },
  { value: "study", label: "Study", color: "bg-emerald-100 text-emerald-700" },
  { value: "general", label: "General", color: "bg-gray-100 text-gray-700" },
];

function colorForType(t: ReminderType): string {
  return TYPES.find((x) => x.value === t)?.color || "bg-gray-100 text-gray-700";
}

function daysUntil(iso: string): number {
  const target = new Date(iso);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const apps = useState(getApplications())[0];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    type: "follow-up" as ReminderType,
    relatedId: "",
    notes: "",
  });

  const refresh = () => setReminders(getReminders());

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    addReminder({
      title: form.title,
      date: new Date(form.date).toISOString(),
      type: form.type,
      status: "pending",
      relatedId: form.relatedId || undefined,
      notes: form.notes || undefined,
    } as Reminder);
    setForm({ ...form, title: "", notes: "" });
    setShowForm(false);
    refresh();
  };

  const handleToggle = (id: string, current: Reminder["status"]) => {
    updateReminder(id, { status: current === "done" ? "pending" : "done" });
    refresh();
  };

  const handleSnooze = (id: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    updateReminder(id, { date: tomorrow.toISOString(), status: "snoozed" });
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this reminder?")) {
      deleteReminder(id);
      refresh();
    }
  };

  const pending = reminders.filter((r) => r.status !== "done");
  const done = reminders.filter((r) => r.status === "done");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-500 mt-1">Follow-ups, interviews, deadlines</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New Reminder"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Follow up with Anthropic on AI Engineer role"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ReminderType })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {apps.length > 0 && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Linked Application</label>
                <select
                  value={form.relatedId}
                  onChange={(e) => setForm({ ...form, relatedId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— None —</option>
                  {apps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.company} — {a.role}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Optional context..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Add Reminder
            </button>
          </div>
        </form>
      )}

      {/* Pending */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <BellRing size={16} className="text-amber-500" />
          Active ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Bell size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No active reminders. Stay on top of follow-ups!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => {
              const days = daysUntil(r.date);
              const overdue = days < 0;
              const soon = days >= 0 && days <= 3;
              const linkedApp = r.relatedId ? apps.find((a) => a.id === r.relatedId) : null;
              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-xl border p-4 ${
                    overdue ? "border-red-200" : soon ? "border-amber-200" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorForType(r.type)}`}>
                          {TYPES.find((t) => t.value === r.type)?.label || r.type}
                        </span>
                        {r.status === "snoozed" && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700">
                            Snoozed
                          </span>
                        )}
                        {overdue && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                            Overdue
                          </span>
                        )}
                        {soon && !overdue && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900">{r.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(r.date).toLocaleDateString()}
                        {linkedApp && ` • ${linkedApp.company} — ${linkedApp.role}`}
                      </p>
                      {r.notes && <p className="text-sm text-gray-600 mt-2">{r.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle(r.id, r.status)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Mark done"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleSnooze(r.id)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                        title="Snooze 1 day"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Check size={16} className="text-green-500" />
            Completed ({done.length})
          </h2>
          <div className="space-y-2">
            {done.map((r) => (
              <div key={r.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(r.id, r.status)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check size={14} />
                    </button>
                    <span className="text-sm line-through text-gray-600">{r.title}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
