import { describe, it, expect, beforeEach } from "vitest";
import {
  getApplications, addApplication, deleteApplication, updateApplication,
  getSkills, updateSkill, addSkill,
  getFlashcards, getFlashcardDecks, getFlashcardsByDeck, updateFlashcardLevel, getDueFlashcards,
  getLearningPaths, toggleModuleComplete, getLearningPathProgress,
  getResources, getResourcesByCategory,
  getDashboardStats,
  exportData, importData, resetData,
  getProfile, updateProfile, getTheme, setTheme,
  getContacts, addContact, deleteContact,
  getOffers, addOffer, calculateOfferScore,
  getJournal, addJournal,
  needsBackup, recordBackup,
  getStories, addStory, updateStory, deleteStory,
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
    expect(skills.some(s => s.name.includes("Interview storytelling"))).toBe(true);
    expect(skills.some(s => s.name.includes("Resume targeting"))).toBe(true);
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

  it("surfaces readiness and next best actions", () => {
    const stats = getDashboardStats();
    expect(stats.readinessScore).toBeGreaterThanOrEqual(0);
    expect(stats.readinessScore).toBeLessThanOrEqual(100);
    expect(stats.nextActions.length).toBeGreaterThan(0);
    expect(stats.nextActions[0].href).toBeTruthy();
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

// ─── Profile & Theme ───

describe("Profile & Theme", () => {
  it("returns default profile", () => {
    const p = getProfile();
    expect(p.name).toBe("");
    expect(p.email).toBe("");
    expect(p.title).not.toMatch(/Software Engineer/i);
  });

  it("updates profile fields", () => {
    updateProfile({ name: "Test User", targetRate: 200 });
    expect(getProfile().name).toBe("Test User");
    expect(getProfile().targetRate).toBe(200);
  });

  it("saves and retrieves theme", () => {
    setTheme("dark");
    expect(getTheme()).toBe("dark");
  });
});

// ─── Contacts ───

describe("Contacts Store", () => {
  it("adds and retrieves contacts", () => {
    addContact({ id: "c1", name: "Alice", role: "Recruiter", status: "warm", lastContacted: new Date().toISOString() });
    expect(getContacts()).toHaveLength(1);
  });

  it("deletes contacts", () => {
    addContact({ id: "c1", name: "Alice", role: "Recruiter", status: "warm", lastContacted: new Date().toISOString() });
    deleteContact("c1");
    expect(getContacts()).toHaveLength(0);
  });
});

// ─── Offers ───

describe("Offers Store", () => {
  it("calculates offer score", () => {
    const score = calculateOfferScore({
      id: "o1", company: "Co", role: "Dev", baseSalary: 160000, bonus: 20000, equity: 10000, remote: "fully-remote", pto: 20, score: 0,
    });
    expect(score).toBeGreaterThan(0);
  });

  it("adds and retrieves offers", () => {
    addOffer({ id: "o1", company: "Co", role: "Dev", baseSalary: 100000, bonus: 0, equity: 0, remote: "hybrid", pto: 15, score: 0 });
    expect(getOffers()).toHaveLength(1);
  });
});

// ─── Journal ───

describe("Journal Store", () => {
  it("adds and retrieves entries", () => {
    addJournal({ id: "j1", date: new Date().toISOString().split("T")[0], content: "Applied to 3 roles", tags: ["application"] });
    expect(getJournal()).toHaveLength(1);
  });
});

// ─── Backup ───

describe("Backup", () => {
  it("reports backup needed initially", () => {
    expect(needsBackup()).toBe(true);
  });

  it("records backup", () => {
    recordBackup();
    expect(needsBackup()).toBe(false);
  });
});

// ─── Helper ───

function mockApp(id: string, company: string, role: string, status: Application["status"] = "saved"): Application {
  return {
    id, company, role, status,
    url: "", dateApplied: new Date().toISOString(),
    contacts: [], documents: [], notes: "", timeline: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Validation ───

describe("Input Validation", () => {
  it("rejects application without company", () => {
    expect(() => addApplication(mockApp("x", "", "Dev"))).toThrow(/company/i);
  });

  it("rejects application without role", () => {
    expect(() => addApplication(mockApp("x", "Co", ""))).toThrow(/role/i);
  });

  it("rejects whitespace-only fields", () => {
    expect(() => addApplication(mockApp("x", "   ", "Dev"))).toThrow(/company/i);
  });

  it("auto-generates ID when missing", () => {
    const app = { ...mockApp("", "Co", "Dev") } as Application;
    app.id = "";
    const added = addApplication(app);
    expect(added.id).toMatch(/^app_/);
  });

  it("rejects non-empty JSON for import", () => {
    expect(importData("")).toBe(false);
    expect(importData("  ")).toBe(false);
  });

  it("rejects JSON without required fields", () => {
    expect(importData('{"foo": 1}')).toBe(false);
    expect(importData('{"applications": [], "skills": []}')).toBe(true);
  });
});

// ─── CRUD return types ───

describe("CRUD return types", () => {
  it("updateApplication returns false for unknown id", () => {
    expect(updateApplication("nonexistent", { status: "offer" })).toBe(false);
  });

  it("updateApplication returns true on success", () => {
    addApplication(mockApp("a1", "Co", "Dev"));
    expect(updateApplication("a1", { status: "offer" })).toBe(true);
  });

  it("deleteApplication returns false for unknown id", () => {
    expect(deleteApplication("nonexistent")).toBe(false);
  });

  it("deleteApplication returns true on success", () => {
    addApplication(mockApp("a1", "Co", "Dev"));
    expect(deleteApplication("a1")).toBe(true);
  });

  it("updateFlashcardLevel returns false for unknown id", () => {
    expect(updateFlashcardLevel("nonexistent", 3)).toBe(false);
  });

  it("updateFlashcardLevel returns true on success", () => {
    const c = getFlashcards()[0];
    expect(updateFlashcardLevel(c.id, 4)).toBe(true);
  });
});

// ─── Data integrity ───

describe("Data integrity", () => {
  it("getApplications returns new array (no mutation)", () => {
    addApplication(mockApp("a1", "Co", "Dev"));
    const apps1 = getApplications();
    const apps2 = getApplications();
    expect(apps1).not.toBe(apps2);
    expect(apps1).toEqual(apps2);
  });

  it("getContacts returns new array (no mutation)", () => {
    addContact({ id: "c1", name: "Alice", role: "r", company: "c", email: "", linkedin: "", phone: "", notes: "", status: "cold", lastContacted: new Date().toISOString() });
    const c1 = getContacts();
    const c2 = getContacts();
    expect(c1).not.toBe(c2);
    expect(c1).toEqual(c2);
  });

  it("getFlashcardDecks is sorted and unique", () => {
    const decks = getFlashcardDecks();
    const sorted = [...decks].sort();
    expect(decks).toEqual(sorted);
    expect(new Set(decks).size).toBe(decks.length);
  });
});

// ─── Story Bank ───

describe("Story Bank Store", () => {
  it("starts empty", () => {
    expect(getStories()).toHaveLength(0);
  });

  it("adds, updates, sorts, and deletes stories", () => {
    addStory({
      id: "story-old",
      title: "Old launch",
      situation: "Legacy launch risk",
      task: "Improve readiness",
      action: "Built plan",
      result: "Reduced risk",
      reflection: "Plan earlier",
      metrics: [],
      tags: ["launch"],
      targetRoles: ["PM"],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });
    addStory({
      id: "story-new",
      title: "New retention win",
      situation: "Churn was rising",
      task: "Find cause",
      action: "Analyzed cohorts",
      result: "Reduced churn 12%",
      reflection: "Segment early",
      metrics: ["12% churn reduction"],
      tags: ["analytics"],
      targetRoles: ["Product"],
      createdAt: "2024-02-01T00:00:00Z",
      updatedAt: "2024-02-01T00:00:00Z",
    });

    expect(getStories()[0].id).toBe("story-new");
    expect(updateStory("story-old", { title: "Updated launch" })).toBe(true);
    expect(getStories().find((story) => story.id === "story-old")?.title).toBe("Updated launch");
    expect(deleteStory("story-new")).toBe(true);
    expect(deleteStory("missing")).toBe(false);
    expect(getStories()).toHaveLength(1);
  });

  it("rejects stories without titles", () => {
    expect(() => addStory({
      id: "bad-story",
      title: " ",
      situation: "",
      task: "",
      action: "",
      result: "",
      reflection: "",
      metrics: [],
      tags: [],
      targetRoles: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    })).toThrow(/title/i);
  });
});
