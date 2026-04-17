import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, afterEach } from "vitest";
import { StateStore } from "../src/state.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("StateStore", () => {
  it("creates sessions and retrieves plan step", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "state-store-"));
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "state.sqlite");

    const store = new StateStore(dbPath);
    const sessionId = store.createSession("/project", ["step 1", "step 2"]);

    const session = store.getSession(sessionId);
    const step2 = store.getPlanStep(sessionId, 2);

    expect(session?.id).toBe(sessionId);
    expect(step2?.description).toBe("step 2");

    store.close();
  });

  it("persists prompt profile on session records", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "state-store-"));
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "state.sqlite");

    const store = new StateStore(dbPath);
    const sessionId = store.createSession("/project", ["step 1"], "cybersec");
    const session = store.getSession(sessionId);

    expect(session?.prompt_profile).toBe("cybersec");

    store.close();
  });
});
