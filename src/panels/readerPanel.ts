import * as vscode from "vscode";
import * as path from "path";
import { parseFileAsync } from "../bridge/nativeBridge";
import { readFileContent, getLanguageForFile } from "../utils/fileUtils";
import { getConfig } from "../utils/config";
import { ParseResult, SymbolNode } from "../types";
import { extContext } from "../extension";

let currentPanel: vscode.WebviewPanel | undefined;
let onSymbolsReady: ((filePath: string, symbols: SymbolNode[]) => void) | null = null;

export function setOnSymbolsReady(cb: (filePath: string, symbols: SymbolNode[]) => void) {
  onSymbolsReady = cb;
}

export async function openReader(filePath: string, scrollToLine?: number): Promise<void> {
  const config = getConfig();
  const { content, truncated } = await readFileContent(filePath, config.maxFileSize);
  const language = getLanguageForFile(filePath);
  let parseResult: ParseResult;

  try {
    parseResult = await parseFileAsync(content, language);
  } catch (e) {
    console.warn("[Code Reader] Native parse failed, falling back to plain text.", e);
    parseResult = { content, tokens: [], symbols: [], folds: [] };
  }

  const fileName = path.basename(filePath);
  if (truncated) {
    vscode.window.showWarningMessage(
      `File "${fileName}" exceeds ${config.maxFileSize} lines, showing first ${config.maxFileSize} lines.`
    );
  }

  if (onSymbolsReady) {
    onSymbolsReady(filePath, parseResult.symbols);
  }

  if (!currentPanel) {
    const extPath = extContext.extensionPath;
    const webviewDir = vscode.Uri.file(path.join(extPath, "webview"));
    const distDir = vscode.Uri.file(path.join(extPath, "dist"));
    const mediaDir = vscode.Uri.file(path.join(extPath, "media"));

    currentPanel = vscode.window.createWebviewPanel(
      "codeReader.reader",
      "Code Reader",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [webviewDir, distDir, mediaDir],
      }
    );

    currentPanel.onDidDispose(() => { currentPanel = undefined; });

    const html = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(webviewDir, "reader.html"));
    let htmlContent = Buffer.from(html).toString("utf-8");

    const readerScriptUri = currentPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(distDir, "webview", "reader.js")
    );
    const styleUri = currentPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(mediaDir, "styles", "reader.css")
    );

    htmlContent = htmlContent
      .replace("styles/reader.css", styleUri.toString())
      .replace("reader.js", readerScriptUri.toString());

    currentPanel.webview.html = htmlContent;

    currentPanel.webview.postMessage({ type: "updateTheme", theme: config.readerTheme });
    currentPanel.webview.postMessage({ type: "updateFontSize", size: config.readerFontSize });

    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!currentPanel) return;
      if (e.affectsConfiguration("codeReader.readerTheme")) {
        const cfg = getConfig();
        currentPanel.webview.postMessage({ type: "updateTheme", theme: cfg.readerTheme });
      }
      if (e.affectsConfiguration("codeReader.readerFontSize")) {
        const cfg = getConfig();
        currentPanel.webview.postMessage({ type: "updateFontSize", size: cfg.readerFontSize });
      }
    });
  }

  currentPanel.title = `Reader: ${fileName}`;
  currentPanel.reveal(vscode.ViewColumn.Beside);

  currentPanel.webview.postMessage({ type: "loadFile", filePath, result: parseResult, scrollToLine });

  // Scroll to specific line after content loads
  if (scrollToLine !== undefined && scrollToLine >= 0) {
    setTimeout(() => {
      currentPanel?.webview.postMessage({ type: "scrollToLine", line: scrollToLine });
    }, 200);
  }
}