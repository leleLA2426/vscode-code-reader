import * as vscode from 'vscode';
import { CONFIG } from '../constants';

export function getConfig<T = string>(key: string): T {
  return vscode.workspace.getConfiguration(CONFIG.SECTION).get<T>(key)!;
}

export async function updateConfig(key: string, value: unknown): Promise<void> {
  await vscode.workspace.getConfiguration(CONFIG.SECTION).update(key, value, true);
}
