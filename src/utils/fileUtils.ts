import * as vscode from "vscode";
import * as iconv from "iconv-lite";
import { SUPPORTED_LANGUAGES, COLLAPSIBLE_DIRS } from "../constants";

export function getLanguageForFile(filePath: string): string {
  const doc = vscode.workspace.textDocuments.find((d) => d.uri.fsPath === filePath);
  if (doc) return doc.languageId;
  const dotIdx = filePath.lastIndexOf(".");
  const ext = dotIdx === -1 ? "" : filePath.slice(dotIdx);
  return SUPPORTED_LANGUAGES[ext] || "plaintext";
}

export function shouldCollapseDir(dirName: string): boolean {
  return COLLAPSIBLE_DIRS.includes(dirName);
}

export async function readFileContent(
  filePath: string,
  maxLines?: number
): Promise<{ content: string; truncated: boolean }> {
  const uri = vscode.Uri.file(filePath);
  const rawData = await vscode.workspace.fs.readFile(uri);
  const buffer = Buffer.from(rawData);

  let content = buffer.toString("utf-8");
  if (content.includes("\uFFFD")) {
    content = iconv.decode(buffer, "gbk");
  }

  if (!maxLines || maxLines <= 0) return { content, truncated: false };

  const lines = content.split("\n");
  if (lines.length <= maxLines) return { content, truncated: false };

  // Reserve 1 line for the truncation note
  const showLines = maxLines - 1;
  const truncated = lines.slice(0, showLines).join("\n");
  const note = `\n// ... (${lines.length - showLines} more lines not shown)`;
  return { content: truncated + note, truncated: true };
}