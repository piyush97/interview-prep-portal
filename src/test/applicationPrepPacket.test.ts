import { describe, expect, it } from "vitest";
import type { Application } from "../types";
import { analyzeResumeMatch } from "../utils/resumeMatch";
import { buildCompanyResearchSeed, buildPrepPacket, nextFollowUpDate, prepChecklist } from "../utils/applicationPrepPacket";

const app: Application = {
  id: "app-1",
  company: "Northstar Health",
  role: "Clinic Operations Manager",
  url: "https://example.com/job",
  jdText: "Lead patient communication, stakeholder coordination, license compliance, panel interviews, and metrics.",
  status: "phone-screen",
  dateApplied: "2026-06-16T00:00:00.000Z",
  salaryRange: "$90k-$110k",
  location: "Toronto",
  remote: false,
  contacts: [{ name: "Avery", role: "Recruiter", email: "avery@example.com", notes: "Asked for availability." }],
  documents: [],
  notes: "Panel interview likely. Prepare patient service examples.",
  timeline: [],
  createdAt: "2026-06-16T00:00:00.000Z",
  updatedAt: "2026-06-16T00:00:00.000Z",
};

describe("application prep packet", () => {
  it("turns application state into readiness checklist items", () => {
    const checklist = prepChecklist(app);

    expect(checklist.find((item) => item.label === "JD captured")?.done).toBe(true);
    expect(checklist.find((item) => item.label === "Contact path")?.detail).toContain("1 contact");
    expect(checklist.find((item) => item.label === "Resume or cover letter attached")?.done).toBe(false);
  });

  it("includes resume match evidence in exported packet markdown", () => {
    const resumeMatch = analyzeResumeMatch(app.jdText || "", "Patient communication lead with stakeholder coordination and compliance metrics.");
    const packet = buildPrepPacket(app, { resumeTitle: "Healthcare ops resume", resumeMatch });

    expect(packet).toContain("## Resume Match");
    expect(packet).toContain("- Resume: Healthcare ops resume");
    expect(packet).toContain("JD keyword coverage");
    expect(packet).toContain("patient");
    expect(packet).toContain("## Follow-Up Plan");
  });

  it("builds research seed text from interview signals without storing secrets", () => {
    const research = buildCompanyResearchSeed(app);

    expect(research).toContain("Northstar Health - Clinic Operations Manager");
    expect(research).toContain("panel");
    expect(research).not.toContain("API_KEY");
  });

  it("skips weekends when proposing follow-up date", () => {
    expect(nextFollowUpDate(new Date("2026-06-18T12:00:00.000Z"))).toBe("2026-06-22");
  });
});
