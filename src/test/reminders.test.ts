import { describe, it, expect, beforeEach } from "vitest";
import {
  getReminders, addReminder, updateReminder, deleteReminder,
  addApplicationDocument, updateApplicationDocument, deleteApplicationDocument,
  addApplication, getApplications, resetData,
} from "../store";
import type { Reminder, Application, ApplicationDocument } from "../types";

const mockApp = (id: string): Application => ({
  id, company: "Acme", role: "SWE", url: "", status: "saved",
  dateApplied: new Date().toISOString(), contacts: [], documents: [],
  notes: "", timeline: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as Application);

const mockDoc = (id: string): ApplicationDocument => ({
  id, type: "cv", title: "v1", content: "x", createdAt: new Date().toISOString(),
});

describe("Reminders", () => {
  beforeEach(() => {
    localStorage.clear();
    resetData();
  });

  it("adds a reminder with required fields", () => {
    const r = addReminder({
      title: "Follow up Anthropic",
      date: new Date().toISOString(),
      type: "follow-up",
      status: "pending",
    } as Reminder);
    expect(r.id).toBeDefined();
    expect(getReminders()).toHaveLength(1);
  });

  it("rejects reminder without title", () => {
    expect(() => addReminder({ title: "", date: new Date().toISOString(), type: "follow-up", status: "pending" } as Reminder)).toThrow();
  });

  it("rejects reminder without date", () => {
    expect(() => addReminder({ title: "X", date: "", type: "follow-up", status: "pending" } as Reminder)).toThrow();
  });

  it("updates reminder status", () => {
    const r = addReminder({ title: "X", date: new Date().toISOString(), type: "follow-up", status: "pending" } as Reminder);
    expect(updateReminder(r.id, { status: "done" })).toBe(true);
    expect(getReminders().find((x) => x.id === r.id)?.status).toBe("done");
  });

  it("returns false when updating non-existent reminder", () => {
    expect(updateReminder("nope", { status: "done" })).toBe(false);
  });

  it("deletes reminder", () => {
    const r = addReminder({ title: "X", date: new Date().toISOString(), type: "follow-up", status: "pending" } as Reminder);
    expect(deleteReminder(r.id)).toBe(true);
    expect(getReminders()).toHaveLength(0);
  });

  it("sorts reminders by date ascending", () => {
    const later = new Date("2030-01-01").toISOString();
    const sooner = new Date("2020-01-01").toISOString();
    addReminder({ title: "Later", date: later, type: "follow-up", status: "pending" } as Reminder);
    addReminder({ title: "Sooner", date: sooner, type: "follow-up", status: "pending" } as Reminder);
    const list = getReminders();
    expect(list[0].title).toBe("Sooner");
    expect(list[1].title).toBe("Later");
  });
});

describe("Application Documents", () => {
  beforeEach(() => {
    localStorage.clear();
    resetData();
  });

  it("adds a document to an application", () => {
    const app = addApplication(mockApp("a1"));
    const doc = addApplicationDocument(app.id, mockDoc("d1"));
    expect(doc).not.toBeNull();
    expect(doc?.id).toBeDefined();
  });

  it("returns null when application not found", () => {
    const doc = addApplicationDocument("nope", mockDoc("d1"));
    expect(doc).toBeNull();
  });

  it("updates a document", () => {
    const app = addApplication(mockApp("a1"));
    const doc = addApplicationDocument(app.id, mockDoc("d1"));
    expect(updateApplicationDocument(app.id, doc!.id, { title: "v2" })).toBe(true);
  });

  it("deletes a document", () => {
    const app = addApplication(mockApp("a1"));
    const doc = addApplicationDocument(app.id, mockDoc("d1"));
    expect(deleteApplicationDocument(app.id, doc!.id)).toBe(true);
  });

  it("backfills documents array on legacy applications", () => {
    const legacy = { ...mockApp("legacy") };
    delete (legacy as any).documents;
    addApplication(legacy);
    const apps = getApplications();
    expect(apps[0].documents).toEqual([]);
    expect(apps[0].contacts).toEqual([]);
  });
});
