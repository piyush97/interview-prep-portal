import { useEffect, useState } from "react";
import { getOffers, addOffer, deleteOffer, updateOffer, calculateOfferScore } from "../store";
import type { Offer } from "../types";
import { Plus, Trash2, TrendingUp, DollarSign, Briefcase, MapPin, Calendar, Trophy } from "lucide-react";
import Modal from "../components/Modal";

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { setOffers(getOffers()); }, []);

  const handleAdd = (offer: Offer) => {
    const scored = { ...offer, score: calculateOfferScore(offer) };
    addOffer(scored);
    setOffers(getOffers());
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this offer?")) { deleteOffer(id); setOffers(getOffers()); }
  };

  const handleUpdateScore = (o: Offer) => {
    updateOffer(o.id, { score: calculateOfferScore(o) });
    setOffers(getOffers());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Offer Comparison</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Offer
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-slate-500">
          No offers yet. Add one when you get an offer to compare total comp, remote flexibility, and PTO.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {offers.map(o => (
            <div key={o.id} className={`bg-white rounded-xl shadow-sm border p-6 ${o.selected ? "ring-2 ring-blue-500" : ""}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{o.company}</h3>
                  <p className="text-slate-600">{o.role} • {o.level}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="text-2xl font-bold text-slate-900">{o.score}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-center gap-2 text-slate-700"><DollarSign className="w-4 h-4" /> Base: ${o.baseSalary.toLocaleString()}</div>
                <div className="flex items-center gap-2 text-slate-700"><TrendingUp className="w-4 h-4" /> Bonus: ${o.bonus.toLocaleString()}</div>
                <div className="flex items-center gap-2 text-slate-700"><Briefcase className="w-4 h-4" /> Equity: ${o.equity.toLocaleString()}</div>
                <div className="flex items-center gap-2 text-slate-700"><Calendar className="w-4 h-4" /> PTO: {o.pto} days</div>
                <div className="flex items-center gap-2 text-slate-700"><MapPin className="w-4 h-4" /> {o.remote}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleUpdateScore(o)} className="px-3 py-1.5 text-sm border rounded-md hover:bg-slate-50">Recalc Score</button>
                <button onClick={() => handleDelete(o.id)} className="px-3 py-1.5 text-sm border text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Offer">
        <OfferForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}

function OfferForm({ onSubmit, onCancel }: { onSubmit: (o: Offer) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<Offer>>({
    id: crypto.randomUUID(), company: "", role: "", level: "", location: "",
    baseSalary: 0, bonus: 0, equity: 0, pto: 15, remote: "hybrid", benefits: "", deadline: "", notes: "", score: 0,
  });

  const update = (field: keyof Offer, value: Offer[keyof Offer]) =>
    setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Company" className="px-3 py-2 border rounded-lg" value={form.company} onChange={e => update("company", e.target.value)} />
        <input placeholder="Role" className="px-3 py-2 border rounded-lg" value={form.role} onChange={e => update("role", e.target.value)} />
        <input placeholder="Level" className="px-3 py-2 border rounded-lg" value={form.level} onChange={e => update("level", e.target.value)} />
        <input placeholder="Location" className="px-3 py-2 border rounded-lg" value={form.location} onChange={e => update("location", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Base Salary" className="px-3 py-2 border rounded-lg" value={form.baseSalary} onChange={e => update("baseSalary", Number(e.target.value))} />
        <input type="number" placeholder="Bonus" className="px-3 py-2 border rounded-lg" value={form.bonus} onChange={e => update("bonus", Number(e.target.value))} />
        <input type="number" placeholder="Equity/yr value" className="px-3 py-2 border rounded-lg" value={form.equity} onChange={e => update("equity", Number(e.target.value))} />
        <input type="number" placeholder="PTO days" className="px-3 py-2 border rounded-lg" value={form.pto} onChange={e => update("pto", Number(e.target.value))} />
      </div>
      <select className="w-full px-3 py-2 border rounded-lg" value={form.remote} onChange={e => update("remote", e.target.value)}>
        <option value="fully-remote">Fully Remote</option>
        <option value="hybrid">Hybrid</option>
        <option value="onsite">On-site</option>
      </select>
      <input type="date" className="w-full px-3 py-2 border rounded-lg" value={form.deadline} onChange={e => update("deadline", e.target.value)} />
      <textarea placeholder="Notes (benefits, equity details, concerns)" rows={3} className="w-full px-3 py-2 border rounded-lg" value={form.notes} onChange={e => update("notes", e.target.value)} />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button onClick={() => onSubmit(form as Offer)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add Offer</button>
      </div>
    </div>
  );
}
