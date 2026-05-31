import * as vscode from 'vscode';
import type { Bookmark, IBookmarkService } from '../types';

export class BookmarkService implements IBookmarkService {
  private bookmarks: Bookmark[] = [];

  constructor(private context: vscode.ExtensionContext) {
    const saved = context.workspaceState.get<Bookmark[]>('bookmarks');
    if (saved) {
      this.bookmarks = saved;
    }
  }

  add(bookmark: Bookmark): void {
    this.bookmarks.push(bookmark);
    this.save();
  }

  remove(filePath: string, line: number): void {
    this.bookmarks = this.bookmarks.filter(
      (b) => !(b.filePath === filePath && b.line === line),
    );
    this.save();
  }

  getAll(): Bookmark[] {
    return [...this.bookmarks];
  }

  getByFile(filePath: string): Bookmark[] {
    return this.bookmarks.filter((b) => b.filePath === filePath);
  }

  private save(): void {
    this.context.workspaceState.update('bookmarks', this.bookmarks);
  }
}
