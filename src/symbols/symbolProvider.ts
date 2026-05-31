import * as vscode from 'vscode';
import type { SymbolNode, CodePosition } from '../types';

export interface SymbolTree {
  symbols: SymbolNode[];
  findSymbolAtPosition(pos: CodePosition): SymbolNode | undefined;
}

export class SymbolProvider {
  private cache = new Map<string, SymbolTree>();

  async getSymbols(doc: vscode.TextDocument): Promise<SymbolTree> {
    const key = doc.uri.fsPath;

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
      'vscode.executeDocumentSymbolProvider',
      doc.uri,
    );

    const nodes = this.convert(symbols || []);
    const tree: SymbolTree = {
      symbols: nodes,
      findSymbolAtPosition(pos: CodePosition) {
        return this.findSymbol(nodes, pos);
      },
      findSymbol(nodes: SymbolNode[], pos: CodePosition): SymbolNode | undefined {
        for (const node of nodes) {
          if (
            pos.line >= node.range.startLine &&
            pos.line <= node.range.endLine
          ) {
            // Check children first (more specific)
            const child = this.findSymbol(node.children, pos);
            return child || node;
          }
        }
        return undefined;
      },
    };

    this.cache.set(key, tree);
    return tree;
  }

  invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  private convert(symbols: vscode.SymbolInformation[]): SymbolNode[] {
    return symbols.map((s) => ({
      name: s.name,
      kind: this.mapKind(s.kind),
      range: {
        startLine: s.location.range.start.line,
        startColumn: s.location.range.start.character,
        endLine: s.location.range.end.line,
        endColumn: s.location.range.end.character,
      },
      children: [],
    }));
  }

  private mapKind(kind: vscode.SymbolKind): SymbolNode['kind'] {
    switch (kind) {
      case vscode.SymbolKind.Function:
      case vscode.SymbolKind.Method:
        return 'function';
      case vscode.SymbolKind.Class:
        return 'class';
      case vscode.SymbolKind.Interface:
        return 'interface';
      case vscode.SymbolKind.Variable:
        return 'variable';
      default:
        return 'module';
    }
  }
}
