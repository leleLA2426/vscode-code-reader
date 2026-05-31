import * as vscode from 'vscode';

export function createDimDecoration(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    opacity: '0.3',
  });
}

export function createHighlightDecoration(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 255, 0, 0.2)',
    isWholeLine: true,
  });
}

export function createBookmarkDecoration(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    gutterIconPath: new vscode.ThemeIcon('bookmark'),
    gutterIconSize: 'contain',
  });
}
