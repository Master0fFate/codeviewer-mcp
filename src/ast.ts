import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import type { File, Statement } from "@babel/types";

const SUPPORTED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

export interface AstLocalizationResult {
  filePath: string;
  imports: string[];
  parentScope: string;
  nodeReference: string | null;
}

interface IndexedFile {
  filePath: string;
  imports: string[];
  declarations: Map<string, { start: number; end: number }>;
  source: string;
}

export class AstContextEngine {
  private readonly projectPath: string;
  private readonly projectRoot: string;
  private readonly index = new Map<string, IndexedFile>();

  public constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.projectRoot = realpathSync(path.resolve(projectPath));
    this.reindex();
  }

  private normalizeForComparison(inputPath: string): string {
    const normalized = path.normalize(inputPath);
    return process.platform === "win32" ? normalized.toLowerCase() : normalized;
  }

  private isWithinProjectRoot(candidatePath: string): boolean {
    const root = this.normalizeForComparison(this.projectRoot);
    const candidate = this.normalizeForComparison(candidatePath);
    return candidate === root || candidate.startsWith(`${root}${path.sep}`);
  }

  public reindex(): void {
    this.index.clear();
    for (const filePath of this.collectFiles(this.projectPath)) {
      this.indexFile(filePath);
    }
  }

  private collectFiles(root: string): string[] {
    const result: string[] = [];
    const entries = readdirSync(root, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
        continue;
      }

      const fullPath = path.join(root, entry.name);
      if (entry.isDirectory()) {
        result.push(...this.collectFiles(fullPath));
        continue;
      }

      if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name))) {
        result.push(fullPath);
      }
    }

    return result;
  }

  private indexFile(filePath: string): void {
    const source = readFileSync(filePath, "utf8");
    const file = this.parseFileSafe(source);
    if (!file) {
      return;
    }

    const imports: string[] = [];
    const declarations = new Map<string, { start: number; end: number }>();

    for (const node of file.program.body) {
      this.collectTopLevelNode(node, imports, declarations);
    }

    this.index.set(path.resolve(filePath), {
      filePath: path.resolve(filePath),
      imports,
      declarations,
      source,
    });
  }

  private parseFileSafe(source: string): File | null {
    try {
      return parse(source, {
        sourceType: "unambiguous",
        plugins: ["typescript", "jsx", "classProperties", "decorators-legacy"],
      });
    } catch {
      return null;
    }
  }

  private collectTopLevelNode(
    node: Statement,
    imports: string[],
    declarations: Map<string, { start: number; end: number }>,
  ): void {
    if (node.type === "ImportDeclaration") {
      imports.push(node.source.value);
      return;
    }

    if (node.type === "FunctionDeclaration" && node.id && node.start != null && node.end != null) {
      declarations.set(node.id.name, { start: node.start, end: node.end });
      return;
    }

    if (node.type === "ClassDeclaration" && node.id && node.start != null && node.end != null) {
      declarations.set(node.id.name, { start: node.start, end: node.end });
      return;
    }

    if (node.type === "VariableDeclaration") {
      for (const declaration of node.declarations) {
        if (
          declaration.id.type === "Identifier" &&
          declaration.init &&
          (declaration.init.type === "ArrowFunctionExpression" || declaration.init.type === "FunctionExpression") &&
          declaration.start != null &&
          declaration.end != null
        ) {
          declarations.set(declaration.id.name, { start: declaration.start, end: declaration.end });
        }
      }
    }
  }

  public localizeContext(input: {
    targetFile: string;
    targetNode?: string;
    codeChunk: string;
  }): AstLocalizationResult {
    const absoluteTarget = path.resolve(this.projectPath, input.targetFile);
    const targetDirectory = path.dirname(absoluteTarget);
    if (!statSync(targetDirectory, { throwIfNoEntry: false })?.isDirectory()) {
      throw new Error(`Target directory does not exist for ${absoluteTarget}`);
    }
    const targetDirectoryRealPath = realpathSync(targetDirectory);
    if (!this.isWithinProjectRoot(targetDirectoryRealPath)) {
      throw new Error(`target_file must resolve within project root: ${this.projectRoot}`);
    }

    const targetFileStats = statSync(absoluteTarget, { throwIfNoEntry: false });
    if (targetFileStats?.isFile()) {
      const targetFileRealPath = realpathSync(absoluteTarget);
      if (!this.isWithinProjectRoot(targetFileRealPath)) {
        throw new Error(`target_file must resolve within project root: ${this.projectRoot}`);
      }
    }

    const indexed = this.index.get(absoluteTarget);
    if (!indexed) {
      return {
        filePath: absoluteTarget,
        imports: [],
        parentScope: "",
        nodeReference: input.targetNode ?? null,
      };
    }

    const candidateNode = input.targetNode ?? this.extractLikelyNodeName(input.codeChunk);
    if (candidateNode && indexed.declarations.has(candidateNode)) {
      const loc = indexed.declarations.get(candidateNode)!;
      return {
        filePath: absoluteTarget,
        imports: indexed.imports,
        parentScope: indexed.source.slice(loc.start, loc.end),
        nodeReference: candidateNode,
      };
    }

    return {
      filePath: absoluteTarget,
      imports: indexed.imports,
      parentScope: indexed.source.slice(0, Math.min(1200, indexed.source.length)),
      nodeReference: candidateNode ?? null,
    };
  }

  private extractLikelyNodeName(codeChunk: string): string | undefined {
    const patterns = [
      /function\s+([A-Za-z_$][\w$]*)\s*\(/,
      /class\s+([A-Za-z_$][\w$]*)\s*/,
      /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/,
      /let\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/,
    ];

    for (const pattern of patterns) {
      const match = codeChunk.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return undefined;
  }
}
