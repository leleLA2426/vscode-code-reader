import * as vscode from "vscode";
import { SymbolNode } from "../types";

/** Tree item for a single symbol node */
class SymbolItem extends vscode.TreeItem {
  constructor(
    public readonly symbol: SymbolNode,
    collapsible: vscode.TreeItemCollapsibleState
  ) {
    super(symbol.name, collapsible);
    this.description = symbol.kind;
    this.tooltip = `${symbol.kind} ${symbol.name} (line ${symbol.startLine + 1})`;
    this.command = {
      command: "codeReader.openReader",
      title: "Go to Symbol",
      arguments: [""], // placeholder, overridden below
    };
    // Assign icon based on kind
    switch (symbol.kind) {
      case "function": case "method":
        this.iconPath = new vscode.ThemeIcon("symbol-method"); break;
      case "class":
        this.iconPath = new vscode.ThemeIcon("symbol-class"); break;
      case "variable":
        this.iconPath = new vscode.ThemeIcon("symbol-variable"); break;
      case "interface":
        this.iconPath = new vscode.ThemeIcon("symbol-interface"); break;
      default:
        this.iconPath = new vscode.ThemeIcon("symbol-misc"); break;
    }
  }
}

export class SymbolTreeProvider implements vscode.TreeDataProvider<SymbolItem> {
  private _onDidChange = new vscode.EventEmitter<SymbolItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private symbols: SymbolNode[] = [];

  update(symbols: SymbolNode[]): void {
    this.symbols = symbols;
    this._onDidChange.fire(undefined);
  }

  getTreeItem(element: SymbolItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SymbolItem): SymbolItem[] {
    if (!element) {
      // Root level: top-level symbols
      return this.symbols.map((s) => {
        const collapsible = s.children.length > 0
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.None;
        return new SymbolItem(s, collapsible);
      });
    }
    // Nested: children of a symbol
    return element.symbol.children.map((child) => {
      const collapsible = child.children.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None;
      return new SymbolItem(child, collapsible);
    });
  }
}