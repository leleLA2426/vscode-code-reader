import * as vscode from 'vscode';
import { VIEWS } from '../constants';

export class ReadingListProvider implements vscode.TreeDataProvider<ReadingListItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ReadingListItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private items: ReadingListItem[] = [];

  constructor(private context: vscode.ExtensionContext) {
    // Restore saved reading list
    const saved = context.workspaceState.get<Array<{ uri: string; label: string }>>(
      'readingList',
    );
    if (saved) {
      this.items = saved.map(
        (i) =>
          new ReadingListItem(i.label, vscode.Uri.parse(i.uri)),
      );
    }
  }

  add(uri: vscode.Uri): void {
    // Check if already exists
    if (this.items.some((item) => item.resourceUri?.fsPath === uri.fsPath)) {
      vscode.window.showInformationMessage('Already in reading list');
      return;
    }

    const label = uri.fsPath.split(/[/\\]/).pop() || uri.fsPath;
    this.items.push(new ReadingListItem(label, uri));
    this.save();
    this._onDidChangeTreeData.fire(undefined);
  }

  remove(uri: vscode.Uri): void {
    this.items = this.items.filter((item) => item.resourceUri?.fsPath !== uri.fsPath);
    this.save();
    this._onDidChangeTreeData.fire(undefined);
  }

  clear(): void {
    this.items = [];
    this.save();
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: ReadingListItem): vscode.TreeItem {
    return element;
  }

  getChildren(): ReadingListItem[] {
    return this.items;
  }

  private save(): void {
    this.context.workspaceState.update(
      'readingList',
      this.items.map((i) => ({
        uri: i.resourceUri!.toString(),
        label: i.label as string,
      })),
    );
  }
}

export class ReadingListItem extends vscode.TreeItem {
  constructor(label: string, public readonly resourceUri: vscode.Uri) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = resourceUri.fsPath;
    this.iconPath = new vscode.ThemeIcon('book');
    this.contextValue = 'readingListItem';
    this.command = {
      command: 'vscode.open',
      title: 'Open File',
      arguments: [resourceUri],
    };
  }
}
