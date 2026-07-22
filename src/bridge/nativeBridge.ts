import * as vscode from "vscode";
import * as path from "path";
import { ParseResult } from "../types";

let nativeModule: any = null;

function resolveNativePath(): string {
  // VSCode bundles extensions under a known structure; try common build output locations
  const extPath = vscode.extensions.getExtension("code-reader")?.extensionPath || process.cwd();
  const debugPath = path.join(extPath, "build", "Debug", "code-reader-native.node");
  const releasePath = path.join(extPath, "build", "Release", "code-reader-native.node");
  try { require.resolve(debugPath); return debugPath; } catch { /* fallthrough */ }
  return releasePath;
}

function getNative(): any {
  if (!nativeModule) {
    try {
      nativeModule = require(resolveNativePath());
    } catch (e) {
      throw new Error(`Failed to load native module: ${(e as Error).message}`);
    }
  }
  return nativeModule;
}

export function parseFile(content: string, language: string): ParseResult {
  const native = getNative();
  const raw = native.parseFile(content, language);
  return {
    content: raw.content,
    tokens: raw.tokens || [],
    symbols: raw.symbols || [],
    folds: raw.folds || [],
  };
}