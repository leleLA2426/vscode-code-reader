import * as vscode from 'vscode';
import { WEBVIEW_TYPES } from '../constants';
import { CodeExplainer } from '../ai/codeExplainer';

export class ExplainerPanel {
  private panel: vscode.WebviewPanel | undefined;
  private disposables: vscode.Disposable[] = [];
  private initialized = false;

  constructor(
    private context: vscode.ExtensionContext,
    private explainer: CodeExplainer,
  ) {}

  show(model?: string): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        WEBVIEW_TYPES.EXPLAINER,
        'AI Code Explainer',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview'),
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles'),
          ],
        },
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
        this.initialized = false;
      }, null, this.disposables);

      this.panel.webview.onDidReceiveMessage((msg) => {
        switch (msg.type) {
          case 'cancelExplain':
            this.explainer.cancel();
            break;
        }
      }, null, this.disposables);
    }

    this.panel.title = model ? `AI: ${model}` : 'AI Explainer';

    // Only set HTML on first creation; subsequent calls use postMessage
    if (!this.initialized) {
      this.initialized = true;
      const explainerJsUri = this.panel.webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'explainer.js'),
      );
      const explainerCssUri = this.panel.webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles', 'explainer.css'),
      );

      this.panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${explainerCssUri}">
  <title>AI Code Explainer</title>
</head>
<body>
  <div class="explainer-container">
    <div class="mode-bar">
      <button class="mode-btn active" data-mode="line-by-line">Line by Line</button>
      <button class="mode-btn" data-mode="overview">Overview</button>
      <button class="mode-btn" data-mode="chat">Chat</button>
      <button class="cancel-btn hidden" id="cancelBtn">Stop</button>
    </div>
    <div class="messages" id="messages"></div>
    <div class="chat-input hidden" id="chatInput">
      <input type="text" id="questionInput" placeholder="Ask a follow-up question...">
      <button id="sendBtn">Send</button>
    </div>
  </div>
  <script src="${explainerJsUri}"></script>
</body>
</html>`;
    } else {
      // Clear previous messages for new explanation
      this.panel.webview.postMessage({ type: 'clearMessages' });
    }

    this.panel.reveal(vscode.ViewColumn.Beside);
  }

  appendChunk(chunk: string): void {
    this.panel?.webview.postMessage({ type: 'explanationChunk', chunk });
  }

  markDone(): void {
    this.panel?.webview.postMessage({ type: 'explanationDone' });
  }

  showError(error: string): void {
    this.panel?.webview.postMessage({ type: 'explanationError', error });
  }

  dispose(): void {
    this.panel?.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}