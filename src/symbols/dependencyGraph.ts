import * as vscode from 'vscode';
import type { DependencyEdge, CodePosition } from '../types';

/**
 * A node in the dependency graph.
 */
export interface DepNode {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'method' | 'variable' | 'module' | 'file';
  filePath: string;
  line: number;
}

export interface DepGraph {
  /** The symbol we're analyzing */
  root: DepNode;
  /** Symbols that reference (call) the root */
  callers: DependencyEdge[];
  /** Symbols that the root references (calls) */
  callees: DependencyEdge[];
}

export class DependencyGraph {
  /**
   * Build a dependency graph around a symbol at the given position.
   */
  async buildGraph(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<DepGraph | null> {
    // Find the symbol at the position
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return null;

    const symbolName = document.getText(wordRange);

    // Try to get references (who calls this)
    const rawRefs = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeReferenceProvider',
      document.uri,
      position,
    );

    const callers: DependencyEdge[] = (rawRefs || [])
      .filter((ref) => !(ref.uri.fsPath === document.uri.fsPath && ref.range.start.isEqual(position)))
      .map((ref) => ({
        from: this.extractSymbolAt(document, ref) || 'unknown',
        to: symbolName,
        filePath: ref.uri.fsPath,
        line: ref.range.start.line,
      }));

    // Try to find the definition (for callee analysis, we do basic symbol collection)
    const callees: DependencyEdge[] = await this.findCallees(document, symbolName);

    return {
      root: {
        name: symbolName,
        kind: 'function',
        filePath: document.uri.fsPath,
        line: position.line,
      },
      callers,
      callees,
    };
  }

  /**
   * Find all references to a symbol (used from explainer panel).
   */
  async findReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<DependencyEdge[]> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return [];

    const symbolName = document.getText(wordRange);
    const rawRefs = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeReferenceProvider',
      document.uri,
      position,
    );

    return (rawRefs || []).map((ref) => ({
      from: ref.uri.fsPath.split(/[/\\]/).pop() || 'unknown',
      to: symbolName,
      filePath: ref.uri.fsPath,
      line: ref.range.start.line,
    }));
  }

  /**
   * Find the definition of a symbol.
   */
  async findDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Location[] | null> {
    return vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeDefinitionProvider',
      document.uri,
      position,
    );
  }

  /**
   * Get the full dependency info for the outline panel.
   */
  async getSymbolInfo(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<{ name: string; references: number; definition?: string } | null> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return null;

    const name = document.getText(wordRange);

    // Get reference count
    const refs = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeReferenceProvider',
      document.uri,
      position,
    );

    // Get definition location
    const defs = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeDefinitionProvider',
      document.uri,
      position,
    );

    return {
      name,
      references: (refs || []).length,
      definition: defs && defs.length > 0
        ? `${defs[0].uri.fsPath.split(/[/\\]/).pop()}:${defs[0].range.start.line + 1}`
        : undefined,
    };
  }

  // ---- Private helpers ----

  private extractSymbolAt(
    document: vscode.TextDocument,
    location: vscode.Location,
  ): string | undefined {
    // Try to get the enclosing function/symbol name
    const line = document.lineAt(location.range.start.line);
    const text = line.text;

    // Look for function/class/method declarations on or near this line
    const match = text.match(
      /(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/,
    );
    if (match) return match[1];

    return document.fileName.split(/[/\\]/).pop();
  }

  private async findCallees(
    _document: vscode.TextDocument,
    _symbolName: string,
  ): Promise<DependencyEdge[]> {
    // Full callee analysis requires parsing the function body.
    // For a lightweight approach, we use the document symbols
    // and match called identifiers. This is a best-effort approach.
    // A deeper analysis would use the TypeScript compiler API.
    return [];
  }
}