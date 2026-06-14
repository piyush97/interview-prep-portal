/**
 * Smart company/role extraction from a job description.
 *
 * Big Mick v1.3.2 YELLOW fix: the original regex
 *   /(?:at|@|for)\s+([A-Z][A-Za-z0-9&.\- ]{1,40}(?:\s+(?:Inc|LLC|Ltd|Corp|Co|Corporation))?)/
 * was over-eager — it would grab "TestCo. We need 5" because the capture group
 * accepted any punctuation/space after the company name up to a corporate suffix.
 *
 * The new algorithm:
 *  1. Find candidate spans of "at/join <Capitalized phrase>".
 *  2. For each candidate, require one of these "looks like a company" signals:
 *       a) a corporate suffix (Inc, LLC, Ltd, Corp, Co, Corporation, Holdings, etc.)
 *       b) 2+ Title-Case words
 *       c) contains an ampersand or hyphen (e.g. "Procter & Gamble", "Aero-Vista")
 *  3. Trim trailing punctuation.
 *  4. Among valid candidates, prefer the one with the highest score.
 *     Fall back to "" if none pass the heuristics.
 */

const COMPANY_SUFFIXES = [
  "Inc", "LLC", "L.L.C", "Ltd", "Limited", "Corp", "Corporation",
  "Co", "Company", "Holdings", "Group", "Partners", "Ventures",
  "Labs", "Lab", "Studios", "Studio", "Technologies", "Tech",
  "Systems", "Networks", "Capital", "Industries", "Solutions",
  "Software", "Health", "Bio", "Biosciences", "Pharma",
  "Bank", "Financial", "Securities", "Trust", "Mutual",
  "Foundation", "Institute", "University", "College", "School",
];

const SUFFIX_BOUNDARY = `(?:${COMPANY_SUFFIXES.map(escapeRegex).join("|")})\\.?`;

/**
 * Try to extract a company name. Returns "" if nothing sensible is found.
 */
export function extractCompany(text: string): string {
  if (!text || text.length < 10) return "";

  const candidates: string[] = [];

  // Strategy 1: "at <Suffix>" — strongest signal. Suffix forces termination.
  // E.g. "at Anthropic Inc", "at Wealthsimple, Inc."
  const suffixRe = new RegExp(
    `\\b(?:at|@|for|with|join)\\s+([A-Z][A-Za-z][A-Za-z0-9&',\\- ]*?\\s*,?\\s+${SUFFIX_BOUNDARY})`,
    "g"
  );
  for (const m of text.matchAll(suffixRe)) {
    candidates.push(m[1].trim());
  }

  // Strategy 2: "at <2+ Capitalized words>" — weaker but useful for "at Bench Sciences"
  // Stops at: sentence end (`. `), clause break (and/or/with/of/in), or new line.
  const capWordsRe = /\b(?:at|@|for|with|join)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,4})(?=\s+(?:is|are|was|were|has|have|seeks|hiring|for|to|with|and|or|of|in|on|at|by)|[.,;:\n!?]|$)/g;
  for (const m of text.matchAll(capWordsRe)) {
    const phrase = m[1].trim();
    // Skip generic English words
    if (/^(The|This|That|Our|Your|My|We|You|They|I)\b/.test(phrase)) continue;
    if (/^(Senior|Junior|Lead|Head|Chief|Principal|Staff)\s/i.test(phrase)) continue;
    if (/^(A|An)\b/.test(phrase)) continue;
    candidates.push(phrase);
  }

  // Strategy 3: ampersand/hyphen names
  const specialRe = /\b(?:at|@|for|with|join)\s+([A-Z][A-Za-z]*(?:\s*&\s*[A-Z][A-Za-z]*|\s*-\s*[A-Z][A-Za-z]*)+)(?=\s+|\.|,|;|\n|$)/g;
  for (const m of text.matchAll(specialRe)) {
    candidates.push(m[1].trim());
  }

  if (candidates.length === 0) return "";

  // Score each candidate.
  const scored = candidates.map((phrase) => {
    let score = 0;

    // Suffix match: strongest signal
    for (const suffix of COMPANY_SUFFIXES) {
      const suffixRe = new RegExp(`(?:^|,?\\s+)${escapeRegex(suffix)}\\.?$`, "i");
      if (suffixRe.test(phrase)) {
        score += 100;
        break;
      }
    }

    // 2+ Title-Case words (split on space, hyphen, ampersand)
    const titleWords = phrase
      .split(/[\s\-&]+/)
      .filter((w) => w.length > 0 && /^[A-Z]/.test(w) && /[a-z]/.test(w));
    if (titleWords.length >= 2) score += 30;
    if (titleWords.length >= 3) score += 20;

    // Ampersand or hyphen (both signal compound company names)
    if (phrase.includes("&")) score += 40;
    if (phrase.includes("-")) score += 30;

    // Slight preference for longer (more specific) names
    score += Math.min(phrase.length, 40);

    // Penalty for generic
    if (/^(The|This|That|Our|Your|My|We|You|They|I)\b/.test(phrase)) score -= 50;
    if (/^(Senior|Junior|Lead|Head|Chief|Principal|Staff)\s/i.test(phrase)) score -= 80;

    return { phrase, score };
  });

  // Sort by score desc, return the best
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Only return if it passes a basic threshold
  if (best.score < 20) return "";

  return trimTrailingPunct(best.phrase);
}

/**
 * Try to extract the role. Common patterns: "Position:", "Role:", "Title:",
 * "Hiring a ...", "Looking for a ...".
 */
export function extractRole(text: string): string {
  if (!text) return "";

  // Explicit "Position: X" / "Role: X" / "Title: X"
  const labeled = text.match(/(?:Position|Role|Title|Job\s*Title|Opening)\s*:\s*([^\n]+)/i);
  if (labeled?.[1]) {
    let role = labeled[1].trim();
    // Strip trailing " at <Company>" — the company is captured separately
    role = role.replace(/\s+at\s+.+$/i, "");
    return trimTrailingPunct(role);
  }

  // "Hiring a <Role>" / "Looking for a <Role>" / "Join us as a <Role>"
  const hiring = text.match(/(?:hiring|looking\s+for|join\s+us\s+as|seeking)\s+(?:a|an|the)?\s*([A-Z][A-Za-z\-/ ]{2,60}?)(?:\s+to|\s+who|\s+with|\s+at|\s+in|\.|\n)/i);
  if (hiring?.[1]) {
    return trimTrailingPunct(hiring[1].trim());
  }

  return "";
}

/**
 * Extract the first URL.
 */
export function extractURL(text: string): string {
  if (!text) return "";
  const m = text.match(/https?:\/\/\S+/);
  return m?.[0]?.replace(/[.,;)\]]+$/, "") ?? "";
}

/**
 * Convenience: extract all three in one pass.
 */
export type ExtractedJD = {
  company: string;
  role: string;
  url: string;
};

export function extractFromJD(text: string): ExtractedJD {
  return {
    company: extractCompany(text),
    role: extractRole(text),
    url: extractURL(text),
  };
}

// --- helpers ---

function trimTrailingPunct(s: string): string {
  return s.replace(/[.,;:!?\-—]+\s*$/, "").trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
