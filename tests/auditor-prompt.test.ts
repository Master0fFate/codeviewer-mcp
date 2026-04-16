import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const promptPath = path.resolve(process.cwd(), "prompts/universal-auditor-general-v2.1.md");

describe("Universal Auditor prompt v2.1 remediation", () => {
  const prompt = readFileSync(promptPath, "utf8");

  it("removes conflicting omit-vs-na instructions", () => {
    expect(prompt).toContain("Include all sections 1–7 in order.");
    expect(prompt).toContain("N/A — <brief reason>");
    expect(prompt).not.toMatch(/Do not include any sections that are outlined in this prompt but are not relevant/i);
  });

  it("uses flexible recommendation count instead of rigid exact count", () => {
    expect(prompt).toContain("3–7 prioritized recommendations");
    expect(prompt).not.toMatch(/exactly\s*\*\*5 prioritized recommendations\*\*/i);
  });

  it("adds cross-domain specificity examples", () => {
    expect(prompt).toContain("Legal/Contract");
    expect(prompt).toContain("Creative Writing");
    expect(prompt).toContain("Physical Product/UX");
    expect(prompt).toContain("Education");
  });

  it("adds confidence calibration guidance", () => {
    expect(prompt).toContain("Confidence Calibration");
    expect(prompt).toContain("🟢 High");
    expect(prompt).toContain("🟡 Moderate");
    expect(prompt).toContain("🔴 Low");
  });

  it("requires comparative context section header with explicit escape hatch", () => {
    expect(prompt).toContain("## 5. COMPARATIVE CONTEXT");
    expect(prompt).toContain("Include this section header in every audit.");
    expect(prompt).toContain("Comparative context omitted — <specific reason>");
  });

  it("adds weighting and adaptive depth guidance", () => {
    expect(prompt).toContain("Adaptive depth guidance");
    expect(prompt).toContain("Small/simple subject: 3–4 dimensions");
    expect(prompt).toContain("Weighting method");
    expect(prompt).toContain("sum to 100%");
  });

  it("adds domain-spanning evidence and multimodal guidance", () => {
    expect(prompt).toContain("### Multi-Subject Handling");
    expect(prompt).toContain("### Evidence Sufficiency by Subject Type");
    expect(prompt).toContain("### Cultural Context Handling");
    expect(prompt).toContain("### Multimodal and Non-Text Subjects");
  });
});
