import { useState } from "react";
import { Search, Loader, Save, Plus, Sparkles, AlertTriangle } from "lucide-react";
import { addApplication } from "../store";
import { extractFromJD } from "../utils/extract";

export default function JDEvaluator() {
  const [input, setInput] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [extracted, setExtracted] = useState({ company: "", role: "", url: "" });
  const [saved, setSaved] = useState(false);

  // Big Mick v1.3.2 YELLOW fix: smart extraction.
  // The old inline regex grabbed "TestCo. We need 5" as the company name.
  // Now uses src/utils/extract.ts with proper sentence-boundary detection.
  const tryExtract = (text: string) => {
    const { company, role, url } = extractFromJD(text);
    setExtracted({ company, role, url });
  };

  const handleSave = () => {
    if (!extracted.company || !extracted.role) {
      alert("Could not extract company and role. Please edit manually after saving.");
    }
    try {
      addApplication({
        company: extracted.company || "Unknown",
        role: extracted.role || "Unknown",
        url: extracted.url,
        jdText: input.trim(),
        status: "saved",
        dateApplied: new Date().toISOString(),
        score: 4,
        contacts: [],
        documents: [],
        notes: "Saved from JD Evaluator — needs manual review",
        timeline: [{ date: new Date().toISOString(), type: "saved", description: "Created from JD Evaluator" }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || "Save failed");
    }
  };

  const handleInput = (v: string) => {
    setInput(v);
    // v1.3.2: try extracting on any meaningful change (was >100 chars, too late)
    if (v.length > 30) tryExtract(v);
  };

  const handleEvaluate = async () => {
    if (!input.trim()) return;
    setEvaluating(true);
    setError("");
    setResult(null);

    try {
      // Simulated evaluation template — Hermes agent handles full AI analysis
      const evaluation = `# Job Evaluation

## A) Role Summary
Based on the job description, this role involves ${input.trim().slice(0, 100)}...

**Estimated Level**: Senior / Staff
**Relevant for You**: Potentially — evaluate below.

---

## B) CV Match Score: ⭐⭐⭐ / 5

### Matching Skills
- AI/LLM expertise — strong alignment
- React/TypeScript — daily driver
- Python — primary language
- MCP & Agentic workflows — core competency

### Gaps
- Evaluate specific tech stack requirements
- Check for cloud platforms not yet mastered
- Verify years-of-experience match

---

## C) Level Strategy
**Current level**: Senior Software Engineer (Contract)
**Target level**: Staff / Lead for FTE, Senior+ for C2C

Position yourself as: **AI-First Full-Stack Engineer** — emphasize the MCP/agent stack.

---

## D) Compensation
- **C2C rate**: Target $100-130/hr
- **FTE range**: $140-180K CAD + equity
- **Market check**: Compare with Levels.fyi for similar roles

---

## E) Personalization Hooks
1. Your experience building MCP servers for industrial data bridges
2. Azure AI certification + production LLM deployment experience
3. Full-stack capability: React UI → TypeScript API → Python ML pipeline

---

## F) Interview Prep Roadmap
1. **System Design**: Review scaling patterns for AI platforms
2. **MCP Deep Dive**: Prepare to explain protocol architecture
3. **Behavioral**: Prepare STAR stories for "tell me about a time"
4. **Technical**: Expect live coding in TypeScript/Python

---

## Overall Score: Analyze further before applying

**Verdict**: 📝 Review details before deciding — use the full Hermes agent evaluation for deeper analysis.`;

      setResult(evaluation);
    } catch (e: any) {
      setError(e.message || "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">JD Evaluator</h1>
        <p className="text-gray-500 mt-1">Paste a job description — get scored, matched, and prepped</p>
      </div>

      {/* Primary action: paste + extract + save */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label htmlFor="jd-input" className="block text-sm font-medium text-gray-700 mb-2">
          Job Description (URL or paste text)
        </label>
        <textarea
          id="jd-input"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Paste a job description URL or the full JD text here..."
        />

        {/* Auto-extracted + save — above the fold for the primary workflow */}
        {(extracted.company || extracted.role) && (
          <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
              <Save size={14} /> Detected
              <span className="text-xs font-normal text-indigo-600 ml-auto">
                Edit before saving
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label htmlFor="jd-company" className="block text-xs text-indigo-700 mb-1">Company</label>
                <input
                  id="jd-company"
                  value={extracted.company}
                  onChange={(e) => setExtracted({ ...extracted, company: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-indigo-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Not detected"
                />
              </div>
              <div>
                <label htmlFor="jd-role" className="block text-xs text-indigo-700 mb-1">Role</label>
                <input
                  id="jd-role"
                  value={extracted.role}
                  onChange={(e) => setExtracted({ ...extracted, role: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-indigo-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Not detected"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="jd-url" className="block text-xs text-indigo-700 mb-1">URL</label>
                <input
                  id="jd-url"
                  value={extracted.url}
                  onChange={(e) => setExtracted({ ...extracted, url: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-indigo-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="https://..."
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saved}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saved ? <>✓ Saved to Applications</> : <><Plus size={14} /> Add to Pipeline</>}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400">
            ✨ Save now, evaluate later — the goal is to capture the opportunity fast.
          </p>
          <button
            onClick={handleEvaluate}
            disabled={evaluating || !input.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
          >
            {evaluating ? (
              <><Loader size={16} className="animate-spin" /> Evaluating...</>
            ) : (
              <><Search size={16} /> Evaluate</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              AI-Suggested Evaluation
            </h2>
            <button
              onClick={() => { setResult(null); setInput(""); }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Template output.</strong> This is a structured scaffold based on common
              evaluation patterns. For real AI analysis, use{" "}
              <code className="bg-amber-100 px-1 rounded">/prep evaluate</code> in your Hermes
              session.
            </p>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-indigo-800 mb-2">How to use the JD Evaluator</h3>
        <ul className="space-y-1 text-sm text-indigo-700">
          <li>• Paste the full JD (not just the URL) for best results</li>
          <li>• The portal auto-extracts company + role — edit before saving if needed</li>
          <li>• Save first, evaluate second — opportunity capture &gt; analysis paralysis</li>
          <li>• For real AI evaluation, run <code className="bg-indigo-100 px-1 rounded">/prep evaluate</code> in Hermes</li>
        </ul>
      </div>
    </div>
  );
}
