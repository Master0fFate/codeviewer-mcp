import path from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CodeReviewerServer } from "./server.js";

async function main(): Promise<void> {
  const projectPath = path.resolve(process.env.MCP_PROJECT_PATH ?? process.cwd());
  const dbPath = path.resolve(process.env.MCP_REVIEWER_DB_PATH ?? path.join(projectPath, ".codeviewer-mcp.sqlite"));

  const server = new CodeReviewerServer({
    projectPath,
    dbPath,
  });

  const transport = new StdioServerTransport();

  process.on("SIGINT", () => {
    server.close();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    server.close();
    process.exit(0);
  });

  await server.mcp.connect(transport);
}

main().catch((error: unknown) => {
  console.error("Fatal MCP server error:", error);
  process.exit(1);
});
