import * as vscode from 'vscode';
import { WEBVIEW_TYPES } from '../constants';
import { getConfig, updateConfig } from '../utils/config';
import { BookmarkService } from '../features/bookmarks';
import { ReadingHistory } from '../features/readingHistory';
import { SymbolProvider } from '../symbols/symbolProvider';
import { DependencyGraph } from '../symbols/dependencyGraph';
import type { Bookmark, ReaderTheme, SymbolNode } from '../types';

export class ReaderPanel {
  private panel: vscode.WebviewPanel | undefined;
  private currentDoc: vscode.TextDocument | undefined;
  private disposables: vscode.Disposable[] = [];
  private symbolProvider: SymbolProvider;
  private depGraph: DependencyGraph;

  constructor(
    private context: vscode.ExtensionContext,
    private bookmarkService: BookmarkService,
    private readingHistory: ReadingHistory,
  ) {
    this.symbolProvider = new SymbolProvider();
    this.depGraph = new DependencyGraph();
  }

  open(doc: vscode.TextDocument): void {
    this.currentDoc = doc;

    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        WEBVIEW_TYPES.READER,
        'Code Reader',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.context.extensionUri, 'media'),
            vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview'),
          ],
        },
      );

      this.panel.onDidDispose(
        () => { this.panel = undefined; },
        null, this.disposables,
      );

      this.panel.webview.onDidReceiveMessage(
        async (msg) => {
          switch (msg.type) {
            case 'addBookmark':
              this.bookmarkService.add({
                filePath: msg.filePath,
                line: msg.line,
                note: msg.note || '',
                createdAt: Date.now(),
              });
              break;

            case 'switchTheme':
              updateConfig('readerTheme', msg.theme);
              this.send({ type: 'updateTheme', theme: msg.theme });
              break;

            case 'changeFontSize':
              updateConfig('readerFontSize', msg.size);
              this.send({ type: 'updateFontSize', size: msg.size });
              break;

            case 'ready':
              this.loadCurrentFile();
              break;

            case 'requestSymbols':
              this.loadSymbols(msg.filePath);
              break;

            case 'requestReferences':
              await this.loadReferences(msg.line);
              break;
          }
        },
        null, this.disposables,
      );
    }

    this.panel.title = doc.fileName.split(/[/\\]/).pop() || doc.fileName;
    this.loadCurrentFile();
    this.panel.reveal(vscode.ViewColumn.Beside);
  }

  updateSelection(_selection: vscode.Selection): void {}

  refreshBookmarks(): void {
    if (!this.panel || !this.currentDoc) return;
    const bookmarks = this.bookmarkService.getByFile(this.currentDoc.uri.fsPath);
    this.send({ type: 'updateBookmarks', bookmarks });
  }

  dispose(): void {
    this.panel?.dispose();
    this.disposables.forEach((d) => d.dispose());
  }

  private send(msg: Record<string, unknown>): void {
    this.panel?.webview.postMessage(msg);
  }

  private async loadCurrentFile(): Promise<void> {
    if (!this.panel || !this.currentDoc) return;

    const doc = this.currentDoc;
    const theme = getConfig<string>('readerTheme') || 'sepia';
    const fontSize = getConfig<number>('readerFontSize') || 16;
    const bookmarks = this.bookmarkService.getByFile(doc.uri.fsPath);
    const symbolTree = await this.symbolProvider.getSymbols(doc);

    const html = this.buildHtml(doc, theme as ReaderTheme, fontSize, bookmarks, symbolTree.symbols);
    this.panel.webview.html = html;
  }

  private async loadSymbols(filePath: string): Promise<void> {
    if (!this.currentDoc || this.currentDoc.uri.fsPath !== filePath) return;
    const symbolTree = await this.symbolProvider.getSymbols(this.currentDoc);
    this.send({ type: 'updateSymbols', symbols: symbolTree.symbols });
  }

  private async loadReferences(line: number): Promise<void> {
    if (!this.currentDoc) return;
    const position = new vscode.Position(line, 0);
    const wordRange = this.currentDoc.getWordRangeAtPosition(position);
    if (!wordRange) {
      this.send({ type: 'updateReferences', symbolName: '', edges: [] });
      return;
    }

    const symbolName = this.currentDoc.getText(wordRange);
    const edges = await this.depGraph.findReferences(this.currentDoc, position);
    const info = await this.depGraph.getSymbolInfo(this.currentDoc, position);

    this.send({
      type: 'updateReferences',
      symbolName: info?.name || symbolName,
      edges,
      referenceCount: info?.references || 0,
      definition: info?.definition || '',
    });
  }

  private buildHtml(
    doc: vscode.TextDocument,
    theme: ReaderTheme,
    fontSize: number,
    bookmarks: Bookmark[],
    symbols: SymbolNode[],
  ): string {
    const content = doc.getText();
    const language = doc.languageId;
    const filePath = doc.uri.fsPath;
    const bookmarkLines = new Set(bookmarks.map((b) => b.line));
    const lines = content.split('\n');
    const foldRegions = this.detectFoldRegions(lines);

    const codeHtml = lines
      .map((line, i) => {
        const foldStart = foldRegions.has(i) ? ' data-fold-start="true"' : '';
        const indentClass = this.getIndentClass(line);
        return `<tr class="${bookmarkLines.has(i) ? 'bookmarked' : ''} ${indentClass}"
                    data-line="${i}"${foldStart}>
                  <td class="line-number">${i + 1}</td>
                  <td class="line-content"><code>${this.esc(line) || ' '}</code></td>
                </tr>`;
      })
      .join('\n');

    const outlineHtml = this.buildOutlineHtml(symbols);

    const readerJsUri = this.panel!.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'reader.js'),
    );
    const readerCssUri = this.panel!.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles', 'reader.css'),
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${readerCssUri}">
  <title>Code Reader</title>
  <style>
    :root { --reader-font-size: ${fontSize}px; }
  </style>
</head>
<body data-theme="${theme}" data-language="${language}" data-filepath="${filePath}">
  <div class="reader-toolbar">
    <div class="toolbar-left">
      <span class="file-name">${this.esc(doc.fileName.split(/[/\\]/).pop() || '')}</span>
      <span class="file-lang">${language}</span>
      <span class="file-lines">${lines.length} lines</span>
    </div>
    <div class="toolbar-right">
      <button class="toolbar-btn" data-action="decrease-font" title="Decrease font size">A-</button>
      <button class="toolbar-btn" data-action="increase-font" title="Increase font size">A+</button>
      <select class="theme-select" title="Reading theme">
        <option value="light" ${theme === 'light' ? 'selected' : ''}>Light</option>
        <option value="sepia" ${theme === 'sepia' ? 'selected' : ''}>Sepia</option>
        <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dark</option>
      </select>
      <button class="toolbar-btn" data-action="toggle-outline" title="Toggle outline">Menu</button>
    </div>
  </div>
  <div class="reader-body">
    <div class="reader-main">
      <table id="code-table">${codeHtml}</table>
    </div>
    <aside class="reader-outline" id="outline-panel">
      <div class="outline-header">Symbols</div>
      ${outlineHtml}
      <div class="outline-divider"></div>
      <div class="outline-header">References</div>
      <div class="refs-content" id="refs-content">
        <div class="refs-hint">Click a symbol name to see references</div>
      </div>
    </aside>
  </div>
  <script src="${readerJsUri}"></script>
</body>
</html>`;
  }

  private detectFoldRegions(lines: string[]): Set<number> {
    const folds = new Set<number>();
    for (let i = 0; i < lines.length - 1; i++) {
      const curr = lines[i].search(/\S/);
      const next = lines[i + 1].search(/\S/);
      if (curr >= 0 && next > curr) folds.add(i);
    }
    return folds;
  }

  private getIndentClass(line: string): string {
    const indent = line.search(/\S/);
    if (indent < 0) return 'indent-0';
    if (indent < 2) return 'indent-0';
    if (indent < 4) return 'indent-1';
    if (indent < 8) return 'indent-2';
    return 'indent-3';
  }

  private buildOutlineHtml(symbols: SymbolNode[]): string {
    if (symbols.length === 0) {
      return '<div class="outline-empty">No symbols found</div>';
    }
    return this.buildNodes(symbols);
  }

  private buildNodes(nodes: SymbolNode[], depth = 0): string {
    return nodes
      .map((node) => {
        const icon = this.symbolIcon(node.kind);
        const children = node.children.length > 0
          ? `<ul>${this.buildNodes(node.children, depth + 1)}</ul>`
          : '';
        return `<li class="outline-item depth-${depth}">
                  <a href="#" data-line="${node.range.startLine}"
                     title="${node.kind}: ${this.esc(node.name)}">
                    ${icon} ${this.esc(node.name)}
                  </a>
                  ${children}
                </li>`;
      })
      .join('');
  }

  private symbolIcon(kind: string): string {
    switch (kind) {
      case 'function': case 'method': return 'f';
      case 'class': return 'C';
      case 'interface': return 'I';
      case 'variable': return 'v';
      default: return '-';
    }
  }

  private esc(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}