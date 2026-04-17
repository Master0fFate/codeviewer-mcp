import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

export type PlanStepStatus = "PENDING" | "IN_PROGRESS" | "VALIDATED";

export interface SessionRecord {
  id: string;
  project_path: string;
  prompt_profile: string;
  created_at: string;
  expires_at: string;
  status: "ACTIVE" | "COMPLETED";
}

export interface CleanupResult {
  sessions_deleted: number;
  chunks_deleted: number;
  reviews_deleted: number;
  plan_steps_deleted: number;
}

export class DatabaseError extends Error {
  public readonly code: string;

  constructor(
    message: string,
    code: string,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "DatabaseError";
    this.code = code;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }

  public override toString(): string {
    return `DatabaseError[${this.code}]: ${this.message}`;
  }
}

export interface PlanStepRecord {
  session_id: string;
  step_number: number;
  description: string;
  status: PlanStepStatus;
}

export interface CodeChunkRecord {
  chunk_id: string;
  session_id: string;
  step_number: number;
  file_path: string;
  raw_code: string;
  ast_node_reference: string | null;
  timestamp: string;
}

export interface ReviewLedgerRecord {
  chunk_id: string;
  verdict: "PASS" | "FAIL";
  severity: string;
  feedback_json: string;
  static_analysis_raw: string;
}

export class StateStore {
  private readonly db: Database.Database;
  private readonly sessionTtlHours: number;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 100;

  public constructor(dbPath: string, sessionTtlHours?: number) {
    this.sessionTtlHours = sessionTtlHours ?? 168; // Default: 7 days
    try {
      this.db = new Database(dbPath, { readonly: false });
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("foreign_keys = ON");
      this.initialize();
    } catch (error) {
      throw new DatabaseError(
        `Failed to initialize database at ${dbPath}`,
        "INIT_FAILED",
        error,
      );
    }
  }

  private executeWithRetry<T>(operation: () => T, operationName: string): T {
    let lastError: unknown;
    for (let attempt = 0; attempt < StateStore.MAX_RETRIES; attempt++) {
      try {
        return operation();
      } catch (error) {
        lastError = error;
        const code = (error as { code?: string }).code;
        if (code === "SQLITE_BUSY" && attempt < StateStore.MAX_RETRIES - 1) {
          // Exponential backoff: 100ms, 200ms, 400ms
          const delay = StateStore.RETRY_DELAY_MS * Math.pow(2, attempt);
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
          continue;
        }
        if (code === "SQLITE_CONSTRAINT") {
          throw new DatabaseError(
            `Constraint violation in ${operationName}: ${(error as Error).message}`,
            "CONSTRAINT",
            error,
          );
        }
        if (code === "SQLITE_CORRUPT") {
          throw new DatabaseError(
            `Database corruption detected in ${operationName}`,
            "CORRUPT",
            error,
          );
        }
        throw new DatabaseError(
          `Database error in ${operationName}: ${(error as Error).message}`,
          code ?? "UNKNOWN",
          error,
        );
      }
    }
    throw new DatabaseError(
      `Failed after ${StateStore.MAX_RETRIES} retries: ${operationName}`,
      "MAX_RETRIES",
      lastError,
    );
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        prompt_profile TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED'))
      );

      CREATE TABLE IF NOT EXISTS execution_plans (
        session_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'VALIDATED')),
        PRIMARY KEY (session_id, step_number),
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS code_chunks (
        chunk_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        raw_code TEXT NOT NULL,
        ast_node_reference TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS review_ledger (
        chunk_id TEXT PRIMARY KEY,
        verdict TEXT NOT NULL CHECK (verdict IN ('PASS', 'FAIL')),
        severity TEXT NOT NULL,
        feedback_json TEXT NOT NULL,
        static_analysis_raw TEXT NOT NULL,
        FOREIGN KEY(chunk_id) REFERENCES code_chunks(chunk_id) ON DELETE CASCADE
      );
    `);

    // Add expires_at column if upgrading from older schema
    try {
      this.db.exec(`ALTER TABLE sessions ADD COLUMN expires_at TEXT NOT NULL DEFAULT ''`);
    } catch {
      // Column already exists, ignore error
    }

    // Add prompt_profile column if upgrading from older schema
    try {
      this.db.exec(`ALTER TABLE sessions ADD COLUMN prompt_profile TEXT NOT NULL DEFAULT ''`);
    } catch {
      // Column already exists, ignore error
    }
  }

  public createSession(projectPath: string, steps: string[], promptProfile = ""): string {
    const sessionId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTtlHours * 60 * 60 * 1000);

    const insertSession = this.db.prepare(
      `INSERT INTO sessions(id, project_path, prompt_profile, created_at, expires_at, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
    );
    const insertStep = this.db.prepare(
      `INSERT INTO execution_plans(session_id, step_number, description, status) VALUES (?, ?, ?, 'PENDING')`,
    );

    this.executeWithRetry(() => {
      const tx = this.db.transaction(() => {
        insertSession.run(sessionId, projectPath, promptProfile, now.toISOString(), expiresAt.toISOString());
        steps.forEach((step, index) => {
          insertStep.run(sessionId, index + 1, step);
        });
      });
      tx();
    }, "createSession");

    return sessionId;
  }

  public getSession(sessionId: string): SessionRecord | undefined {
    return this.executeWithRetry(() => {
      const row = this.db
        .prepare(`SELECT id, project_path, prompt_profile, created_at, expires_at, status FROM sessions WHERE id = ?`)
        .get(sessionId);
      if (!row) return undefined;
      return row as SessionRecord;
    }, "getSession");
  }

  public getPlanStep(sessionId: string, stepNumber: number): PlanStepRecord | undefined {
    return this.executeWithRetry(() => {
      const row = this.db
        .prepare(
          `SELECT session_id, step_number, description, status FROM execution_plans WHERE session_id = ? AND step_number = ?`,
        )
        .get(sessionId, stepNumber);
      if (!row) return undefined;
      return row as PlanStepRecord;
    }, "getPlanStep");
  }

  public updatePlanStepStatus(sessionId: string, stepNumber: number, status: PlanStepStatus): void {
    this.executeWithRetry(() => {
      this.db
        .prepare(`UPDATE execution_plans SET status = ? WHERE session_id = ? AND step_number = ?`)
        .run(status, sessionId, stepNumber);
    }, "updatePlanStepStatus");
  }

  public logCodeChunk(params: {
    sessionId: string;
    stepNumber: number;
    filePath: string;
    rawCode: string;
    astNodeReference: string | null;
  }): string {
    const chunkId = randomUUID();
    this.executeWithRetry(() => {
      this.db
        .prepare(
          `INSERT INTO code_chunks(chunk_id, session_id, step_number, file_path, raw_code, ast_node_reference, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          chunkId,
          params.sessionId,
          params.stepNumber,
          params.filePath,
          params.rawCode,
          params.astNodeReference,
          new Date().toISOString(),
        );
    }, "logCodeChunk");
    return chunkId;
  }

  public logReview(params: {
    chunkId: string;
    verdict: "PASS" | "FAIL";
    severity: string;
    feedbackJson: string;
    staticAnalysisRaw: string;
  }): void {
    this.executeWithRetry(() => {
      this.db
        .prepare(
          `INSERT INTO review_ledger(chunk_id, verdict, severity, feedback_json, static_analysis_raw)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(params.chunkId, params.verdict, params.severity, params.feedbackJson, params.staticAnalysisRaw);
    }, "logReview");
  }

  public cleanupExpiredSessions(): CleanupResult {
    const now = new Date().toISOString();

    return this.executeWithRetry(() => {
      const tx = this.db.transaction(() => {
        const deletedSessions = this.db
          .prepare(`DELETE FROM sessions WHERE expires_at < ?`)
          .run(now).changes;
        const deletedSteps = this.db
          .prepare(`DELETE FROM execution_plans WHERE session_id NOT IN (SELECT id FROM sessions)`)
          .run().changes;
        const deletedChunks = this.db
          .prepare(`DELETE FROM code_chunks WHERE session_id NOT IN (SELECT id FROM sessions)`)
          .run().changes;
        const deletedReviews = this.db
          .prepare(`DELETE FROM review_ledger WHERE chunk_id NOT IN (SELECT chunk_id FROM code_chunks)`)
          .run().changes;

        return {
          sessions_deleted: deletedSessions,
          chunks_deleted: deletedChunks,
          reviews_deleted: deletedReviews,
          plan_steps_deleted: deletedSteps,
        };
      });

      return tx();
    }, "cleanupExpiredSessions");
  }

  public cleanupSession(sessionId: string): CleanupResult {
    return this.executeWithRetry(() => {
      const tx = this.db.transaction(() => {
        const deletedSessions = this.db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId).changes;
        const deletedSteps = this.db
          .prepare(`DELETE FROM execution_plans WHERE session_id NOT IN (SELECT id FROM sessions)`)
          .run().changes;
        const deletedChunks = this.db
          .prepare(`DELETE FROM code_chunks WHERE session_id NOT IN (SELECT id FROM sessions)`)
          .run().changes;
        const deletedReviews = this.db
          .prepare(`DELETE FROM review_ledger WHERE chunk_id NOT IN (SELECT chunk_id FROM code_chunks)`)
          .run().changes;

        return {
          sessions_deleted: deletedSessions,
          chunks_deleted: deletedChunks,
          reviews_deleted: deletedReviews,
          plan_steps_deleted: deletedSteps,
        };
      });

      return tx();
    }, "cleanupSession");
  }

  public listSessions(status?: "ACTIVE" | "COMPLETED"): Array<SessionRecord & { expires_at: string }> {
    return this.executeWithRetry(() => {
      const query = status
        ? `SELECT id, project_path, prompt_profile, created_at, expires_at, status FROM sessions WHERE status = ? ORDER BY created_at DESC`
        : `SELECT id, project_path, prompt_profile, created_at, expires_at, status FROM sessions ORDER BY created_at DESC`;
      const stmt = this.db.prepare(query);
      const result = status ? stmt.all(status) : stmt.all();
      return result as Array<SessionRecord & { expires_at: string }>;
    }, "listSessions");
  }

  public getDbInfo(): { path: string; size: number; pages: number; walMode: boolean } {
    try {
      const size = this.db.prepare(`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`).get() as { size: number };
      const pages = this.db.pragma("page_count", { simple: true }) as number;
      const walMode = this.db.pragma("journal_mode", { simple: true }) === "wal";
      return {
        path: this.db.name,
        size: size.size,
        pages,
        walMode,
      };
    } catch {
      return {
        path: this.db.name,
        size: 0,
        pages: 0,
        walMode: false,
      };
    }
  }

  public close(): void {
    this.db.close();
  }
}
