import type { Feedback, Patch, ReviewCodeChunkInput, ReviewCodeChunkOutput } from "./schemas.js";
import type { AstLocalizationResult } from "./ast.js";
import type { PreflightResult } from "./preflight.js";

export interface ReviewContext {
  stepDescription: string;
  preflight: PreflightResult;
  astContext: AstLocalizationResult;
}

function buildPatches(input: ReviewCodeChunkInput, preflight: PreflightResult): Patch[] {
  const patches: Patch[] = [];

  for (const issue of preflight.issues) {
    if (issue.category !== "security" || !issue.evidence) {
      continue;
    }

    patches.push({
      file_path: input.target_file,
      reason: issue.message,
      search: issue.evidence,
      replace: "/* replace with safe validated implementation */",
    });
  }

  return patches;
}

function toFeedback(preflight: PreflightResult): Feedback[] {
  return preflight.issues.map((issue) => ({
    severity: issue.severity,
    category: issue.category,
    message: issue.message,
    evidence: issue.evidence,
  }));
}

export function reviewCodeChunk(input: ReviewCodeChunkInput, ctx: ReviewContext): ReviewCodeChunkOutput {
  const feedback = toFeedback(ctx.preflight);
  const patches = buildPatches(input, ctx.preflight);

  const skillHints: Feedback[] = (input.active_skills ?? []).map((skill) => ({
      severity: "info" as const,
      category: "skill",
      message: `Applied skill profile: ${skill}`,
    }));

  if (ctx.astContext.nodeReference == null) {
    skillHints.push({
      severity: "low",
      category: "ast",
      message: "No exact AST node match was found; review used file-level fallback context.",
    });
  }

  if (ctx.preflight.hasBlockingIssues) {
    return {
      verdict: "NEEDS_WORK",
      critical_issues: feedback.filter((item) => item.severity === "critical").length,
      feedback: [...feedback, ...skillHints],
      patches,
      plan_step_status: "IN_PROGRESS",
    };
  }

  return {
    verdict: "PASS",
    critical_issues: 0,
    feedback: [
      ...feedback,
      ...skillHints,
      {
        severity: "info",
        category: "plan",
        message: `Chunk aligns with plan step intent: ${ctx.stepDescription}`,
      },
    ],
    patches,
    plan_step_status: "VALIDATED",
  };
}
