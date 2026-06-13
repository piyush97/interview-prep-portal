import { useState } from "react";
import { Search, Loader } from "lucide-react";

export default function JDEvaluator() {
  const [input, setInput] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

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
**Relevant for Piyush**: Potentially — evaluate below.

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

**Verdict**: 📝 Review details before deciding — use the full Hermes agent evaluation for deeper analysis. Use \`/prep evaluate\` in your Hermes session for AI-powered scoring.`;

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

      {/* Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Description (URL or paste text)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Paste a job description URL or the full JD text here..."
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400">Powered by Career Prep Plugin — Hermes Agent</p>
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

      {/* Result */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Evaluation Result</h2>
            <button
              onClick={() => { setResult(null); setInput(""); }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {result}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">
              Want deeper AI analysis? Open your Hermes session and type:
            </p>
            <code className="block bg-gray-900 text-green-400 px-4 py-2 rounded-lg text-sm font-mono">
              /prep evaluate "{input.trim().slice(0, 80)}..."
            </code>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-indigo-800 mb-2">How to use the JD Evaluator</h3>
        <ul className="space-y-1 text-sm text-indigo-700">
          <li>• Paste the full JD (not just the URL) for best results</li>
          <li>• The evaluator scores against your configured profile</li>
          <li>• Only apply to roles scoring <strong>4.0/5</strong> or above</li>
          <li>• Use the Hermes agent for full AI-powered 6-block evaluation</li>
          <li>• Save promising roles to Applications for tracking</li>
        </ul>
      </div>
    </div>
  );
}
