# codeviewer-mcp

`codeviewer-mcp` is a TypeScript MCP server for stateful, AST-aware code review workflows.

It is designed for clients that can run MCP servers over **STDIO** (local command execution) and call tools in iterative review loops.

## What this repository provides

- A local MCP server process (`dist/index.js`) that exposes review tools
- Stateful review sessions stored in SQLite
- AST-based context localization for JS/TS code
- Deterministic preflight checks (TypeScript diagnostics + basic security pattern checks)
- Structured review output with verdicts, categorized feedback, and optional search/replace patch suggestions

## MCP tools exposed by the server

### 1) `register_plan`
Registers a review session and its ordered plan steps.

Input:
- `project_path` (optional string)
- `steps` (string array, required, at least 1)

Output:
- `session_id` (UUID)
- `steps_registered` (number)
- `status` (`ACTIVE`)

### 2) `review_code_chunk`
Reviews one code chunk against a specific plan step.

Input:
- `session_id` (UUID)
- `plan_step` (positive integer)
- `target_file` (string)
- `code_chunk` (string)
- `modification_type` (`INSERT` | `MODIFY` | `DELETE` | `REPLACE`)
- `target_node` (optional string)
- `active_skills` (optional string array)

Output:
- `verdict` (`PASS` or `NEEDS_WORK`)
- `critical_issues` (number)
- `feedback` (array)
- `patches` (array)
- `plan_step_status` (`PENDING` | `IN_PROGRESS` | `VALIDATED`)

## Runtime behavior

- On startup, the server initializes a SQLite database (default: `.codeviewer-mcp.sqlite` in project root).
- For each `review_code_chunk` request, the server:
  1. Validates the session and plan step
  2. Re-indexes project AST context
  3. Runs preflight checks on the submitted chunk
  4. Produces a structured review response
  5. Logs chunk + review data and updates plan step status

## Requirements

- Node.js 20+ (recommended)
- npm
- Build tools required by native Node modules (for `better-sqlite3`)

## Installation (manual/local)

This repository is intended to run as a local MCP server process.

1. Clone the repository

```bash
git clone https://github.com/Master0fFate/codeviewer-mcp.git
cd codeviewer-mcp
```

2. Install dependencies

```bash
npm install
```

3. Build

```bash
npm run build
```

4. Start server

```bash
npm start
```

Development mode (no prebuild step):

```bash
npm run dev
```

## Environment variables

- `MCP_PROJECT_PATH` (optional): project root used for AST indexing. Defaults to current working directory.
- `MCP_REVIEWER_DB_PATH` (optional): SQLite DB path. Defaults to `<MCP_PROJECT_PATH>/.codeviewer-mcp.sqlite`.

Example:

```bash
MCP_PROJECT_PATH=/absolute/path/to/target/repo \
MCP_REVIEWER_DB_PATH=/absolute/path/to/reviewer.sqlite \
node dist/index.js
```

## Installing into MCP clients / LLM harnesses

The server uses **STDIO transport**, so integration is done by registering a local command.

### Canonical command

Use this command in your MCP client configuration:

```text
node /absolute/path/to/codeviewer-mcp/dist/index.js
```

Recommended args/env form:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/codeviewer-mcp/dist/index.js"],
  "env": {
    "MCP_PROJECT_PATH": "/absolute/path/to/target/project",
    "MCP_REVIEWER_DB_PATH": "/absolute/path/to/target/project/.codeviewer-mcp.sqlite"
  }
}
```

---

### Claude Code

1. Open your Claude Code MCP/server configuration file.
2. Add a new server entry using the canonical STDIO command.
3. Set `MCP_PROJECT_PATH` to the repository Claude Code should review.
4. Save config and restart Claude Code.
5. Confirm the server appears and exposes `register_plan` and `review_code_chunk`.

Example server block:

```json
{
  "name": "codeviewer-mcp",
  "command": "node",
  "args": ["/absolute/path/to/codeviewer-mcp/dist/index.js"],
  "env": {
    "MCP_PROJECT_PATH": "/absolute/path/to/repo"
  }
}
```

### OpenCode

1. Open OpenCode MCP settings.
2. Register a new STDIO MCP server named `codeviewer-mcp`.
3. Point `command`/`args` to your built `dist/index.js`.
4. Provide `MCP_PROJECT_PATH` in environment settings.
5. Restart OpenCode and validate tool discovery.

Example entry:

```json
{
  "mcpServers": {
    "codeviewer-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/codeviewer-mcp/dist/index.js"],
      "env": {
        "MCP_PROJECT_PATH": "/absolute/path/to/repo"
      }
    }
  }
}
```

### Droid (Factory)

1. Open Droid(Factory) MCP connector configuration.
2. Add a local STDIO server entry.
3. Use `node` as command and `dist/index.js` as the argument.
4. Configure environment variables for project/database paths.
5. Restart Droid(Factory) runtime and verify tool availability.

Use the canonical JSON block shown above.

### Kilo Code CLI

1. Open Kilo Code CLI MCP configuration.
2. Add a new server alias (for example `codeviewer-mcp`).
3. Register the same STDIO launch command.
4. Set `MCP_PROJECT_PATH` for the target repository.
5. Restart the CLI session and list MCP tools to confirm connection.

Use the canonical JSON block shown above.

> Note: client config schema and config file location can vary by version. If your harness expects different key names, map the same command/args/env values into its schema.

## Verification checklist after integration

- Server process starts without error
- Client shows connected MCP server
- Tools discovered:
  - `register_plan`
  - `review_code_chunk`
- A sample `register_plan` call returns a `session_id`
- A sample `review_code_chunk` call returns a structured verdict

## Development and validation

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## Repository layout

- `/src/index.ts` - process entrypoint and STDIO transport
- `/src/server.ts` - MCP server + tool registration
- `/src/schemas.ts` - zod schemas for tool contracts
- `/src/state.ts` - SQLite state store
- `/src/ast.ts` - AST indexing and context localization
- `/src/preflight.ts` - static preflight checks
- `/src/reviewer.ts` - review decision + output shaping
- `/tests` - vitest test suite
- `/prompts/universal-auditor-general-v2.1.md` - audited prompt artifact

## License

ISC
