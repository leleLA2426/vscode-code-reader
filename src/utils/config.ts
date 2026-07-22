import * as vscode from "vscode";

/** 读取 VSCode 中 codeReader 配置项，带默认值 */
export function getConfig() {
  const cfg = vscode.workspace.getConfiguration("codeReader");
  return {
    readerFontSize: cfg.get<number>("readerFontSize", 16),
    readerTheme: cfg.get<string>("readerTheme", "sepia"),
    autoCollapseNodeModules: cfg.get<boolean>("autoCollapseNodeModules", true),
    maxFileSize: cfg.get<number>("maxFileSize", 5000),
  };
}
