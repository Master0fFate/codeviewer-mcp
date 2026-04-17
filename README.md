# codeviewer-mcp

`codeviewer-mcp` is a TypeScript MCP server for stateful, AST-aware code review workflows.

It runs over STDIO and is designed for MCP clients and LLM harnesses that can launch local MCP servers.

## What this server provides

- MCP tools for iterative plan registration and code-chunk review
- SQLite-backed review sessions and history
- AST indexing/context localization for JS/TS source trees
- Preflight checks (TypeScript diagnostics + security pattern detection)
- Structured review output with verdicts, categorized feedback, and optional patch hints

## MCP tools

1. `register_plan`
2. `review_code_chunk`
3. `cleanup_expired_sessions`
4. `cleanup_session`
5. `list_sessions`
6. `list_indexing_errors`
7. `list_prompt_profiles`
8. `get_prompt_profile`
9. `health_check`

## Prerequisites

These prerequisites are required for this MCP to install and run correctly.

| Requirement | Why it is needed |
| --- | --- |
| Node.js 20+ | Runtime for server and MCP SDK |
| pnpm 9+ | Dependency install and build workflow |
| Git | Clone/update repository for auto-install flows |
| Native build toolchain | Required by `better-sqlite3` native module |

Native build toolchain by OS:

- Windows: Visual Studio Build Tools 2022 (Desktop development with C++) + Python 3
- macOS: Xcode Command Line Tools (`xcode-select --install`)
- Linux (Debian/Ubuntu): `build-essential python3 make g++`

If native builds are missing, `pnpm install` can fail while compiling `better-sqlite3`.

## Quick start

```bash
git clone https://github.com/Master0fFate/codeviewer-mcp.git
cd codeviewer-mcp
pnpm install
pnpm build
pnpm start
```

Development mode:

```bash
pnpm dev
```

## Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `MCP_PROJECT_PATH` | Project root for AST indexing and path containment checks | Current working directory |
| `MCP_REVIEWER_DB_PATH` | SQLite database path | `<MCP_PROJECT_PATH>/.codeviewer-mcp.sqlite` |
| `MCP_PROMPTS_DIR` | Directory containing `*.md` prompt profiles | `<server_root>/prompts` |
| `MCP_DEFAULT_PROMPT_PROFILE` | Default prompt profile ID used when `register_plan` omits `prompt_profile` | `universal-auditor-general-v2.1` if present, else first profile |
| `MCP_SESSION_TTL_HOURS` | Session TTL in hours, positive integer only | `168` |
| `MCP_AUTH_TOKEN` | Optional bearer token for shared environments. If set, every tool call must include `auth_token`. | unset |
| `MCP_CLEANUP_ON_STARTUP` | Cleanup expired sessions on process start (`true` or `false`) | `false` |
| `LOG_LEVEL` | Log level (`trace`, `debug`, `info`, `warn`, `error`) | `info` |

Example:

```bash
MCP_PROJECT_PATH=/absolute/path/to/repo \
MCP_SESSION_TTL_HOURS=24 \
LOG_LEVEL=info \
node dist/index.js
```

Authentication example when `MCP_AUTH_TOKEN` is set:

```json
{
  "session_id": "11111111-1111-1111-1111-111111111111",
  "plan_step": 1,
  "target_file": "src/example.ts",
  "code_chunk": "export const ok = true;",
  "modification_type": "MODIFY",
  "auth_token": "your-shared-secret"
}
```

## Prompt profile workflow (compartmentalized prompts)

This MCP now supports session-level prompt compartmentalization from the `prompts` folder.

- Add prompt files as `*.md` in the prompts directory.
- Profile ID is the filename without extension.
  - Example: `prompts/cybersec.md` -> `prompt_profile: "cybersec"`
- Start a session with `register_plan` and optional `prompt_profile`.
- The selected profile is persisted on the session and reused for every `review_code_chunk` call in that session.
- `review_code_chunk` output includes:
  - `active_prompt_profile`
  - `active_prompt_title`
  - `active_prompt_headings`

Use helper tools:

- `list_prompt_profiles` to see available profiles.
- `get_prompt_profile` to read full prompt content for a profile.

Example `register_plan` payload with specialization profile:

```json
{
  "project_path": "/absolute/path/to/repo",
  "prompt_profile": "cybersec",
  "steps": [
    "Review auth and secrets handling",
    "Check unsafe execution paths"
  ]
}
```

## LLM auto-install guide

This section is written for autonomous LLM installers and MCP harnesses.

### Canonical server launch

```text
node /absolute/path/to/codeviewer-mcp/dist/index.js
```

### Idempotent install/update (bash)

```bash
set -euo pipefail
INSTALL_ROOT="${HOME}/mcp-servers"
SERVER_DIR="${INSTALL_ROOT}/codeviewer-mcp"

mkdir -p "${INSTALL_ROOT}"
if [ ! -d "${SERVER_DIR}/.git" ]; then
  git clone https://github.com/Master0fFate/codeviewer-mcp.git "${SERVER_DIR}"
else
  git -C "${SERVER_DIR}" pull --ff-only
fi

cd "${SERVER_DIR}"
pnpm install
pnpm build
```

### Idempotent install/update (PowerShell)

```powershell
$InstallRoot = Join-Path $HOME "mcp-servers"
$ServerDir = Join-Path $InstallRoot "codeviewer-mcp"

New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
if (-not (Test-Path (Join-Path $ServerDir ".git"))) {
  git clone https://github.com/Master0fFate/codeviewer-mcp.git $ServerDir
} else {
  git -C $ServerDir pull --ff-only
}

Set-Location $ServerDir
pnpm install
pnpm build
```

## Harness installation (Claude Code, VS Code Copilot, OpenCode, generic MCP)

Use the same STDIO launch values in every harness.

Canonical server block:

```json
{
  "name": "codeviewer-mcp",
  "transport": "stdio",
  "command": "node",
  "args": ["/absolute/path/to/codeviewer-mcp/dist/index.js"],
  "env": {
    "MCP_PROJECT_PATH": "/absolute/path/to/target/repo",
    "MCP_REVIEWER_DB_PATH": "/absolute/path/to/target/repo/.codeviewer-mcp.sqlite",
    "LOG_LEVEL": "info"
  }
}
```

### Claude Code / Claude Desktop

1. Open Claude MCP config.
2. Add `codeviewer-mcp` under `mcpServers` with the canonical command/args/env values.
3. Restart Claude.
4. Verify tools are discoverable.

Example:

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

### VS Code Copilot (MCP)

1. Open VS Code MCP server management (UI or JSON settings, depending on version).
2. Register a local STDIO MCP server named `codeviewer-mcp`.
3. Set command `node`, point args to built `dist/index.js`, and set `MCP_PROJECT_PATH`.
4. Reload VS Code window if required by your extension version.
5. Confirm tool discovery in Copilot Chat MCP tools list.

If your version supports JSON settings, map the canonical server block into your MCP settings schema.

### OpenCode

1. Open OpenCode MCP configuration.
2. Add a local STDIO server named `codeviewer-mcp`.
3. Use `node` + built `dist/index.js`.
4. Set `MCP_PROJECT_PATH` and optional DB/log env vars.
5. Restart OpenCode and verify tools appear.

### Generic MCP clients

Any client that supports local STDIO MCP servers can use the canonical block above.
If field names differ, map the same values into your client schema.

## Verification checklist

- [ ] Server starts without process errors
- [ ] Client reports MCP connection established
- [ ] Tools visible: `register_plan`, `review_code_chunk`, `cleanup_expired_sessions`, `cleanup_session`, `list_sessions`, `list_indexing_errors`, `list_prompt_profiles`, `get_prompt_profile`, `health_check`
- [ ] `register_plan` returns a valid `session_id`
- [ ] `review_code_chunk` returns structured verdict output
- [ ] `health_check` reports healthy database/session status

## Development and validation

```bash
pnpm test
pnpm build
```

## Security notes

- Path containment checks prevent escaping the configured project root, including symlink-based escapes.
- Authentication is optional (`MCP_AUTH_TOKEN`) and should be enabled in shared environments.
- Sessions expire automatically based on `MCP_SESSION_TTL_HOURS`.
- SQLite is configured with WAL mode and foreign keys enabled.

## Repository layout

- `/src/index.ts` - Process entrypoint and STDIO transport
- `/src/server.ts` - MCP server and tool registration
- `/src/schemas.ts` - Zod tool contract schemas
- `/src/state.ts` - SQLite state store and session lifecycle
- `/src/ast.ts` - AST indexing and context localization
- `/src/preflight.ts` - Static preflight checks
- `/src/reviewer.ts` - Review decision and output shaping
- `/src/logger.ts` - Structured logging
- `/tests` - Vitest test suite

## License

GNU v3
