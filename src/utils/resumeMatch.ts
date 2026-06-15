const STOP_WORDS = new Set([
  "about", "above", "after", "again", "against", "also", "among", "and", "any",
  "apply", "are", "around", "because", "been", "being", "between", "both", "but", "can",
  "candidate", "company", "could", "day", "days", "description", "each", "for",
  "from", "has", "have", "having", "inc", "include", "included", "includes", "including",
  "interview", "into", "job", "jobs", "more", "must", "need", "our", "out",
  "over", "per", "requirement", "requirements", "role", "should", "skill", "skills",
  "someone", "position", "such", "that", "the", "their", "then", "this",
  "through", "to", "under", "using", "was", "we", "who", "will", "with", "work",
  "you", "your", "experience",
]);

const HIGH_SIGNAL_WORDS = new Set([
  "required", "requirement", "requirements", "must", "minimum", "certification",
  "license", "licensed", "degree", "proven", "expertise", "responsible",
  "lead", "own", "manage", "build", "design", "deliver",
]);

export interface ResumeMatchTerm {
  term: string;
  inResume: boolean;
  importance: number;
}

export interface ResumeMatchAnalysis {
  score: number;
  matchedTerms: ResumeMatchTerm[];
  missingTerms: ResumeMatchTerm[];
  evidenceLines: string[];
  totalTerms: number;
}

export function analyzeResumeMatch(jdText: string, resumeText: string): ResumeMatchAnalysis {
  const jdTerms = extractWeightedTerms(jdText);
  const resumeTerms = new Set(extractWeightedTerms(resumeText).map((item) => item.term));

  if (jdTerms.length === 0) {
    return { score: 0, matchedTerms: [], missingTerms: [], evidenceLines: [], totalTerms: 0 };
  }

  const terms = jdTerms.slice(0, 24).map((item) => ({
    ...item,
    inResume: termAppearsInResume(item.term, resumeTerms),
  }));
  const totalWeight = terms.reduce((sum, item) => sum + item.importance, 0);
  const matchedWeight = terms
    .filter((item) => item.inResume)
    .reduce((sum, item) => sum + item.importance, 0);

  return {
    score: Math.round((matchedWeight / Math.max(totalWeight, 1)) * 100),
    matchedTerms: terms.filter((item) => item.inResume).slice(0, 12),
    missingTerms: terms.filter((item) => !item.inResume).slice(0, 12),
    evidenceLines: findEvidenceLines(resumeText, terms.filter((item) => item.inResume).map((item) => item.term)),
    totalTerms: terms.length,
  };
}

function extractWeightedTerms(text: string): Array<{ term: string; importance: number }> {
  const normalized = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\S+@\S+/g, " ")
    .replace(/[^a-z0-9+#.\s-]/g, " ");
  const rawWords = normalized
    .split(/\s+/)
    .map(normalizeWord);
  const words = rawWords.filter(isUsefulTerm);

  const weighted = new Map<string, number>();
  for (const word of words) {
    weighted.set(word, (weighted.get(word) || 0) + (HIGH_SIGNAL_WORDS.has(word) ? 3 : 1));
  }

  for (let i = 0; i < rawWords.length - 1; i += 1) {
    if (!isUsefulTerm(rawWords[i]) || !isUsefulTerm(rawWords[i + 1])) continue;
    const phrase = `${rawWords[i]} ${rawWords[i + 1]}`;
    if (rawWords[i] !== rawWords[i + 1]) weighted.set(phrase, (weighted.get(phrase) || 0) + 2);
  }

  return [...weighted.entries()]
    .map(([term, importance]) => ({ term, importance }))
    .sort((a, b) => b.importance - a.importance || a.term.localeCompare(b.term));
}

function findEvidenceLines(resumeText: string, terms: string[]): string[] {
  if (terms.length === 0) return [];
  const termSet = new Set(terms);
  return resumeText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const normalized = line.toLowerCase();
      return [...termSet].some((term) => normalized.includes(term));
    })
    .slice(0, 5);
}

function termAppearsInResume(term: string, resumeTerms: Set<string>) {
  if (resumeTerms.has(term)) return true;
  if (!term.includes(" ")) return false;
  return term.split(" ").every((part) => resumeTerms.has(part));
}

function isUsefulTerm(word: string) {
  return word.length >= 3 && !STOP_WORDS.has(word);
}

function normalizeWord(word: string) {
  const clean = word.replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, "");
  if (!clean) return "";
  if (clean.length > 4 && clean.endsWith("ies")) return `${clean.slice(0, -3)}y`;
  if (clean.length > 4 && clean.endsWith("s")) return clean.slice(0, -1);
  return clean;
}
