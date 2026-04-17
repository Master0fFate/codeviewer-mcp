import { describe, expect, it } from "vitest";
import { parseOptionalPositiveIntegerEnv } from "../src/config.js";

describe("parseOptionalPositiveIntegerEnv", () => {
  it("returns undefined for unset values", () => {
    expect(parseOptionalPositiveIntegerEnv(undefined, "MCP_SESSION_TTL_HOURS")).toBeUndefined();
  });

  it("returns undefined for blank values", () => {
    expect(parseOptionalPositiveIntegerEnv("   ", "MCP_SESSION_TTL_HOURS")).toBeUndefined();
  });

  it("parses a valid positive integer", () => {
    expect(parseOptionalPositiveIntegerEnv("24", "MCP_SESSION_TTL_HOURS")).toBe(24);
  });

  it("throws for non-numeric values", () => {
    expect(() => parseOptionalPositiveIntegerEnv("abc", "MCP_SESSION_TTL_HOURS")).toThrow(
      /MCP_SESSION_TTL_HOURS must be a positive integer/,
    );
  });

  it("throws for mixed numeric strings", () => {
    expect(() => parseOptionalPositiveIntegerEnv("24h", "MCP_SESSION_TTL_HOURS")).toThrow(
      /MCP_SESSION_TTL_HOURS must be a positive integer/,
    );
  });

  it("throws for zero and negative values", () => {
    expect(() => parseOptionalPositiveIntegerEnv("0", "MCP_SESSION_TTL_HOURS")).toThrow(
      /MCP_SESSION_TTL_HOURS must be a positive integer/,
    );
    expect(() => parseOptionalPositiveIntegerEnv("-5", "MCP_SESSION_TTL_HOURS")).toThrow(
      /MCP_SESSION_TTL_HOURS must be a positive integer/,
    );
  });
});
