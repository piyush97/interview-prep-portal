export interface AnswerCoachResult {
  score: number;
  level: "empty" | "needs-work" | "solid" | "strong";
  strengths: string[];
  improvements: string[];
}

const ACTION_VERBS = [
  "built", "created", "led", "owned", "improved", "reduced", "increased",
  "launched", "designed", "implemented", "coordinated", "resolved", "delivered",
  "analyzed", "trained", "managed", "negotiated", "prioritized",
];

const IMPACT_WORDS = [
  "result", "impact", "outcome", "revenue", "cost", "time", "quality",
  "customer", "patient", "student", "team", "metric", "measured", "saved",
  "reduced", "increased", "improved", "delivered",
];

const STRUCTURE_WORDS = [
  "situation", "task", "action", "result", "reflection", "context",
  "problem", "approach", "tradeoff", "learned",
];

const VAGUE_PHRASES = [
  "hard worker", "team player", "responsible for", "helped with", "worked on",
  "various", "many things", "stuff", "etc",
];

export function coachInterviewAnswer(answer: string, category: string): AnswerCoachResult {
  const trimmed = answer.trim();
  if (!trimmed) {
    return {
      score: 0,
      level: "empty",
      strengths: [],
      improvements: ["Write an answer first, then coach it against structure, evidence, and impact."],
    };
  }

  const lower = trimmed.toLowerCase();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const hasNumbers = /\b\d+[%$kKmM]?\b|\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(trimmed);
  const actionHits = ACTION_VERBS.filter((word) => lower.includes(word));
  const impactHits = IMPACT_WORDS.filter((word) => lower.includes(word));
  const structureHits = STRUCTURE_WORDS.filter((word) => lower.includes(word));
  const vagueHits = VAGUE_PHRASES.filter((phrase) => lower.includes(phrase));

  let score = 0;
  if (words.length >= 45) score += 15;
  if (words.length >= 80 && words.length <= 220) score += 10;
  if (structureHits.length >= 2) score += 20;
  if (actionHits.length >= 2) score += 15;
  if (impactHits.length >= 2) score += 15;
  if (hasNumbers) score += 15;
  if (mentionsCategorySignal(lower, category)) score += 10;
  score = Math.max(0, Math.min(100, score - vagueHits.length * 8));

  const strengths: string[] = [];
  if (structureHits.length >= 2) strengths.push("Clear structure");
  if (actionHits.length >= 2) strengths.push("Action-oriented");
  if (impactHits.length >= 2) strengths.push("Impact language present");
  if (hasNumbers) strengths.push("Includes measurable evidence");
  if (words.length >= 80 && words.length <= 220) strengths.push("Good interview length");

  const improvements: string[] = [];
  if (vagueHits.length > 0) improvements.push(`Replace vague phrasing: ${vagueHits.join(", ")}.`);
  if (structureHits.length < 2) improvements.push("Add explicit context, action, result, and reflection.");
  if (actionHits.length < 2) improvements.push("Use stronger first-person action verbs.");
  if (impactHits.length < 2) improvements.push("Tie the story to customer, business, team, patient, student, or operational impact.");
  if (!hasNumbers) improvements.push("Add one measurable detail: size, time, money, quality, volume, or before/after.");
  if (words.length < 45) improvements.push("Expand with enough context for an interviewer to trust the story.");
  if (words.length > 220) improvements.push("Trim to the strongest 90-180 words for live delivery.");
  if (!mentionsCategorySignal(lower, category)) improvements.push(categoryCue(category));

  return {
    score,
    level: score >= 80 ? "strong" : score >= 60 ? "solid" : "needs-work",
    strengths,
    improvements: improvements.slice(0, 4),
  };
}

function mentionsCategorySignal(lower: string, category: string) {
  if (category === "behavioral") return /learned|reflection|stakeholder|conflict|feedback|team/.test(lower);
  if (category === "technical") return /constraint|tradeoff|debug|design|system|test|scale|failure/.test(lower);
  if (category === "system-design") return /scale|latency|reliability|tradeoff|database|queue|cache|failure/.test(lower);
  return /role|company|customer|impact|result/.test(lower);
}

function categoryCue(category: string) {
  if (category === "behavioral") return "Add reflection: what changed in how you work now.";
  if (category === "technical") return "Add technical depth: constraints, tradeoffs, tests, or failure mode.";
  if (category === "system-design") return "Add design depth: scale, reliability, data flow, and tradeoffs.";
  return "Tie the answer back to the target role and company.";
}
