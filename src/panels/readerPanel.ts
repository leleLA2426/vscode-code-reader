import * as vscode from "vscode";
import * as path from "path";
import { parseFileAsync } from "../bridge/nativeBridge";
import { readFileContent, getLanguageForFile } from "../utils/fileUtils";
import { getConfig } from "../utils/config";
import { ParseResult, SymbolNode } from "../types";
import { extContext } from "../extension";

const panels: Map<string, vscode.WebviewPanel> = new Map();
const fileSymbols: Map<string, SymbolNode[]> = new Map();
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

  fileSymbols.set(filePath, parseResult.symbols);
  if (onSymbolsReady) {
    onSymbolsReady(filePath, parseResult.symbols);
  }

  let panel = panels.get(filePath);
  if (!panel) {
    const extPath = extContext.extensionPath;
    const webviewDir = vscode.Uri.file(path.join(extPath, "webview"));
    const distDir = vscode.Uri.file(path.join(extPath, "dist"));
    const mediaDir = vscode.Uri.file(path.join(extPath, "media"));

    panel = vscode.window.createWebviewPanel(
      "codeReader.reader",
      `Reader: ${fileName}`,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [webviewDir, distDir, mediaDir],
      }
    );

    panel.onDidDispose(() => { panels.delete(filePath); fileSymbols.delete(filePath); });

    panel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active && onSymbolsReady) {
        const syms = fileSymbols.get(filePath);
        if (syms) onSymbolsReady(filePath, syms);
      }
    });

    const html = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(webviewDir, "reader.html"));
    let htmlContent = Buffer.from(html).toString("utf-8");

    const readerScriptUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(distDir, "webview", "reader.js")
    );
    const styleUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(mediaDir, "styles", "reader.css")
    );

    htmlContent = htmlContent
      .replace("styles/reader.css", styleUri.toString())
      .replace("reader.js", readerScriptUri.toString());

    panel.webview.html = htmlContent;
    panels.set(filePath, panel);

    panel.webview.postMessage({ type: "updateTheme", theme: config.readerTheme });
    panel.webview.postMessage({ type: "updateFontSize", size: config.readerFontSize });

    vscode.workspace.onDidChangeConfiguration((e) => {
      const p = panels.get(filePath);
      if (!p) return;
      if (e.affectsConfiguration("codeReader.readerTheme")) {
        p.webview.postMessage({ type: "updateTheme", theme: getConfig().readerTheme });
      }
      if (e.affectsConfiguration("codeReader.readerFontSize")) {
        p.webview.postMessage({ type: "updateFontSize", size: getConfig().readerFontSize });
      }
    });
  }

  panel.title = `Reader: ${fileName}`;
  panel.reveal(panel.viewColumn);
  panel.webview.postMessage({ type: "loadFile", filePath, result: parseResult, scrollToLine });
}