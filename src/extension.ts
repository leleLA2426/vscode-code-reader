import * as vscode from 'vscode';
import { COMMANDS, VIEWS, CONFIG } from './constants';
import { FileTreeProvider } from './treeview/fileTreeProvider';
import { ReadingListProvider } from './treeview/readingListProvider';
import { ReaderPanel } from './reader/readerPanel';
import { SymbolProvider } from './symbols/symbolProvider';
import { OllamaClient } from './ai/ollamaClient';
import { ModelManager } from './ai/modelManager';
import { CodeExplainer } from './ai/codeExplainer';
import { ExplainerPanel } from './explainer/explainerPanel';
import { BookmarkService } from './features/bookmarks';
import { BookmarkTreeProvider } from './treeview/bookmarkTreeProvider';
import { ReadingHistory } from './features/readingHistory';
import { FocusMode } from './features/focusMode';
import { getConfig } from './utils/config';

// ---- Singleton instances ----
let readerPanel: ReaderPanel;
let explainerPanel: ExplainerPanel;
let ollamaClient: OllamaClient;
let modelManager: ModelManager;
let codeExplainer: CodeExplainer;
let bookmarkService: BookmarkService;
let readingHistory: ReadingHistory;
let focusMode: FocusMode;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Code Reader activated');

  // ---- Init services ----
  ollamaClient = new OllamaClient(
    getConfig<string>(CONFIG.OLLAMA_BASE_URL),
    getConfig<string>(CONFIG.DEFAULT_MODEL),
  );
  modelManager = new ModelManager(ollamaClient);
  codeExplainer = new CodeExplainer(ollamaClient);
  bookmarkService = new BookmarkService(context);
  readingHistory = new ReadingHistory(context);
  focusMode = new FocusMode();

  // ---- Status bar ----
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = COMMANDS.SWITCH_MODEL;
  context.subscriptions.push(statusBarItem);
  updateStatusBar('$(sync~spin) Checking Ollama...');

  // ---- TreeViews ----
  const fileTreeProvider = new FileTreeProvider();
  const readingListProvider = new ReadingListProvider(context);
  const bookmarkTreeProvider = new BookmarkTreeProvider(bookmarkService);

  context.subscriptions.push(
    vscode.window.createTreeView(VIEWS.FILE_TREE, {
      treeDataProvider: fileTreeProvider,
      showCollapseAll: true,
    }),
    vscode.window.createTreeView(VIEWS.READING_LIST, {
      treeDataProvider: readingListProvider,
      canSelectMany: false,
    }),
    vscode.window.createTreeView(VIEWS.BOOKMARKS, { treeDataProvider: bookmarkTreeProvider, canSelectMany: false }),
  );

  // ---- Panels ----
  readerPanel = new ReaderPanel(context, bookmarkService, readingHistory);
  explainerPanel = new ExplainerPanel(context, codeExplainer);

  const symbolProvider = new SymbolProvider();

  // ========================================================
  // Commands
  // ========================================================

  context.subscriptions.push(
    // Open the reader panel for current file
    vscode.commands.registerCommand(COMMANDS.OPEN_READER, () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        readerPanel.open(editor.document);
        readingHistory.add(editor.document.uri.fsPath);
      }
    }),

    // Explain selected code
    vscode.commands.registerCommand(COMMANDS.EXPLAIN_SELECTION, async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selection.isEmpty) {
        vscode.window.showWarningMessage('Select some code first, then press Ctrl+Shift+E');
        return;
      }

      // Ensure model is ready
      const ready = await modelManager.ensureModel();
      if (!ready) return;

      const text = editor.document.getText(editor.selection);
      const fileName = editor.document.fileName.split(/[/\\]/).pop() || '';
      const model = modelManager.getCurrentModel();

      // Find enclosing function
      const symbols = await symbolProvider.getSymbols(editor.document);
      const funcName = symbols.findSymbolAtPosition({
        line: editor.selection.start.line,
        column: editor.selection.start.character,
      })?.name;

      explainerPanel.show(model);
      updateStatusBar(`$(loading~spin) Explaining...`);

      await codeExplainer.explain({
        code: text,
        mode: 'line-by-line',
        context: {
          fileName,
          functionName: funcName,
          language: editor.document.languageId,
          filePath: editor.document.uri.fsPath,
        },
        onChunk: (chunk) => explainerPanel.appendChunk(chunk),
        onDone: () => {
          explainerPanel.markDone();
          updateStatusBar();
        },
        onError: (error) => {
          explainerPanel.showError(error);
          updateStatusBar(`$(error) AI Error`);
        },
      });
    }),

    // Explain entire file
    vscode.commands.registerCommand('codeReader.explainFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const ready = await modelManager.ensureModel();
      if (!ready) return;

      const text = editor.document.getText();
      const fileName = editor.document.fileName.split(/[/\\]/).pop() || '';
      const model = modelManager.getCurrentModel();

      explainerPanel.show(model);
      updateStatusBar(`$(loading~spin) Explaining file...`);

      await codeExplainer.explain({
        code: text,
        mode: 'overview',
        context: {
          fileName,
          language: editor.document.languageId,
          filePath: editor.document.uri.fsPath,
        },
        onChunk: (chunk) => explainerPanel.appendChunk(chunk),
        onDone: () => {
          explainerPanel.markDone();
          updateStatusBar();
        },
        onError: (error) => {
          explainerPanel.showError(error);
          updateStatusBar(`$(error) AI Error`);
        },
      });
    }),

    // Toggle focus mode
    vscode.commands.registerCommand(COMMANDS.TOGGLE_FOCUS_MODE, () => focusMode.toggle()),

    // Bookmark
    vscode.commands.registerCommand(COMMANDS.ADD_BOOKMARK, () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        bookmarkService.add({
          filePath: editor.document.uri.fsPath,
          line: editor.selection.active.line,
          note: '',
          createdAt: Date.now(),
        });
        bookmarkTreeProvider.refresh();        readerPanel.refreshBookmarks();
        vscode.window.showInformationMessage('Bookmark added');
      }
    }),

    // Reading list
    vscode.commands.registerCommand(COMMANDS.ADD_TO_READING_LIST, (uri?: vscode.Uri) => {
      const target = uri || vscode.window.activeTextEditor?.document.uri;
      if (target) readingListProvider.add(target);
    }),
    vscode.commands.registerCommand(COMMANDS.REMOVE_FROM_READING_LIST, (item: vscode.TreeItem) => {
      if (item.resourceUri) readingListProvider.remove(item.resourceUri);
    }),

    // Switch AI model
    vscode.commands.registerCommand(COMMANDS.SWITCH_MODEL, async () => {
      const models = await modelManager.listModels();
      if (models.length === 0) {
        const pull = await vscode.window.showWarningMessage(
          'No Ollama models found.',
          'Pull a model',
          'Dismiss',
        );
        if (pull === 'Pull a model') {
          modelManager.ensureModel();
        }
        return;
      }

      const selected = await vscode.window.showQuickPick(models, {
        placeHolder: `Current: ${modelManager.getCurrentModel()}`,
      });
      if (selected) {
        await modelManager.setModel(selected);
        updateStatusBar();
        vscode.window.showInformationMessage(`Switched to ${selected}`);
      }
    }),

    // Refresh file tree
    vscode.commands.registerCommand(COMMANDS.REFRESH_FILE_TREE, () => fileTreeProvider.refresh()),
  );

  // ========================================================
  // Event listeners
  // ========================================================

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((e) => {
      if (e.textEditor === vscode.window.activeTextEditor) {
        readerPanel.updateSelection(e.selections[0]);
      }
    }),
  );

  // ========================================================
  // Startup: check Ollama health
  // ========================================================

  modelManager.checkHealthWithRetry().then(async (healthy) => {
    if (healthy) {
      await modelManager.ensureModel();
      updateStatusBar();
    } else {
      updateStatusBar('$(warning) Ollama Offline');
    }
  });
}

export function deactivate() {
  readerPanel?.dispose();
  explainerPanel?.dispose();
  focusMode?.dispose();
  codeExplainer?.cancel();
  ollamaClient?.dispose();
  statusBarItem?.dispose();
}

function updateStatusBar(text?: string): void {
  if (text) {
    statusBarItem.text = text;
    statusBarItem.show();
    return;
  }
  const model = modelManager?.getCurrentModel() || 'codellama:7b';
  const busy = codeExplainer?.isBusy;
  statusBarItem.text = busy ? `$(loading~spin) ${model}` : `$(hubot) ${model}`;
  statusBarItem.tooltip = busy ? 'AI is working... Click to cancel' : `Model: ${model} 闂?Click to switch`;
  statusBarItem.show();
}