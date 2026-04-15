import ts from "typescript";

export interface PreflightIssue {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  message: string;
  evidence?: string;
}

export interface PreflightResult {
  issues: PreflightIssue[];
  raw: string;
  hasBlockingIssues: boolean;
}

function tsDiagnostics(code: string): PreflightIssue[] {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      strict: true,
    },
    reportDiagnostics: true,
  });

  if (!result.diagnostics?.length) {
    return [];
  }

  return result.diagnostics
    .filter((diag) => diag.category === ts.DiagnosticCategory.Error)
    .map((diag) => ({
      severity: "high" as const,
      category: "typescript",
      message: ts.flattenDiagnosticMessageText(diag.messageText, "\n"),
    }));
}

function securityRules(code: string): PreflightIssue[] {
  const issues: PreflightIssue[] = [];

  const dangerousPatterns = [
    { regex: /\beval\s*\(/, message: "Use of eval detected." },
    { regex: /child_process\.(exec|execSync)\s*\(/, message: "Potential command execution risk detected." },
    { regex: /new\s+Function\s*\(/, message: "Dynamic function construction detected." },
    {
      regex: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]+['"]/i,
      message: "Possible hardcoded secret detected.",
    },
  ];

  for (const pattern of dangerousPatterns) {
    const match = code.match(pattern.regex);
    if (match) {
      issues.push({
        severity: "critical",
        category: "security",
        message: pattern.message,
        evidence: match[0],
      });
    }
  }

  return issues;
}

export function runPreflightChecks(codeChunk: string): PreflightResult {
  const issues = [...tsDiagnostics(codeChunk), ...securityRules(codeChunk)];
  const raw = JSON.stringify(issues, null, 2);

  return {
    issues,
    raw,
    hasBlockingIssues: issues.some((issue) => issue.severity === "critical"),
  };
}
