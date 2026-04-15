import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

export type PlanStepStatus = "PENDING" | "IN_PROGRESS" | "VALIDATED";

export interface SessionRecord {
  id: string;
  project_path: string;
  created_at: string;
  status: "ACTIVE" | "COMPLETED";
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

  public constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        created_at TEXT NOT NULL,
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
  }

  public createSession(projectPath: string, steps: string[]): string {
    const sessionId = randomUUID();
    const now = new Date().toISOString();
    const insertSession = this.db.prepare(
      `INSERT INTO sessions(id, project_path, created_at, status) VALUES (?, ?, ?, 'ACTIVE')`,
    );
    const insertStep = this.db.prepare(
      `INSERT INTO execution_plans(session_id, step_number, description, status) VALUES (?, ?, ?, 'PENDING')`,
    );

    const tx = this.db.transaction(() => {
      insertSession.run(sessionId, projectPath, now);
      steps.forEach((step, index) => {
        insertStep.run(sessionId, index + 1, step);
      });
    });

    tx();
    return sessionId;
  }

  public getSession(sessionId: string): SessionRecord | undefined {
    return this.db
      .prepare(`SELECT id, project_path, created_at, status FROM sessions WHERE id = ?`)
      .get(sessionId) as SessionRecord | undefined;
  }

  public getPlanStep(sessionId: string, stepNumber: number): PlanStepRecord | undefined {
    return this.db
      .prepare(
        `SELECT session_id, step_number, description, status FROM execution_plans WHERE session_id = ? AND step_number = ?`,
      )
      .get(sessionId, stepNumber) as PlanStepRecord | undefined;
  }

  public updatePlanStepStatus(sessionId: string, stepNumber: number, status: PlanStepStatus): void {
    this.db
      .prepare(`UPDATE execution_plans SET status = ? WHERE session_id = ? AND step_number = ?`)
      .run(status, sessionId, stepNumber);
  }

  public logCodeChunk(params: {
    sessionId: string;
    stepNumber: number;
    filePath: string;
    rawCode: string;
    astNodeReference: string | null;
  }): string {
    const chunkId = randomUUID();
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

    return chunkId;
  }

  public logReview(params: {
    chunkId: string;
    verdict: "PASS" | "FAIL";
    severity: string;
    feedbackJson: string;
    staticAnalysisRaw: string;
  }): void {
    this.db
      .prepare(
        `INSERT INTO review_ledger(chunk_id, verdict, severity, feedback_json, static_analysis_raw)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(params.chunkId, params.verdict, params.severity, params.feedbackJson, params.staticAnalysisRaw);
  }

  public close(): void {
    this.db.close();
  }
}
