import * as path from "path";
import * as fs from "fs";
import { ParseResult } from "../types";

let nativeModule: any = null;

function resolveNativePath(): string {
  const debugPath = path.join(__dirname, "..", "build", "Debug", "code-reader-native.node");
  const releasePath = path.join(__dirname, "..", "build", "Release", "code-reader-native.node");
  if (fs.existsSync(debugPath)) return debugPath;
  if (fs.existsSync(releasePath)) return releasePath;
  throw new Error(`Native module not found at ${debugPath} or ${releasePath}`);
}

function getNative(): any {
  if (!nativeModule) {
    try {
      nativeModule = require(resolveNativePath());
      console.log("[Code Reader] Native module loaded successfully");
    } catch (e) {
      console.error("[Code Reader] Failed to load native module:", (e as Error).message);
      throw new Error(`Failed to load native module: ${(e as Error).message}`);
    }
  }
  return nativeModule;
}

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