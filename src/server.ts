import path from "node:path";
import { statSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerPlanInputSchema, registerPlanOutputSchema, reviewCodeChunkInputSchema, reviewCodeChunkOutputSchema } from "./schemas.js";
import { StateStore, type CleanupResult } from "./state.js";
import { AstContextEngine } from "./ast.js";
import { runPreflightChecks } from "./preflight.js";
import { reviewCodeChunk } from "./reviewer.js";
import type { Logger } from "./logger.js";
import { createLogger } from "./logger.js";
import { PromptRegistry } from "./prompts.js";

export interface CodeReviewerServerOptions {
  projectPath: string;
  dbPath: string;
  promptsDirPath: string;
  sessionTtlHours?: number;
  defaultPromptProfile?: string;
  authToken?: string;
  logger?: Logger;
}

export class CodeReviewerServer {
  public readonly mcp: McpServer;
  private readonly state: StateStore;
  private readonly astByProjectPath = new Map<string, AstContextEngine>();
  private readonly logger: Logger;
  private readonly authToken: string | undefined;
  private readonly defaultProjectPath: string;
  private readonly promptRegistry: PromptRegistry;
  private readonly defaultPromptProfile: string | undefined;

  public constructor(options: CodeReviewerServerOptions) {
    this.logger = options.logger ?? createLogger();
    this.defaultProjectPath = path.resolve(options.projectPath);
    this.authToken = options.authToken;
    this.promptRegistry = new PromptRegistry(path.resolve(options.promptsDirPath), this.logger);
    this.defaultPromptProfile = options.defaultPromptProfile;

    this.mcp = new McpServer({
      name: "codeviewer-mcp-reviewer",
      version: "1.0.0",
    });

    this.state = new StateStore(options.dbPath, options.sessionTtlHours);
    this.getAstEngine(this.defaultProjectPath);

    this.registerTools();
  }

  private getAstEngine(projectPath: string): AstContextEngine {
    const normalizedProjectPath = path.resolve(projectPath);
    const existing = this.astByProjectPath.get(normalizedProjectPath);
    if (existing) {
      return existing;
    }

    const engine = new AstContextEngine(normalizedProjectPath, this.logger);
    this.astByProjectPath.set(normalizedProjectPath, engine);
    return engine;
  }

  public cleanupExpiredSessions(): CleanupResult {
    return this.state.cleanupExpiredSessions();
  }

  private withAuthInputShape(shape: z.ZodRawShape): z.ZodRawShape {
    if (!this.authToken) {
      return shape;
    }

    return {
      ...shape,
      auth_token: z.string().min(1),
    };
  }

  private assertAuthenticated(input: unknown): void {
    if (!this.authToken) {
      return;
    }

    const providedToken = typeof input === "object" && input != null
      ? (input as Record<string, unknown>).auth_token
      : undefined;

    if (typeof providedToken !== "string" || providedToken !== this.authToken) {
      throw new Error("Invalid or missing auth_token.");
    }
  }

  private registerTools(): void {
    this.mcp.registerTool(
      "register_plan",
      {
        description: "Register an execution plan for iterative MCP code review.",
        inputSchema: this.withAuthInputShape(registerPlanInputSchema.shape),
        outputSchema: registerPlanOutputSchema.shape,
      },
      async (input) => {
        this.assertAuthenticated(input);
        const parsed = registerPlanInputSchema.parse(input);
        const projectPath = path.resolve(parsed.project_path ?? this.defaultProjectPath);
        if (!statSync(projectPath, { throwIfNoEntry: false })?.isDirectory()) {
          throw new Error(`project_path must be an existing directory: ${projectPath}`);
        }

        const selectedPromptProfile = this.promptRegistry.resolveProfileId(parsed.prompt_profile, this.defaultPromptProfile);
        if (parsed.prompt_profile && !selectedPromptProfile) {
          const availableProfiles = this.promptRegistry.listProfiles().map((profile) => profile.id);
          throw new Error(
            `Unknown prompt_profile: ${parsed.prompt_profile}. Available profiles: ${availableProfiles.join(", ") || "none"}.`,
          );
        }

        this.getAstEngine(projectPath);
        const sessionId = this.state.createSession(projectPath, parsed.steps, selectedPromptProfile ?? "");

        this.logger.info(`Session created: ${sessionId}`, {
          projectPath,
          steps: parsed.steps.length,
          promptProfile: selectedPromptProfile ?? "none",
        });

        return {
          structuredContent: {
            session_id: sessionId,
            steps_registered: parsed.steps.length,
            status: "ACTIVE",
            ...(selectedPromptProfile ? { prompt_profile: selectedPromptProfile } : {}),
          },
          content: [
            {
              type: "text",
              text: `Registered session ${sessionId} with ${parsed.steps.length} plan steps${selectedPromptProfile ? ` using prompt profile ${selectedPromptProfile}` : ""}.`,
            },
          ],
        };
      },
    );

    this.mcp.registerTool(
      "review_code_chunk",
      {
        description: "Review a code chunk against a plan step with AST-localized context and pre-flight checks.",
        inputSchema: this.withAuthInputShape(reviewCodeChunkInputSchema.shape),
        outputSchema: reviewCodeChunkOutputSchema.shape,
      },
      async (input) => {
        this.assertAuthenticated(input);
        const parsed = reviewCodeChunkInputSchema.parse(input);
        const session = this.state.getSession(parsed.session_id);
        if (!session) {
          throw new Error(`Unknown session_id: ${parsed.session_id}`);
        }

        const step = this.state.getPlanStep(parsed.session_id, parsed.plan_step);
        if (!step) {
          throw new Error(`Unknown plan_step ${parsed.plan_step} for session ${parsed.session_id}`);
        }

        const ast = this.getAstEngine(session.project_path);
        const reindexResult = ast.reindex();

        const astContext = ast.localizeContext(
          parsed.target_node
            ? {
                targetFile: parsed.target_file,
                targetNode: parsed.target_node,
                codeChunk: parsed.code_chunk,
              }
            : {
                targetFile: parsed.target_file,
                codeChunk: parsed.code_chunk,
              },
        );

        const preflight = runPreflightChecks(parsed.code_chunk);
        const promptProfile = session.prompt_profile
          ? this.promptRegistry.getProfile(session.prompt_profile)
          : undefined;

        if (session.prompt_profile && !promptProfile) {
          this.logger.warn("Session prompt profile is no longer available on disk", {
            sessionId: parsed.session_id,
            promptProfile: session.prompt_profile,
          });
        }

        const review = reviewCodeChunk(parsed, {
          stepDescription: step.description,
          preflight,
          astContext,
          promptProfile,
        });

        const chunkId = this.state.logCodeChunk({
          sessionId: parsed.session_id,
          stepNumber: parsed.plan_step,
          filePath: parsed.target_file,
          rawCode: parsed.code_chunk,
          astNodeReference: astContext.nodeReference,
        });

        this.state.logReview({
          chunkId,
          verdict: review.verdict === "PASS" ? "PASS" : "FAIL",
          severity: review.critical_issues > 0 ? "critical" : "info",
          feedbackJson: JSON.stringify(review.feedback),
          staticAnalysisRaw: preflight.raw,
        });

        this.state.updatePlanStepStatus(parsed.session_id, parsed.plan_step, review.plan_step_status);

        this.logger.info(`Chunk reviewed: ${chunkId}`, {
          sessionId: parsed.session_id,
          verdict: review.verdict,
          filesIndexed: reindexResult.filesIndexed,
          filesFailed: reindexResult.filesFailed,
          promptProfile: (review.active_prompt_profile ?? session.prompt_profile) || "none",
        } as unknown as Record<string, unknown>);

        return {
          structuredContent: review,
          content: [
            {
              type: "text",
              text: `Review verdict: ${review.verdict}. Critical issues: ${review.critical_issues}.${review.active_prompt_profile ? ` Prompt profile: ${review.active_prompt_profile}.` : ""}`,
            },
          ],
        };
      },
    );

    this.mcp.registerTool(
      "cleanup_expired_sessions",
      {
        description: "Remove expired sessions and their associated data from the database.",
        inputSchema: this.withAuthInputShape(z.object({}).shape),
      },
      async (input) => {
        this.assertAuthenticated(input);
        const result = this.state.cleanupExpiredSessions();
        this.logger.info("Expired sessions cleaned up", result as unknown as Record<string, unknown>);
        return {
          structuredContent: {
            sessions_deleted: result.sessions_deleted,
            chunks_deleted: result.chunks_deleted,
            reviews_deleted: result.reviews_deleted,
            plan_steps_deleted: result.plan_steps_deleted,
          },
          content: [
            {
              type: "text",
              text: `Cleaned up ${result.sessions_deleted} expired sessions, ${result.plan_steps_deleted} plan steps, ${result.chunks_deleted} code chunks, ${result.reviews_deleted} reviews.`,
            },
          ],
        };
      },
    );

    this.mcp.registerTool(
      "cleanup_session",
      {
        description: "Remove a specific session and all its associated data from the database.",
        inputSchema: this.withAuthInputShape(z.object({ session_id: z.string().uuid() }).shape),
      },
      async (input) => {
        this.assertAuthenticated(input);
        const parsed = z.object({ session_id: z.string().uuid() }).parse(input);
        const result = this.state.cleanupSession(parsed.session_id);
        this.logger.info(`Session cleaned up: ${parsed.session_id}`, result as unknown as Record<string, unknown>);
        return {
          structuredContent: {
            sessions_deleted: result.sessions_deleted,
            chunks_deleted: result.chunks_deleted,
            reviews_deleted: result.reviews_deleted,
            plan_steps_deleted: result.plan_steps_deleted,
          },
          content: [
            {
              type: "text",
              text: `Cleaned up session ${parsed.session_id}: ${result.chunks_deleted} chunks, ${result.reviews_deleted} reviews removed.`,
            },
          ],
        };
      },
    );

    this.mcp.registerTool(
      "list_sessions",
      {
        description: "List all sessions, optionally filtered by status.",
        inputSchema: this.withAuthInputShape(z.object({ status: z.enum(["ACTIVE", "COMPLETED"]).optional() }).shape),
      },
      async (input) => {
        this.assertAuthenticated(input);
        const parsed = z.object({ status: z.enum(["ACTIVE", "COMPLETED"]).optional() }).parse(input);
        const sessions = this.state.listSessions(parsed.status);
        return {
          structuredContent: { sessions },
          content: [
            {
              type: "text",
              text: `Found ${sessions.length} session(s): ${sessions.map((s) => `${s.id} (${s.status})`).join(", ")}`,
            },
          ],
        };
      },
    );

    this.mcp.registerTool(
      "list_indexing_errors",
      {
        description: "List files that failed to parse during AST indexing with their error messages.",
        inputSchema: this.withAuthInputShape(z.object({}).shape),
      },
      async (input) => {
        this.assertAuthenticated(input);
        const errors = this.getAstEngine(this.defaultProjectPath).getIndexingErrors();
        return {
          structuredContent: { errors },
          content: [
            {
              type: "text",
              text: errors.length > 0
                ? `Found ${errors.length} indexing error(s): ${errors.map((e) => `${e.filePath}: ${e.error}`).join("; ")}`
                : "No indexing errors found.",
            },
          ],
        };
      },
    );

    this.mcp.registerTool(
      "list_prompt_profiles",
      {
        description: "List available prompt profiles from the prompts directory.",
        inputSchema: this.withAuthInputShape(z.object({}).shape),
      },
      async (input) => {
        this.assertAuthenticated(input);
        const profiles = this.promptRegistry.listProfiles();
        return {
          structuredContent: {
            profiles,
            default_prompt_profile: this.promptRegistry.resolveProfileId(undefined, this.defaultPromptProfile),
          },
          content: [
            {
              type: "text",
              text: profiles.length > 0
                ? `Available prompt profiles: ${profiles.map((profile) => profile.id).join(", ")}`
                : "No prompt profiles found in prompts directory.",
            },
          ],
        };
      },
    );

    this.mcp.registerTool(
      "get_prompt_profile",
      {
        description: "Get full prompt content for a prompt profile ID.",
        inputSchema: this.withAuthInputShape(z.object({ profile_id: z.string().min(1) }).shape),
      },
      async (input) => {
        this.assertAuthenticated(input);
        const parsed = z.object({ profile_id: z.string().min(1) }).parse(input);
        const profile = this.promptRegistry.getProfile(parsed.profile_id);
        if (!profile) {
          throw new Error(`Unknown profile_id: ${parsed.profile_id}`);
        }

        return {
          structuredContent: {
            id: profile.id,
            title: profile.title,
            file_name: profile.fileName,
            headings: profile.headings,
            content: profile.content,
          },
          content: [
            {
              type: "text",
              text: `Loaded prompt profile ${profile.id} (${profile.title}).`,
            },
          ],
        };
      },
    );

    this.mcp.registerTool(
      "health_check",
      {
        description: "Check the health and status of the MCP server and database.",
        inputSchema: this.withAuthInputShape(z.object({}).shape),
      },
      async (input) => {
        this.assertAuthenticated(input);
        const dbInfo = this.state.getDbInfo();
        const astEngine = this.getAstEngine(this.defaultProjectPath);
        const sessions = this.state.listSessions();
        const indexingErrors = astEngine.getIndexingErrors();

        return {
          structuredContent: {
            status: "healthy",
            database: dbInfo,
            prompts: {
              total: this.promptRegistry.listProfiles().length,
              defaultPromptProfile: this.promptRegistry.resolveProfileId(undefined, this.defaultPromptProfile),
            },
            sessions: {
              total: sessions.length,
              active: sessions.filter((s) => s.status === "ACTIVE").length,
              completed: sessions.filter((s) => s.status === "COMPLETED").length,
            },
            ast: {
              filesIndexed: astEngine.getIndexedFileCount(),
              indexingErrors: indexingErrors.length,
            },
          },
          content: [
            {
              type: "text",
              text: `Server healthy. Database: ${dbInfo.size} bytes. Sessions: ${sessions.length} (${sessions.filter((s) => s.status === "ACTIVE").length} active). AST: ${astEngine.getIndexedFileCount()} files indexed.`,
            },
          ],
        };
      },
    );
  }

  public close(): void {
    this.state.close();
  }
}
