import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AstContextEngine } from "../src/ast.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("AstContextEngine", () => {
  it("localizes target node context", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "ast-engine-"));
    tempDirs.push(tempDir);

    const srcDir = path.join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });

    const filePath = path.join(srcDir, "demo.ts");
    writeFileSync(
      filePath,
      `import { x } from "./x";\nexport function targetFn(name: string) {\n  return name.toUpperCase();\n}\n`,
      "utf8",
    );

    const engine = new AstContextEngine(tempDir);
    const context = engine.localizeContext({
      targetFile: "src/demo.ts",
      targetNode: "targetFn",
      codeChunk: "function targetFn() {}",
    });

    expect(context.nodeReference).toBe("targetFn");
    expect(context.parentScope).toContain("targetFn");
    expect(context.imports).toContain("./x");
  });

  it("rejects target files that escape project root", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "ast-engine-"));
    tempDirs.push(tempDir);

    const engine = new AstContextEngine(tempDir);
    expect(() =>
      engine.localizeContext({
        targetFile: "../outside.ts",
        codeChunk: "export const x = 1;",
      }),
    ).toThrow(/within project root/);

    const externalFile = path.join(os.tmpdir(), "outside.ts");
    expect(() =>
      engine.localizeContext({
        targetFile: externalFile,
        codeChunk: "export const x = 1;",
      }),
    ).toThrow(/within project root/);
  });

  const symlinkTest = process.platform === "win32" ? it.skip : it;
  symlinkTest("rejects symlink paths that resolve outside project root", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "ast-engine-"));
    tempDirs.push(tempDir);

    const outsideDir = mkdtempSync(path.join(os.tmpdir(), "ast-engine-outside-"));
    tempDirs.push(outsideDir);
    writeFileSync(path.join(outsideDir, "outside.ts"), "export const outside = true;", "utf8");

    const linkPath = path.join(tempDir, "linked-outside");
    symlinkSync(outsideDir, linkPath, "dir");

    const engine = new AstContextEngine(tempDir);
    expect(() =>
      engine.localizeContext({
        targetFile: "linked-outside/outside.ts",
        codeChunk: "export const outside = true;",
      }),
    ).toThrow(/within project root/);
  });
});
