import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { PromptRegistry } from "../src/prompts.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("PromptRegistry", () => {
  it("lists markdown prompt profiles and reads metadata", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "prompt-registry-"));
    tempDirs.push(tempDir);
    const promptsDir = path.join(tempDir, "prompts");
    mkdirSync(promptsDir, { recursive: true });

    writeFileSync(
      path.join(promptsDir, "cybersec.md"),
      "# Cybersecurity Reviewer\n\n## Threat Modeling\n## Secret Handling\n",
      "utf8",
    );

    const registry = new PromptRegistry(promptsDir);
    const profiles = registry.listProfiles();

    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.id).toBe("cybersec");
    expect(profiles[0]?.title).toBe("Cybersecurity Reviewer");
    expect(profiles[0]?.headings).toContain("Threat Modeling");
  });

  it("resolves requested profile or falls back to preferred default", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "prompt-registry-"));
    tempDirs.push(tempDir);
    const promptsDir = path.join(tempDir, "prompts");
    mkdirSync(promptsDir, { recursive: true });

    writeFileSync(path.join(promptsDir, "general.md"), "# General\n", "utf8");
    writeFileSync(path.join(promptsDir, "cybersec.md"), "# Cyber\n", "utf8");

    const registry = new PromptRegistry(promptsDir);

    expect(registry.resolveProfileId("cybersec")).toBe("cybersec");
    expect(registry.resolveProfileId(undefined, "general")).toBe("general");
    expect(registry.resolveProfileId("missing")).toBeUndefined();
  });
});
