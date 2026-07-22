import * as vscode from "vscode";
import * as path from "path";
import { shouldCollapseDir } from "../utils/fileUtils";
import { getConfig } from "../utils/config";

/** TreeItem with attached full path for directory traversal */
interface TreeItemWithPath extends vscode.TreeItem {
  fullPath: string;
}

export class FileTreeProvider implements vscode.TreeDataProvider<TreeItemWithPath> {
  private _onDidChange = new vscode.EventEmitter<TreeItemWithPath | undefined>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private rootPath: string | undefined;

  constructor() {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      this.rootPath = folders[0].uri.fsPath;
    }
  }

  refresh(): void {
    this._onDidChange.fire(undefined);
  }

  getTreeItem(element: TreeItemWithPath): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItemWithPath): Promise<TreeItemWithPath[]> {
    if (!this.rootPath) {
      return [Object.assign(new vscode.TreeItem("No folder opened"), { fullPath: "" }) as TreeItemWithPath];
    }

    const dirPath = element ? element.fullPath : this.rootPath;
    const config = getConfig();

    try {
      const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
      const items: TreeItemWithPath[] = [];

      // Directories first, then files, sorted alphabetically
      entries.sort((a, b) => {
        const aIsDir = a[1] === vscode.FileType.Directory ? 0 : 1;
        const bIsDir = b[1] === vscode.FileType.Directory ? 0 : 1;
        if (aIsDir !== bIsDir) return aIsDir - bIsDir;
        return a[0].localeCompare(b[0]);
      });

      for (const [name, type] of entries) {
        // Skip .git folder only; show other dot-files/dirs
        if (name === ".git") continue;

        const fullPath = path.join(dirPath, name);
        const isDir = type === vscode.FileType.Directory;
        const collapsible = isDir
          ? config.autoCollapseNodeModules && shouldCollapseDir(name)
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None;

        const item = new vscode.TreeItem(name, collapsible) as TreeItemWithPath;
        item.fullPath = fullPath;

        if (isDir) {
          item.iconPath = new vscode.ThemeIcon("folder");
          item.contextValue = "folder";
        } else {
          item.iconPath = new vscode.ThemeIcon("file");
          item.contextValue = "file";
          item.command = {
            command: "codeReader.openReader",
            title: "Open in Code Reader",
            arguments: [fullPath],
          };
        }

        items.push(item);
      }

      return items;
    } catch {
      return [];
    }
  }
}