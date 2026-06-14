import { describe, it, expect } from "vitest";
import { extractCompany, extractRole, extractURL, extractFromJD } from "../utils/extract";

describe("extractCompany (Big Mick v1.3.2 smart extractor)", () => {
  it("extracts 'Stripe Inc' from a clean 'at Stripe Inc'", () => {
    expect(extractCompany("Position: Senior Engineer\nat Stripe Inc\nLooking for someone with React."))
      .toBe("Stripe Inc");
  });

  it("extracts 'Anthropic Inc' (the original test case)", () => {
    const jd = "Position: AI Engineer at Anthropic Inc\nWe are looking for someone with TypeScript, Python.";
    expect(extractCompany(jd)).toBe("Anthropic Inc");
  });

  it("does NOT grab 'TestCo. We need 5' — should prefer 'Acme Corp'", () => {
    const jd = "We partner with TestCo. We need 5 engineers to join us at Acme Corp on the React platform.";
    const out = extractCompany(jd);
    expect(out).toBe("Acme Corp");
    expect(out).not.toMatch(/TestCo/);
  });

  it("strips trailing period from 'Wealthsimple, Inc.'", () => {
    const jd = "Role: Staff Engineer at Wealthsimple, Inc. — fintech experience preferred.";
    expect(extractCompany(jd)).toBe("Wealthsimple, Inc");
  });

  it("skips a short 'at Loop' (no suffix, no double cap) and picks 'Bench Sciences Inc'", () => {
    const jd = "Looking for a Senior Engineer at Loop. The role is at Bench Sciences Inc, a biotech startup.";
    const out = extractCompany(jd);
    expect(out).toBe("Bench Sciences Inc");
  });

  it("handles ampersand companies ('Procter & Gamble')", () => {
    const jd = "We are hiring at Procter & Gamble for a Senior Brand Manager.";
    expect(extractCompany(jd)).toBe("Procter & Gamble");
  });

  it("handles hyphenated names ('Aero-Vista')", () => {
    const jd = "Join us at Aero-Vista as a Staff Engineer building avionics software.";
    const out = extractCompany(jd);
    expect(out).toMatch(/Aero-Vista/);
  });

  it("returns empty string for garbage input", () => {
    expect(extractCompany("")).toBe("");
    expect(extractCompany("hi")).toBe("");
  });

  it("rejects senior-prefix false positives (does not return 'Senior Engineer')", () => {
    const jd = "Looking for a Senior Engineer at Wealthsimple to build trading systems.";
    const out = extractCompany(jd);
    // Must not start with "Senior" or "Senior Engineer"
    expect(out).not.toMatch(/^Senior/);
  });
});

describe("extractRole", () => {
  it("extracts 'AI Engineer' from 'Position: AI Engineer'", () => {
    expect(extractRole("Position: AI Engineer at Anthropic Inc")).toBe("AI Engineer");
  });

  it("extracts from 'Role:' label", () => {
    expect(extractRole("Role: Senior Backend Engineer")).toBe("Senior Backend Engineer");
  });

  it("strips trailing punctuation", () => {
    expect(extractRole("Title: Staff Engineer.")).toBe("Staff Engineer");
  });

  it("falls back to 'hiring a <X>' pattern", () => {
    expect(extractRole("We are hiring a Senior Full-Stack Engineer to lead our team"))
      .toMatch(/Senior Full-Stack Engineer/);
  });

  it("returns empty for nothing", () => {
    expect(extractRole("")).toBe("");
    expect(extractRole("random prose with no labels")).toBe("");
  });
});

describe("extractURL", () => {
  it("finds the first https URL", () => {
    expect(extractURL("Apply at https://anthropic.com/jobs/123 today"))
      .toBe("https://anthropic.com/jobs/123");
  });

  it("strips trailing punctuation", () => {
    expect(extractURL("See https://example.com/jobs/456."))
      .toBe("https://example.com/jobs/456");
  });

  it("returns empty for no URL", () => {
    expect(extractURL("no urls here")).toBe("");
  });
});

describe("extractFromJD (combined)", () => {
  it("extracts all three fields from a realistic JD", () => {
    const jd = "Position: AI Engineer at Anthropic Inc\nWe are looking for someone with TypeScript, Python. Apply at https://anthropic.com/jobs/123";
    const out = extractFromJD(jd);
    expect(out.company).toBe("Anthropic Inc");
    expect(out.role).toBe("AI Engineer");
    expect(out.url).toBe("https://anthropic.com/jobs/123");
  });
});
