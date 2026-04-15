import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPlanInputSchema, registerPlanOutputSchema, reviewCodeChunkInputSchema, reviewCodeChunkOutputSchema } from "./schemas.js";
import { StateStore } from "./state.js";
import { AstContextEngine } from "./ast.js";
import { runPreflightChecks } from "./preflight.js";
import { reviewCodeChunk } from "./reviewer.js";

export interface CodeReviewerServerOptions {
  projectPath: string;
  dbPath: string;
}

export class CodeReviewerServer {
  public readonly mcp: McpServer;
  private readonly state: StateStore;
  private readonly ast: AstContextEngine;

  public constructor(options: CodeReviewerServerOptions) {
    this.mcp = new McpServer({
      name: "codeviewer-mcp-reviewer",
      version: "1.0.0",
    });

    this.state = new StateStore(options.dbPath);
    this.ast = new AstContextEngine(options.projectPath);

    this.registerTools(options.projectPath);
  }

  private registerTools(defaultProjectPath: string): void {
    this.mcp.registerTool(
      "register_plan",
      {
        description: "Register an execution plan for iterative MCP code review.",
        inputSchema: registerPlanInputSchema.shape,
        outputSchema: registerPlanOutputSchema.shape,
      },
      async (input) => {
        const parsed = registerPlanInputSchema.parse(input);
        const projectPath = path.resolve(parsed.project_path ?? defaultProjectPath);
        const sessionId = this.state.createSession(projectPath, parsed.steps);

        return {
          structuredContent: {
            session_id: sessionId,
            steps_registered: parsed.steps.length,
            status: "ACTIVE",
          },
          content: [
            {
              type: "text",
              text: `Registered session ${sessionId} with ${parsed.steps.length} plan steps.`,
            },
          ],
        };
      },
    );

    this.mcp.registerTool(
      "review_code_chunk",
      {
        description: "Review a code chunk against a plan step with AST-localized context and pre-flight checks.",
        inputSchema: reviewCodeChunkInputSchema.shape,
        outputSchema: reviewCodeChunkOutputSchema.shape,
      },
      async (input) => {
        const parsed = reviewCodeChunkInputSchema.parse(input);
        const session = this.state.getSession(parsed.session_id);
        if (!session) {
          throw new Error(`Unknown session_id: ${parsed.session_id}`);
        }

        const step = this.state.getPlanStep(parsed.session_id, parsed.plan_step);
        if (!step) {
          throw new Error(`Unknown plan_step ${parsed.plan_step} for session ${parsed.session_id}`);
        }

        this.ast.reindex();

        const astContext = this.ast.localizeContext(
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
        const review = reviewCodeChunk(parsed, {
          stepDescription: step.description,
          preflight,
          astContext,
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

        return {
          structuredContent: review,
          content: [
            {
              type: "text",
              text: `Review verdict: ${review.verdict}. Critical issues: ${review.critical_issues}.`,
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
