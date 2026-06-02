import * as vscode from 'vscode';
import * as path from 'path';
import { EXCLUDED_DIRS } from '../constants';
import { getConfig } from '../utils/config';

export class FileTreeProvider implements vscode.TreeDataProvider<FileTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<FileTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private workspaceRoot: string | undefined;

  constructor() {
    this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: FileTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
    if (!this.workspaceRoot) {
      return [new FileTreeItem('No workspace opened', vscode.TreeItemCollapsibleState.None)];
    }

    const dirPath = element ? element.resourceUri!.fsPath : this.workspaceRoot;
    return this.readDirectory(dirPath);
  }

  private async readDirectory(dirPath: string): Promise<FileTreeItem[]> {
    try {
      const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
      const autoCollapse = getConfig('autoCollapseNodeModules');

      const items: FileTreeItem[] = [];

      // Sort: directories first, then files, both alphabetically
      const sorted = entries.sort((a, b) => {
        const aIsDir = a[1] === vscode.FileType.Directory;
        const bIsDir = b[1] === vscode.FileType.Directory;
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a[0].localeCompare(b[0]);
      });

      for (const [name, fileType] of sorted) {
        // Auto-collapse excluded dirs
        if (
          autoCollapse &&
          fileType === vscode.FileType.Directory &&
          EXCLUDED_DIRS.includes(name)
        ) {
          items.push(
            new FileTreeItem(
              name,
              vscode.TreeItemCollapsibleState.Collapsed,
              vscode.Uri.joinPath(vscode.Uri.file(dirPath), name),
            ),
          );
          continue;
        }

        const uri = vscode.Uri.joinPath(vscode.Uri.file(dirPath), name);

        if (fileType === vscode.FileType.Directory) {
          items.push(new FileTreeItem(name, vscode.TreeItemCollapsibleState.Collapsed, uri));
        } else {
          items.push(new FileTreeItem(name, vscode.TreeItemCollapsibleState.None, uri));
        }
      }

      return items;
    } catch {
      return [];
    }
  }
}

export class FileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly resourceUri?: vscode.Uri,
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
    this.description = undefined;

    if (resourceUri) {
      const ext = path.extname(label);
      const isDir = collapsibleState !== vscode.TreeItemCollapsibleState.None;

      if (isDir) {
        this.iconPath = new vscode.ThemeIcon('folder');
      } else {
        this.iconPath = this.getFileIcon(ext);
      }
    }
  }

  private getFileIcon(ext: string): vscode.ThemeIcon {
    switch (ext) {
      case '.ts':
      case '.tsx':
        return new vscode.ThemeIcon('symbol-namespace');
      case '.js':
      case '.jsx':
        return new vscode.ThemeIcon('symbol-method');
      case '.json':
        return new vscode.ThemeIcon('symbol-constant');
      case '.md':
        return new vscode.ThemeIcon('markdown');
      case '.css':
      case '.scss':
      case '.less':
        return new vscode.ThemeIcon('symbol-color');
      case '.html':
        return new vscode.ThemeIcon('symbol-structure');
      case '.svg':
      case '.png':
      case '.jpg':
      case '.gif':
        return new vscode.ThemeIcon('file-media');
      default:
        return new vscode.ThemeIcon('file');
    }
  }
}
