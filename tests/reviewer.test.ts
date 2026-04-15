import { describe, expect, it } from "vitest";
import { runPreflightChecks } from "../src/preflight.js";
import { reviewCodeChunk } from "../src/reviewer.js";

describe("reviewCodeChunk", () => {
  it("returns NEEDS_WORK when critical security issues are detected", () => {
    const preflight = runPreflightChecks("const apiKey = 'secret123'; eval('1+1');");
    const result = reviewCodeChunk(
      {
        session_id: "83f6a4f8-5f4d-4df7-95d0-a250e2ee9911",
        plan_step: 1,
        target_file: "src/file.ts",
        code_chunk: "const apiKey = 'secret123'; eval('1+1');",
        modification_type: "MODIFY",
      },
      {
        stepDescription: "Add secure config loading",
        preflight,
        astContext: {
          filePath: "src/file.ts",
          imports: [],
          parentScope: "",
          nodeReference: null,
        },
      },
    );

    expect(result.verdict).toBe("NEEDS_WORK");
    expect(result.critical_issues).toBeGreaterThan(0);
    expect(result.patches.length).toBeGreaterThan(0);
  });
});
