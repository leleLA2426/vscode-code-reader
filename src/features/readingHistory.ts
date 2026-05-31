import * as vscode from 'vscode';
import type { ReadingEntry, IReadingHistory } from '../types';

export class ReadingHistory implements IReadingHistory {
  private entries: Map<string, ReadingEntry> = new Map();
  private readonly maxEntries = 50;

  constructor(private context: vscode.ExtensionContext) {
    const saved = context.workspaceState.get<Array<[string, ReadingEntry]>>('readingHistory');
    if (saved) {
      this.entries = new Map(saved);
    }
  }

  add(filePath: string): void {
    const existing = this.entries.get(filePath);
    if (existing) {
      existing.lastOpened = Date.now();
      existing.openCount++;
    } else {
      this.entries.set(filePath, {
        filePath,
        lastOpened: Date.now(),
        openCount: 1,
      });
    }

    // Trim old entries
    if (this.entries.size > this.maxEntries) {
      const sorted = [...this.entries.values()].sort(
        (a, b) => a.lastOpened - b.lastOpened,
      );
      const toRemove = sorted.slice(0, this.entries.size - this.maxEntries);
      for (const entry of toRemove) {
        this.entries.delete(entry.filePath);
      }
    }

    this.save();
  }

  getAll(): ReadingEntry[] {
    return [...this.entries.values()].sort((a, b) => b.lastOpened - a.lastOpened);
  }

  getRecent(limit = 10): ReadingEntry[] {
    return this.getAll().slice(0, limit);
  }

  private save(): void {
    this.context.workspaceState.update('readingHistory', [...this.entries]);
  }
}
