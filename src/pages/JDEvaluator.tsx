import { useMemo, useState } from "react";
import { Search, Loader, Save, Plus, Sparkles, AlertTriangle, FileText } from "lucide-react";
import { addApplication, getResumes } from "../store";
import { extractFromJD } from "../utils/extract";
import { analyzeResumeMatch } from "../utils/resumeMatch";
import { backend } from "../lib/backend";
import type { Application, ResumeVersion } from "../types";

function generateId() {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function keywordHits(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.filter((word) => lower.includes(word.toLowerCase()));
}

function buildLocalEvaluation(text: string, extracted: { company: string; role: string; url: string }) {
  const role = extracted.role || "Target role";
  const company = extracted.company || "Company";
  const mustHaves = keywordHits(text, [
    "required", "must have", "minimum", "license", "certification", "portfolio", "degree",
    "years", "experience", "communication", "leadership", "stakeholder", "customer",
  ]);
  const prepSignals = keywordHits(text, [
    "case study", "technical interview", "presentation", "panel", "assignment", "portfolio",
    "onsite", "behavioral", "coding", "scenario", "clinical", "sales", "writing",
  ]);
  const riskSignals = keywordHits(text, [
    "fast-paced", "wear many hats", "startup", "on-call", "travel", "contract",
    "commission", "night", "weekend", "relocation", "clearance",
  ]);
  const fitScore = Math.max(2, Math.min(5, 5 - Math.floor(riskSignals.length / 3)));

  return `# Job Evaluation

A) ROLE SUMMARY
${company} is hiring for ${role}. This looks like a role where success depends on matching the must-have requirements, proving relevant outcomes, and preparing examples around the work described in the JD.

B) CV MATCH
Score: ${fitScore}/5

Matching signals to confirm:
- Mirror the exact title and domain language from the posting.
- Pull 3-5 accomplishments that prove the highest-priority requirements.
- Convert responsibilities into evidence: tools used, people served, outcomes, and scale.

Requirements detected:
${mustHaves.length ? mustHaves.map((word) => `- ${word}`).join("\n") : "- No explicit must-have language detected. Review the JD manually for non-obvious requirements."}

C) LEVEL STRATEGY
Position yourself at the level implied by ownership, scope, and decision-making in the JD. If the role mentions cross-functional leadership, metrics, or ambiguous problem-solving, prepare examples where you owned outcomes rather than tasks.

D) COMPENSATION
Extract the visible range if present. If no range is listed, ask for the approved range before a late-stage interview and compare it against your location, level, schedule, and benefits.

E) PERSONALIZATION
- Explain why this company, team, customer, or mission is specifically interesting.
- Map one past result to one business problem in the JD.
- Ask one sharp question about priorities for the first 90 days.

F) INTERVIEW PREP
Likely prep areas:
${prepSignals.length ? prepSignals.map((word) => `- ${word}`).join("\n") : "- Behavioral examples, role fundamentals, and company-specific questions."}

Risks to clarify:
${riskSignals.length ? riskSignals.map((word) => `- ${word}`).join("\n") : "- No obvious risk language detected."}

Overall: ${fitScore}/5 - VERDICT: MAYBE`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

export default function JDEvaluator() {
  const [input, setInput] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultSource, setResultSource] = useState("");
  const [error, setError] = useState("");
  const [extracted, setExtracted] = useState({ company: "", role: "", url: "" });
  const [resumes] = useState<ResumeVersion[]>(() => getResumes());
  const [selectedResumeId, setSelectedResumeId] = useState(() => resumes[0]?.id || "");
  const [saved, setSaved] = useState(false);

  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId);
  const resumeMatch = useMemo(() => {
    if (!input.trim() || !selectedResume?.content.trim()) return null;
    return analyzeResumeMatch(input, selectedResume.content);
  }, [input, selectedResume]);

  const tryExtract = (text: string) => {
    const { company, role, url } = extractFromJD(text);
    setExtracted({ company, role, url });
  };

  const handleSave = () => {
    if (!extracted.company || !extracted.role) {
      setError("Add a company and role before saving to the pipeline.");
      return;
    }
    try {
      const now = new Date().toISOString();
      const application: Application = {
        id: generateId(),
        company: extracted.company || "Unknown",
        role: extracted.role || "Unknown",
        url: extracted.url,
        jdText: input.trim(),
        status: "saved",
        dateApplied: now,
        score: resumeMatch ? Math.max(1, Math.ceil(resumeMatch.score / 20)) : resultSource.startsWith("AI backend") ? 5 : 3,
        contacts: [],
        documents: [],
        notes: [
          "Saved from JD Evaluator.",
          resultSource || "Needs manual review.",
          selectedResume && resumeMatch ? `Resume checked: ${selectedResume.title} (${resumeMatch.score}% JD match).` : "",
        ].filter(Boolean).join(" "),
        timeline: [{ date: now, type: "saved", description: "Created from JD Evaluator" }],
        createdAt: now,
        updatedAt: now,
      };
      addApplication(application);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(errorMessage(e) || "Save failed");
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
      const response = await backend.evaluateJD(input.trim());
      setResult(response.evaluation);
      setResultSource(`AI backend: ${response.agent}${response.model ? ` / ${response.model}` : ""}`);
    } catch (e: unknown) {
      setResult(buildLocalEvaluation(input.trim(), extracted));
      setResultSource("Local heuristic fallback. Start the backend for profile-aware AI analysis.");
      setError(errorMessage(e) ? "Backend unavailable. Showing local heuristic analysis." : "");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">JD Evaluator</h1>
        <p className="text-gray-500 mt-1">Paste a job description, score fit, and save the opportunity</p>
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

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileText size={15} className="text-indigo-500" /> Resume Fit
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Compare this JD against a saved resume before adding it to the pipeline.
              </p>
            </div>
            {resumeMatch && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resumeScoreClass(resumeMatch.score)}`}>
                {resumeMatch.score}% match
              </span>
            )}
          </div>

          {resumes.length > 0 ? (
            <>
              <label htmlFor="jd-resume" className="mt-3 block text-xs font-medium text-gray-700">Resume version</label>
              <select
                id="jd-resume"
                value={selectedResumeId}
                onChange={(event) => setSelectedResumeId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.title} {resume.targetRole ? `- ${resume.targetRole}` : ""}
                  </option>
                ))}
              </select>

              {resumeMatch ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <ResumeTermPanel
                    title="Matched"
                    terms={resumeMatch.matchedTerms.map((term) => term.term)}
                    empty="No JD terms found in this resume yet."
                    tone="green"
                  />
                  <ResumeTermPanel
                    title="Missing"
                    terms={resumeMatch.missingTerms.map((term) => term.term)}
                    empty="No obvious gaps from extracted terms."
                    tone="amber"
                  />
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Evidence lines</h4>
                    {resumeMatch.evidenceLines.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {resumeMatch.evidenceLines.map((line) => (
                          <li key={line}>- {line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">Add measurable resume bullets matching the highest-priority JD terms.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-gray-400">Paste a JD to calculate fit against this resume.</p>
              )}
            </>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-500">
              Add a resume version first to see keyword gaps, proof lines, and fit score here.
            </div>
          )}
        </div>

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
            Save now, evaluate deeply later. Capture the opportunity before context disappears.
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
              Evaluation
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
              <strong>{resultSource.startsWith("AI backend") ? "Profile-aware output." : "Local fallback."}</strong>{" "}
              {resultSource}
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
          <li>Paste the full JD for best extraction and scoring</li>
          <li>The portal auto-extracts company and role, then lets you edit before saving</li>
          <li>Backend analysis uses your profile; local fallback keeps the workflow usable offline</li>
          <li>Save promising roles to Applications so follow-up, prep, contacts, and notes stay connected</li>
        </ul>
      </div>
    </div>
  );
}

function resumeScoreClass(score: number) {
  if (score >= 75) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function ResumeTermPanel({
  title,
  terms,
  empty,
  tone,
}: {
  title: string;
  terms: string[];
  empty: string;
  tone: "green" | "amber";
}) {
  const chipClass = tone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h4>
      {terms.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {terms.slice(0, 8).map((term) => (
            <span key={term} className={`rounded-full px-2 py-1 text-xs ${chipClass}`}>{term}</span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-gray-400">{empty}</p>
      )}
    </div>
  );
}
