import { describe, it, expect, beforeEach } from "vitest";
import {
  getApplications, addApplication, deleteApplication, updateApplication,
  getSkills, updateSkill, addSkill,
  getFlashcards, getFlashcardDecks, getFlashcardsByDeck, updateFlashcardLevel, getDueFlashcards,
  getLearningPaths, toggleModuleComplete, getLearningPathProgress,
  getResources, getResourcesByCategory,
  getDashboardStats,
  exportData, importData, resetData,
} from "../store";
import type { Application } from "../types";

beforeEach(() => {
  localStorage.clear();
  resetData();
});

// ─── Applications ───

describe("Applications Store", () => {
  it("starts empty", () => {
    expect(getApplications()).toHaveLength(0);
  });

  it("adds and retrieves", () => {
    addApplication(mockApp("a1", "Co", "Sr Dev"));
    expect(getApplications()).toHaveLength(1);
    expect(getApplications()[0].company).toBe("Co");
  });

  it("updates status + updatedAt", () => {
    const app = mockApp("a1", "Co", "Dev");
    app.updatedAt = "2024-01-01T00:00:00Z";
    addApplication(app);
    updateApplication("a1", { status: "offer" });
    expect(getApplications()[0].status).toBe("offer");
    expect(getApplications()[0].updatedAt).not.toBe("2024-01-01T00:00:00Z");
  });

  it("deletes by id", () => {
    addApplication(mockApp("a1", "Co", "Dev"));
    addApplication(mockApp("a2", "Co2", "Dev"));
    deleteApplication("a1");
    expect(getApplications()).toHaveLength(1);
    expect(getApplications()[0].id).toBe("a2");
  });

  it("sorts by updatedAt desc", () => {
    const old = mockApp("old", "Old", "Dev");
    old.updatedAt = "2024-01-01T00:00:00Z";
    old.createdAt = "2024-01-01T00:00:00Z";
    const recent = mockApp("new", "New", "Dev");
    recent.updatedAt = "2024-06-01T00:00:00Z";
    recent.createdAt = "2024-06-01T00:00:00Z";
    addApplication(old);
    addApplication(recent);
    expect(getApplications()[0].id).toBe("new");
  });

  it("handles delete of non-existent id", () => {
    addApplication(mockApp("a1", "Co", "Dev"));
    deleteApplication("nonexistent");
    expect(getApplications()).toHaveLength(1);
  });
});

// ─── Skills ───

describe("Skills Store", () => {
  it("starts with pre-seeded skills", () => {
    const skills = getSkills();
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.some(s => s.name.includes("React"))).toBe(true);
  });

  it("updates skill level", () => {
    const skills = getSkills();
    const s = skills[0];
    updateSkill(s.id, { level: 5, notes: "Updated notes" });
    const updated = getSkills().find(x => x.id === s.id)!;
    expect(updated.level).toBe(5);
    expect(updated.notes).toBe("Updated notes");
  });

  it("adds a new skill", () => {
    addSkill({
      id: "custom", name: "Rust", category: "backend", level: 2, targetLevel: 3,
      priority: "medium", notes: "Learning", resources: [],
    });
    expect(getSkills().some(s => s.name === "Rust")).toBe(true);
  });
});

// ─── Flashcards ───

describe("Flashcards Store", () => {
  it("starts with pre-seeded cards", () => {
    expect(getFlashcards().length).toBeGreaterThan(0);
  });

  it("lists unique decks", () => {
    const decks = getFlashcardDecks();
    expect(decks).toContain("System Design");
    expect(decks).toContain("Behavioral");
  });

  it("filters by deck", () => {
    const cards = getFlashcardsByDeck("Behavioral");
    expect(cards.every(c => c.deck === "Behavioral")).toBe(true);
  });

  it("returns due cards (level < 5)", () => {
    const due = getDueFlashcards();
    expect(due.every(c => c.level < 5)).toBe(true);
  });

  it("updates flashcard level (clamped 1-5)", () => {
    const c = getFlashcards()[0];
    updateFlashcardLevel(c.id, 5);
    expect(getFlashcards().find(x => x.id === c.id)!.level).toBe(5);
    updateFlashcardLevel(c.id, 99);
    expect(getFlashcards().find(x => x.id === c.id)!.level).toBe(5);
    updateFlashcardLevel(c.id, 0);
    expect(getFlashcards().find(x => x.id === c.id)!.level).toBe(1);
  });

  it("returns all decks with getFlashcardDecks", () => {
    const decks = getFlashcardDecks();
    expect(decks.length).toBeGreaterThanOrEqual(5);
    expect(decks).toContain("System Design");
    expect(decks).toContain("MCP & Agents");
  });
});

// ─── Learning Paths ───

describe("Learning Paths Store", () => {
  it("starts with pre-seeded paths", () => {
    expect(getLearningPaths().length).toBeGreaterThan(0);
  });

  it("toggles module completion on/off", () => {
    const path = getLearningPaths()[0];
    const modId = path.modules[0].id;

    toggleModuleComplete(path.id, modId);
    expect(getLearningPathProgress(path.id).completed).toBe(1);

    toggleModuleComplete(path.id, modId);
    expect(getLearningPathProgress(path.id).completed).toBe(0);
  });

  it("reports correct progress", () => {
    const path = getLearningPaths()[0];
    path.modules.forEach(m => toggleModuleComplete(path.id, m.id));
    const prog = getLearningPathProgress(path.id);
    expect(prog.completed).toBe(prog.total);
    expect(prog.percent).toBe(100);
  });

  it("returns 0 progress for unknown path", () => {
    const prog = getLearningPathProgress("nonexistent");
    expect(prog.completed).toBe(0);
    expect(prog.total).toBe(0);
    expect(prog.percent).toBe(0);
  });
});

// ─── Resources ───

describe("Resources Store", () => {
  it("starts with pre-seeded resources", () => {
    expect(getResources().length).toBeGreaterThan(0);
  });

  it("filters by category", () => {
    const ai = getResourcesByCategory("ai-ml");
    expect(ai.every(r => r.category === "ai-ml")).toBe(true);
  });

  it("'all' returns everything", () => {
    const all = getResourcesByCategory("all");
    expect(all.length).toBe(getResources().length);
  });
});

// ─── Dashboard Stats ───

describe("Dashboard Stats", () => {
  it("starts with zero applications", () => {
    const stats = getDashboardStats();
    expect(stats.totalApplications).toBe(0);
  });

  it("counts active applications correctly", () => {
    addApplication(mockApp("a1", "Co1", "Dev", "applied"));
    addApplication(mockApp("a2", "Co2", "Dev", "phone-screen"));
    addApplication(mockApp("a3", "Co3", "Dev", "rejected"));
    const stats = getDashboardStats();
    expect(stats.totalApplications).toBe(3);
    expect(stats.activeApplications).toBe(2);
    expect(stats.rejected).toBe(1);
  });

  it("tracks study progress", () => {
    const stats = getDashboardStats();
    expect(stats.studyModules).toBeGreaterThan(0);
    expect(stats.flashcardsDue).toBeGreaterThan(0);
  });
});

// ─── Export / Import ───

describe("Export / Import", () => {
  it("exports valid JSON", () => {
    addApplication(mockApp("a1", "Co", "Dev"));
    const json = exportData();
    const parsed = JSON.parse(json);
    expect(parsed.applications).toHaveLength(1);
    expect(parsed.skills).toBeDefined();
  });

  it("imports data successfully", () => {
    const json = exportData();
    const parsed = JSON.parse(json);
    parsed.applications.push({ ...mockApp("imp", "Imported", "Dev"), status: "offer" });
    const result = importData(JSON.stringify(parsed));
    expect(result).toBe(true);
    expect(getApplications().some(a => a.id === "imp")).toBe(true);
  });

  it("rejects invalid JSON", () => {
    expect(importData("not json")).toBe(false);
    expect(importData('{"bad": true}')).toBe(false);
  });

  it("resetData clears everything", () => {
    addApplication(mockApp("a1", "Co", "Dev"));
    resetData();
    expect(getApplications()).toHaveLength(0);
  });
});

// ─── Helper ───

function mockApp(id: string, company: string, role: string, status: Application["status"] = "saved"): Application {
  return {
    id, company, role, status,
    url: "", dateApplied: new Date().toISOString(),
    contacts: [], notes: "", timeline: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Application;
}
