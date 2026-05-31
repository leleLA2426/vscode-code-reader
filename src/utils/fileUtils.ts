import * as vscode from 'vscode';
import { EXCLUDED_DIRS, CONFIG } from '../constants';

export function isExcluded(name: string): boolean {
  return EXCLUDED_DIRS.includes(name);
}

export async function isBinaryFile(uri: vscode.Uri): Promise<boolean> {
  try {
    const content = await vscode.workspace.fs.readFile(uri);
    // Check for null bytes (common in binary files)
    return content.includes(0);
  } catch {
    return true;
  }
}

export async function getFileSize(uri: vscode.Uri): Promise<number> {
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    return stat.size;
  } catch {
    return 0;
  }
}

export function getLineCount(content: string): number {
  return content.split('\n').length;
}

export function shouldPaginate(lineCount: number): boolean {
  const maxSize = vscode.workspace
    .getConfiguration(CONFIG.SECTION)
    .get<number>(CONFIG.MAX_FILE_SIZE) || 5000;
  return lineCount > maxSize;
}
