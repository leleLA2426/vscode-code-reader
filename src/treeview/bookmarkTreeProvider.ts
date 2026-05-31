import * as vscode from 'vscode';
import { BookmarkService } from './bookmarks';
import type { Bookmark } from '../types';

export class BookmarkTreeProvider implements vscode.TreeDataProvider<BookmarkItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<BookmarkItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private bookmarkService: BookmarkService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: BookmarkItem): vscode.TreeItem {
    return element;
  }

  getChildren(): BookmarkItem[] {
    const bookmarks = this.bookmarkService.getAll();
    return bookmarks.map(
      (b) =>
        new BookmarkItem(
          b,
          vscode.Uri.file(b.filePath),
        ),
    );
  }
}

export class BookmarkItem extends vscode.TreeItem {
  constructor(bookmark: Bookmark, uri: vscode.Uri) {
    const fileName = bookmark.filePath.split(/[/\\]/).pop() || bookmark.filePath;
    super(`L${bookmark.line + 1}: ${fileName}`, vscode.TreeItemCollapsibleState.None);

    this.description = bookmark.note || '';
    this.tooltip = `${bookmark.filePath}:${bookmark.line + 1}${bookmark.note ? ' — ' + bookmark.note : ''}`;
    this.iconPath = new vscode.ThemeIcon('bookmark');
    this.resourceUri = uri;

    this.command = {
      command: 'vscode.open',
      title: 'Go to Bookmark',
      arguments: [uri, { selection: new vscode.Range(bookmark.line, 0, bookmark.line, 0) }],
    };

    this.contextValue = 'bookmarkItem';
  }
}