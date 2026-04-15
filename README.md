# codeviewer-mcp

AST-aware MCP code review server with stateful plan tracking.

## Features

- MCP tools: `register_plan`, `review_code_chunk`
- SQLite-backed state (`sessions`, `execution_plans`, `code_chunks`, `review_ledger`)
- AST-aware context localization for JS/TS files
- Deterministic pre-flight checks (TypeScript diagnostics + security rules)
- Structured review verdicts and SEARCH/REPLACE patches

## Run

```bash
npm install
npm run build
npm start
```

For local development:

```bash
npm run dev
```

## Environment variables

- `MCP_PROJECT_PATH` (optional): project root path for AST indexing
- `MCP_REVIEWER_DB_PATH` (optional): SQLite database file path

## Auditor framework artifact

This repository includes an audited and remediated prompt artifact at:

- `prompts/universal-auditor-general-v2.1.md`

The v2.1 version incorporates the reported fixes for instruction consistency, flexible recommendation counts, cross-domain specificity examples, confidence calibration, and comparative-context compliance behavior.
