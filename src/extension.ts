import * as vscode from "vscode";
import { FileTreeProvider } from "./treeviews/fileTreeProvider";
import { SymbolTreeProvider } from "./treeviews/symbolTreeProvider";
import { openReader, setOnSymbolsReady } from "./panels/readerPanel";

export let extContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
  extContext = context;

  // File tree
  const fileTreeProvider = new FileTreeProvider();
  const fileTree = vscode.window.createTreeView("codeReader.fileTree", {
    treeDataProvider: fileTreeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(fileTree);

  // Symbol tree
  const symbolTreeProvider = new SymbolTreeProvider();
  const symbolTree = vscode.window.createTreeView("codeReader.symbols", {
    treeDataProvider: symbolTreeProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(symbolTree);

  // Wire symbol data from parser to tree view
  setOnSymbolsReady((_filePath, symbols) => {
    symbolTreeProvider.update(symbols);
  });

  // openReader command
  const openCmd = vscode.commands.registerCommand(
    "codeReader.openReader",
    async (filePath?: string) => {
      const target = filePath || vscode.window.activeTextEditor?.document.uri.fsPath;
      if (!target) {
        vscode.window.showWarningMessage(
          "No file selected. Open a file in the editor or click a file in the Project Files tree."
        );
        return;
      }
      try {
        await openReader(target);
      } catch (e) {
        vscode.window.showErrorMessage(`Failed to open reader: ${(e as Error).message}`);
      }
    }
  );
  context.subscriptions.push(openCmd);

  const refreshCmd = vscode.commands.registerCommand(
    "codeReader.refreshFileTree",
    () => fileTreeProvider.refresh()
  );
  context.subscriptions.push(refreshCmd);

  vscode.window.showInformationMessage("Code Reader activated");
}

export function deactivate() {}