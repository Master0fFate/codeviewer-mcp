export function parseOptionalPositiveIntegerEnv(rawValue: string | undefined, envName: string): number | undefined {
  if (rawValue == null || rawValue.trim() === "") {
    return undefined;
  }

  if (!/^\d+$/.test(rawValue.trim())) {
    throw new Error(`${envName} must be a positive integer; received \"${rawValue}\".`);
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${envName} must be a positive integer; received \"${rawValue}\".`);
  }

  return parsed;
}
