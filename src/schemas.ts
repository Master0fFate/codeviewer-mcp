import { z } from "zod";

export const modificationTypes = ["INSERT", "MODIFY", "DELETE", "REPLACE"] as const;
export const verdictTypes = ["PASS", "NEEDS_WORK"] as const;
export const severityTypes = ["critical", "high", "medium", "low", "info"] as const;

export const registerPlanInputSchema = z.object({
  project_path: z.string().min(1).optional(),
  steps: z.array(z.string().min(1)).min(1),
  prompt_profile: z.string().min(1).optional(),
});

export const registerPlanOutputSchema = z.object({
  session_id: z.uuid(),
  steps_registered: z.number().int().positive(),
  status: z.literal("ACTIVE"),
  prompt_profile: z.string().min(1).optional(),
});

export const reviewCodeChunkInputSchema = z.object({
  session_id: z.uuid(),
  plan_step: z.number().int().positive(),
  target_file: z.string().min(1),
  code_chunk: z.string().min(1),
  modification_type: z.enum(modificationTypes),
  target_node: z.string().min(1).optional(),
  active_skills: z.array(z.string().min(1)).optional(),
});

export const feedbackSchema = z.object({
  severity: z.enum(severityTypes),
  category: z.string().min(1),
  message: z.string().min(1),
  evidence: z.string().optional(),
});

export const patchSchema = z.object({
  file_path: z.string().min(1),
  reason: z.string().min(1),
  search: z.string().min(1),
  replace: z.string(),
});

export const reviewCodeChunkOutputSchema = z.object({
  verdict: z.enum(verdictTypes),
  critical_issues: z.number().int().nonnegative(),
  feedback: z.array(feedbackSchema),
  patches: z.array(patchSchema),
  plan_step_status: z.enum(["PENDING", "IN_PROGRESS", "VALIDATED"]),
  active_prompt_profile: z.string().min(1).optional(),
  active_prompt_title: z.string().min(1).optional(),
  active_prompt_headings: z.array(z.string().min(1)).optional(),
});

export type RegisterPlanInput = z.infer<typeof registerPlanInputSchema>;
export type RegisterPlanOutput = z.infer<typeof registerPlanOutputSchema>;
export type ReviewCodeChunkInput = z.infer<typeof reviewCodeChunkInputSchema>;
export type ReviewCodeChunkOutput = z.infer<typeof reviewCodeChunkOutputSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
export type Patch = z.infer<typeof patchSchema>;
