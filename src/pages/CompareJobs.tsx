import { useState } from "react";
import { Scale, Briefcase, DollarSign, MapPin, Star, CheckCircle2, XCircle } from "lucide-react";

interface JobDraft {
  company: string;
  role: string;
  salary: string;
  remote: string;
  tech: string;
  pros: string;
  cons: string;
}

export default function CompareJobs() {
  const [a, setA] = useState<JobDraft>({ company: "", role: "", salary: "", remote: "", tech: "", pros: "", cons: "" });
  const [b, setB] = useState<JobDraft>({ company: "", role: "", salary: "", remote: "", tech: "", pros: "", cons: "" });
  const [showComparison, setShowComparison] = useState(false);

  const score = (job: JobDraft) => {
    let s = 0;
    if (job.salary && Number(job.salary) > 150000) s += 3;
    else if (job.salary) s += 1;
    if (job.remote.toLowerCase().includes("remote")) s += 2;
    if (job.tech.toLowerCase().includes("ai") || job.tech.toLowerCase().includes("llm")) s += 2;
    if (job.pros.split("\n").filter(Boolean).length >= 3) s += 1;
    return s;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Compare Jobs</h1>
        <button onClick={() => setShowComparison(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Scale className="w-4 h-4" /> Compare
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JobCard title="Job A" job={a} onChange={setA} />
        <JobCard title="Job B" job={b} onChange={setB} />
      </div>

      {showComparison && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Side-by-side</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="font-medium text-slate-700">Factor</div>
            <div className="font-semibold text-slate-900">{a.company || "Job A"}</div>
            <div className="font-semibold text-slate-900">{b.company || "Job B"}</div>

            <Row label="Role" a={a.role} b={b.role} />
            <Row label="Comp" a={a.salary} b={b.salary} icon={<DollarSign className="w-3 h-3" />} />
            <Row label="Remote" a={a.remote} b={b.remote} icon={<MapPin className="w-3 h-3" />} />
            <Row label="Stack" a={a.tech} b={b.tech} icon={<Briefcase className="w-3 h-3" />} />

            <div className="font-medium text-slate-700 flex items-center gap-1"><Star className="w-3 h-3" /> Score</div>
            <div className={`font-bold ${score(a) > score(b) ? "text-green-600" : ""}`}>{score(a)}</div>
            <div className={`font-bold ${score(b) > score(a) ? "text-green-600" : ""}`}>{score(b)}</div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <ProsCons title="Pros" items={a.pros} icon={<CheckCircle2 className="w-4 h-4 text-green-600" />} />
            <ProsCons title="Cons" items={a.cons} icon={<XCircle className="w-4 h-4 text-red-600" />} />
            <ProsCons title="Pros" items={b.pros} icon={<CheckCircle2 className="w-4 h-4 text-green-600" />} />
            <ProsCons title="Cons" items={b.cons} icon={<XCircle className="w-4 h-4 text-red-600" />} />
          </div>
        </div>
      )}
    </div>
  );
}

function JobCard({ title, job, onChange }: { title: string; job: JobDraft; onChange: (j: JobDraft) => void }) {
  const update = (field: keyof JobDraft, value: string) => onChange({ ...job, [field]: value });
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <input placeholder="Company" className="w-full px-3 py-2 border rounded-lg" value={job.company} onChange={e => update("company", e.target.value)} />
      <input placeholder="Role" className="w-full px-3 py-2 border rounded-lg" value={job.role} onChange={e => update("role", e.target.value)} />
      <input placeholder="Salary / total comp" className="w-full px-3 py-2 border rounded-lg" value={job.salary} onChange={e => update("salary", e.target.value)} />
      <input placeholder="Remote policy" className="w-full px-3 py-2 border rounded-lg" value={job.remote} onChange={e => update("remote", e.target.value)} />
      <input placeholder="Tech stack (comma separated)" className="w-full px-3 py-2 border rounded-lg" value={job.tech} onChange={e => update("tech", e.target.value)} />
      <textarea placeholder="Pros (one per line)" rows={3} className="w-full px-3 py-2 border rounded-lg" value={job.pros} onChange={e => update("pros", e.target.value)} />
      <textarea placeholder="Cons (one per line)" rows={3} className="w-full px-3 py-2 border rounded-lg" value={job.cons} onChange={e => update("cons", e.target.value)} />
    </div>
  );
}

function Row({ label, a, b, icon }: { label: string; a: string; b: string; icon?: React.ReactNode }) {
  return (
    <>
      <div className="font-medium text-slate-700 flex items-center gap-1">{icon}{label}</div>
      <div className="text-slate-800">{a || "-"}</div>
      <div className="text-slate-800">{b || "-"}</div>
    </>
  );
}

function ProsCons({ title, items, icon }: { title: string; items: string; icon: React.ReactNode }) {
  const lines = items.split("\n").filter(Boolean);
  return (
    <div>
      <h3 className="flex items-center gap-1 text-sm font-semibold text-slate-900 mb-1">{icon} {title}</h3>
      <ul className="list-disc list-inside text-sm text-slate-700">
        {lines.length ? lines.map((l, i) => <li key={i}>{l}</li>) : <li className="text-slate-400">None listed</li>}
      </ul>
    </div>
  );
}
