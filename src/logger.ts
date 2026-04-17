export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: Record<string, unknown> | undefined;
}

export interface Logger {
  trace(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown> | Error): void;
  level: LogLevel;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

export class ConsoleLogger implements Logger {
  public level: LogLevel = "info";
  private readonly requestId: string;

  constructor(requestId?: string) {
    this.requestId = requestId ?? `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level];
  }

  private formatMessage(entry: LogEntry): string {
    const parts = [
      entry.timestamp,
      entry.level.toUpperCase().padEnd(5),
      this.requestId ? `[${this.requestId}]` : "",
      entry.message,
    ];
    const message = parts.filter(Boolean).join(" ");

    if (entry.context && Object.keys(entry.context).length > 0) {
      return `${message} ${JSON.stringify(entry.context)}`;
    }
    return message;
  }

  trace(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("trace")) return;
    console.debug(this.formatMessage({
      level: "trace",
      message,
      timestamp: new Date().toISOString(),
      context,
    }));
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("debug")) return;
    console.debug(this.formatMessage({
      level: "debug",
      message,
      timestamp: new Date().toISOString(),
      context,
    }));
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("info")) return;
    console.info(this.formatMessage({
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context,
    }));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("warn")) return;
    console.warn(this.formatMessage({
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context,
    }));
  }

  error(message: string, context?: Record<string, unknown> | Error): void {
    if (!this.shouldLog("error")) return;
    const errorContext = context instanceof Error
      ? { error: context.message, stack: context.stack }
      : context;
    console.error(this.formatMessage({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      context: errorContext,
    }));
  }
}

export class NoOpLogger implements Logger {
  public level: LogLevel = "info";
  trace(): void {}
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

export function createLogger(): Logger {
  const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) ?? "info";
  const logger = new ConsoleLogger();

  if (["trace", "debug", "info", "warn", "error"].includes(logLevel)) {
    logger.level = logLevel;
  }

  return logger;
}

export function createChildLogger(parent: Logger, requestId: string): Logger {
  if (parent instanceof ConsoleLogger) {
    const child = new ConsoleLogger(requestId);
    child.level = parent.level;
    return child;
  }
  return parent;
}
