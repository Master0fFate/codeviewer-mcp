import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { Logger } from "./logger.js";

export interface PromptProfile {
  id: string;
  title: string;
  filePath: string;
  fileName: string;
  content: string;
  headings: string[];
}

export interface PromptProfileSummary {
  id: string;
  title: string;
  fileName: string;
  headings: string[];
}

function normalizeProfileId(profileId: string): string {
  return profileId.trim().toLowerCase();
}

function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

function extractHeadings(content: string, maxCount = 6): string[] {
  const matches = Array.from(content.matchAll(/^##\s+(.+)$/gm));
  return matches.slice(0, maxCount).map((match) => (match[1] || "").trim()).filter((heading) => heading.length > 0);
}

export class PromptRegistry {
  private readonly promptsDir: string;
  private readonly logger: Logger | undefined;
  private readonly profiles = new Map<string, PromptProfile>();

  public constructor(promptsDir: string, logger?: Logger) {
    this.promptsDir = promptsDir;
    this.logger = logger;
  }

  public reload(): void {
    this.profiles.clear();

    if (!statSync(this.promptsDir, { throwIfNoEntry: false })?.isDirectory()) {
      this.logger?.warn("Prompts directory not found", { promptsDir: this.promptsDir });
      return;
    }

    const files = readdirSync(this.promptsDir)
      .filter((name) => name.toLowerCase().endsWith(".md"))
      .sort((a, b) => a.localeCompare(b));

    for (const fileName of files) {
      const filePath = path.join(this.promptsDir, fileName);
      const rawId = path.basename(fileName, path.extname(fileName));
      const id = normalizeProfileId(rawId);
      const content = readFileSync(filePath, "utf8");

      if (this.profiles.has(id)) {
        this.logger?.warn("Duplicate prompt profile ID ignored", { id, filePath });
        continue;
      }

      this.profiles.set(id, {
        id,
        title: extractTitle(content, rawId),
        filePath,
        fileName,
        content,
        headings: extractHeadings(content),
      });
    }
  }

  public listProfiles(): PromptProfileSummary[] {
    this.reload();
    return Array.from(this.profiles.values()).map((profile) => ({
      id: profile.id,
      title: profile.title,
      fileName: profile.fileName,
      headings: profile.headings,
    }));
  }

  public getProfile(profileId: string): PromptProfile | undefined {
    this.reload();
    return this.profiles.get(normalizeProfileId(profileId));
  }

  public resolveProfileId(requestedProfileId?: string, preferredDefaultId?: string): string | undefined {
    this.reload();

    if (requestedProfileId) {
      const normalizedRequestedId = normalizeProfileId(requestedProfileId);
      if (this.profiles.has(normalizedRequestedId)) {
        return normalizedRequestedId;
      }
      return undefined;
    }

    if (preferredDefaultId) {
      const normalizedDefault = normalizeProfileId(preferredDefaultId);
      if (this.profiles.has(normalizedDefault)) {
        return normalizedDefault;
      }
    }

    if (this.profiles.has("universal-auditor-general-v2.1")) {
      return "universal-auditor-general-v2.1";
    }

    const firstProfile = this.listProfiles()[0];
    return firstProfile?.id;
  }
}