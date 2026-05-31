import * as vscode from 'vscode';

export class FocusMode {
  private enabled = false;
  private decoration: vscode.TextEditorDecorationType | undefined;

  toggle(): void {
    this.enabled = !this.enabled;

    if (this.enabled) {
      this.enable();
      vscode.window.showInformationMessage('Focus Mode: ON');
    } else {
      this.disable();
      vscode.window.showInformationMessage('Focus Mode: OFF');
    }
  }

  private enable(): void {
    this.decoration = vscode.window.createTextEditorDecorationType({
      opacity: '0.3',
    });

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      this.applyDim(editor);
    }
  }

  private disable(): void {
    if (this.decoration) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.setDecorations(this.decoration, []);
      }
      this.decoration.dispose();
      this.decoration = undefined;
    }
  }

  private applyDim(editor: vscode.TextEditor): void {
    if (!this.decoration || !this.enabled) return;

    // Dim everything except the selection
    const fullRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
    const ranges = [fullRange];

    // TODO: exclude selection range from dimming
    editor.setDecorations(this.decoration, ranges);
  }

  dispose(): void {
    this.disable();
  }
}
