import * as vscode from "vscode";
import * as path from "path";
import { ParseResult } from "../types";

let nativeModule: any = null;

function resolveNativePath(): string {
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

/** Call C++ layer to parse a code file (async via Napi::AsyncWorker) */
export async function parseFileAsync(content: string, language: string): Promise<ParseResult> {
  const native = getNative();
  const raw = await native.parseFile(content, language);
  return {
    content: raw.content || content,
    tokens: raw.tokens || [],
    symbols: raw.symbols || [],
    folds: raw.folds || [],
  };
}