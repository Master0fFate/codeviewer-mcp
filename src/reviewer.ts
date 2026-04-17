import type { Feedback, Patch, ReviewCodeChunkInput, ReviewCodeChunkOutput } from "./schemas.js";
import type { AstLocalizationResult } from "./ast.js";
import type { PreflightResult } from "./preflight.js";
import type { PromptProfile } from "./prompts.js";

export interface ReviewContext {
  stepDescription: string;
  preflight: PreflightResult;
  astContext: AstLocalizationResult;
  promptProfile?: Pick<PromptProfile, "id" | "title" | "headings">;
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

  if (ctx.promptProfile) {
    skillHints.push({
      severity: "info",
      category: "prompt_profile",
      message: `Active prompt profile: ${ctx.promptProfile.id} (${ctx.promptProfile.title})`,
    });

    if (ctx.promptProfile.headings.length > 0) {
      skillHints.push({
        severity: "info",
        category: "prompt_profile",
        message: `Prompt focus sections: ${ctx.promptProfile.headings.join(", ")}`,
      });
    }
  }

  if (ctx.preflight.hasBlockingIssues) {
    return {
      verdict: "NEEDS_WORK",
      critical_issues: feedback.filter((item) => item.severity === "critical").length,
      feedback: [...feedback, ...skillHints],
      patches,
      plan_step_status: "IN_PROGRESS",
      active_prompt_profile: ctx.promptProfile?.id,
      active_prompt_title: ctx.promptProfile?.title,
      active_prompt_headings: ctx.promptProfile?.headings,
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
    active_prompt_profile: ctx.promptProfile?.id,
    active_prompt_title: ctx.promptProfile?.title,
    active_prompt_headings: ctx.promptProfile?.headings,
  };
}
