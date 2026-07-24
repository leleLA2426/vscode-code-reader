import * as vscode from "vscode";
import { FileTreeProvider } from "./treeviews/fileTreeProvider";
import { SymbolTreeProvider } from "./treeviews/symbolTreeProvider";
import { openReader, setOnSymbolsReady } from "./panels/readerPanel";

export let extContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
  extContext = context;

  const fileTreeProvider = new FileTreeProvider();
  const fileTree = vscode.window.createTreeView("codeReader.fileTree", {
    treeDataProvider: fileTreeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(fileTree);

  const symbolTreeProvider = new SymbolTreeProvider();
  const symbolTree = vscode.window.createTreeView("codeReader.symbols", {
    treeDataProvider: symbolTreeProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(symbolTree);

  setOnSymbolsReady((filePath, symbols) => {
    symbolTreeProvider.update(filePath, symbols);
  });

  // goToSymbol: jump to a specific line in the reader
  const gotoCmd = vscode.commands.registerCommand(
    "codeReader.gotoSymbol",
    async (filePath: string, line: number) => {
      const uri = vscode.Uri.file(filePath);
      const doc = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
      const range = new vscode.Range(line, 0, line, 0);
      editor.selection = new vscode.Selection(range.start, range.start);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    }
  );
  context.subscriptions.push(gotoCmd);

  // openReader command
  const openCmd = vscode.commands.registerCommand(
    "codeReader.openReader",
    async (filePath?: string, scrollToLine?: number) => {
      const target = filePath || vscode.window.activeTextEditor?.document.uri.fsPath;
      if (!target) {
        vscode.window.showWarningMessage(
          "No file selected. Open a file in the editor or click a file in the Project Files tree."
        );
        return;
      }
      try {
        await openReader(target, scrollToLine);
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