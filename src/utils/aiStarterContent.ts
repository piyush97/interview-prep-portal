import type { Flashcard, LearningPath, LearningModule } from "../types";

type RawStarterContent = {
  learning_path?: {
    title?: unknown;
    description?: unknown;
    modules?: unknown;
  };
  flashcards?: unknown;
};

const flashcardCategories = new Set<Flashcard["category"]>([
  "technical", "behavioral", "system-design", "ai-ml", "cloud", "general",
]);

const difficulties = new Set<Flashcard["difficulty"]>(["easy", "medium", "hard"]);

export function parseAiStarterContent(raw: string, idPrefix = Date.now().toString(36)): {
  learningPath: LearningPath;
  flashcards: Flashcard[];
} {
  const parsed = JSON.parse(extractJson(raw)) as RawStarterContent;
  const path = parsed.learning_path;
  if (!path || typeof path.title !== "string" || typeof path.description !== "string" || !Array.isArray(path.modules)) {
    throw new Error("AI response missing learning_path title, description, or modules.");
  }

  const modules = path.modules.map((module, index) => normalizeModule(module, `${idPrefix}_m${index}`));
  if (modules.length === 0) throw new Error("AI response did not include learning modules.");

  const rawCards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];
  const flashcards = rawCards.map((card, index) => normalizeFlashcard(card, `${idPrefix}_fc${index}`));
  if (flashcards.length === 0) throw new Error("AI response did not include flashcards.");

  return {
    learningPath: {
      id: `lp_ai_${idPrefix}`,
      title: path.title.trim(),
      description: path.description.trim(),
      category: "soft-skills",
      priority: "high",
      completedModules: [],
      modules,
    },
    flashcards,
  };
}

function extractJson(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function normalizeModule(raw: unknown, id: string): LearningModule {
  if (!isRecord(raw)) throw new Error("AI response included an invalid module.");
  const title = stringField(raw.title, "module title");
  const description = stringField(raw.description, "module description");
  const duration = typeof raw.duration === "string" && raw.duration.trim() ? raw.duration.trim() : "1hr";
  return { id, title, description, duration, resources: [] };
}

function normalizeFlashcard(raw: unknown, id: string): Flashcard {
  if (!isRecord(raw)) throw new Error("AI response included an invalid flashcard.");
  const question = stringField(raw.question, "flashcard question");
  const answer = stringField(raw.answer, "flashcard answer");
  const category = flashcardCategories.has(raw.category as Flashcard["category"])
    ? raw.category as Flashcard["category"]
    : "general";
  const difficulty = difficulties.has(raw.difficulty as Flashcard["difficulty"])
    ? raw.difficulty as Flashcard["difficulty"]
    : "medium";
  const deck = typeof raw.deck === "string" && raw.deck.trim() ? raw.deck.trim() : "AI Generated";
  return { id, question, answer, category, deck, difficulty, level: 1 };
}

function stringField(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`AI response missing ${label}.`);
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
