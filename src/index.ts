import path from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CodeReviewerServer } from "./server.js";
import { createLogger } from "./logger.js";
import { parseOptionalPositiveIntegerEnv } from "./config.js";

const logger = createLogger();

async function main(): Promise<void> {
  const serverRootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const projectPath = path.resolve(process.env.MCP_PROJECT_PATH ?? process.cwd());
  const dbPath = path.resolve(process.env.MCP_REVIEWER_DB_PATH ?? path.join(projectPath, ".codeviewer-mcp.sqlite"));
  const promptsDirPath = path.resolve(process.env.MCP_PROMPTS_DIR ?? path.join(serverRootPath, "prompts"));
  const sessionTtlHours = parseOptionalPositiveIntegerEnv(process.env.MCP_SESSION_TTL_HOURS, "MCP_SESSION_TTL_HOURS");
  const defaultPromptProfile = process.env.MCP_DEFAULT_PROMPT_PROFILE?.trim() || undefined;
  const authToken = process.env.MCP_AUTH_TOKEN;

  if (authToken) {
    logger.info("Authentication mode enabled");
  }

  const cleanupOnStartup = process.env.MCP_CLEANUP_ON_STARTUP === "true";

  const server = new CodeReviewerServer({
    projectPath,
    dbPath,
    promptsDirPath,
    sessionTtlHours,
    defaultPromptProfile,
    authToken,
    logger,
  });

  const transport = new StdioServerTransport();

  if (cleanupOnStartup) {
    logger.info("Cleaning up expired sessions on startup");
    const result = server.cleanupExpiredSessions();
    logger.info("Startup cleanup complete", result as unknown as Record<string, unknown>);
  }

  process.on("SIGINT", () => {
    logger.info("Received SIGINT, shutting down gracefully");
    server.close();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM, shutting down gracefully");
    server.close();
    process.exit(0);
  });

  logger.info("Starting MCP server", { projectPath, dbPath, promptsDirPath, sessionTtlHours, defaultPromptProfile });
  await server.mcp.connect(transport);
}

main().catch((error: unknown) => {
  logger.error("Fatal MCP server error", error instanceof Error ? error : new Error(String(error)));
  process.exit(1);
});
