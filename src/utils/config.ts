import * as vscode from 'vscode';
import { CONFIG } from '../constants';

export function getConfig<T = string>(key: string): T {
  return vscode.workspace.getConfiguration(CONFIG.SECTION).get<T>(key)!;
}

export async function updateConfig(key: string, value: unknown): Promise<void> {
  // Runtime type validation for known config keys
  validateConfigValue(key, value);
  await vscode.workspace.getConfiguration(CONFIG.SECTION).update(key, value, true);
}

function validateConfigValue(key: string, value: unknown): void {
  switch (key) {
    case CONFIG.READER_FONT_SIZE:
      if (typeof value !== 'number' || value < 8 || value > 48) {
        throw new Error(`codeReader.readerFontSize must be a number between 8 and 48`);
      }
      break;
    case CONFIG.READER_THEME:
      if (!['light', 'sepia', 'dark'].includes(value as string)) {
        throw new Error(`codeReader.readerTheme must be one of: light, sepia, dark`);
      }
      break;
    case CONFIG.AUTO_COLLAPSE_NODE_MODULES:
      if (typeof value !== 'boolean') {
        throw new Error(`codeReader.autoCollapseNodeModules must be a boolean`);
      }
      break;
    case CONFIG.MAX_FILE_SIZE:
      if (typeof value !== 'number' || value < 100) {
        throw new Error(`codeReader.maxFileSize must be a number >= 100`);
      }
      break;
  }
}