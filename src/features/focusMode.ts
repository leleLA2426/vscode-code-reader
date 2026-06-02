import * as vscode from 'vscode';

export class FocusMode {
  private enabled = false;
  private decoration: vscode.TextEditorDecorationType | undefined;
  private changeListener: vscode.Disposable | undefined;

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
    if (editor) this.applyDim(editor);

    // Track selection changes to update dim ranges
    this.changeListener = vscode.window.onDidChangeTextEditorSelection((e) => {
      if (this.enabled) this.applyDim(e.textEditor);
    });
  }

  private disable(): void {
    if (this.decoration) {
      const editor = vscode.window.activeTextEditor;
      if (editor) editor.setDecorations(this.decoration, []);
      this.decoration.dispose();
      this.decoration = undefined;
    }
    if (this.changeListener) {
      this.changeListener.dispose();
      this.changeListener = undefined;
    }
  }

  private applyDim(editor: vscode.TextEditor): void {
    if (!this.decoration || !this.enabled) return;

    const totalLines = editor.document.lineCount;
    const dimRanges: vscode.Range[] = [];

    // Dim everything except the selected lines
    const selStart = editor.selection.start.line;
    const selEnd = editor.selection.end.line;

    if (selStart > 0) {
      dimRanges.push(new vscode.Range(0, 0, selStart, 0));
    }
    if (selEnd < totalLines - 1) {
      dimRanges.push(new vscode.Range(selEnd + 1, 0, totalLines, 0));
    }

    editor.setDecorations(this.decoration, dimRanges);
  }

  dispose(): void {
    this.disable();
  }
}