import type { ExplainMode } from './constants';

// ============================================================
// Symbols
// ============================================================

/** A symbol node in the code outline */
export interface SymbolNode {
  name: string;
  kind: SymbolKind;
  range: CodeRange;
  children: SymbolNode[];
}

export type SymbolKind = 'function' | 'class' | 'interface' | 'method' | 'variable' | 'module';

export interface CodeRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface CodePosition {
  line: number;
  column: number;
}

// ============================================================
// AI / Explain
// ============================================================

/** Context passed to the AI for better explanation */
export interface CodeContext {
  fileName: string;
  functionName?: string;
  language: string;
  filePath: string;
  imports?: string[];
}

/** Parameters for a code explanation request */
export interface ExplainRequest {
  code: string;
  mode: ExplainMode;
  context: CodeContext;
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

/** An Ollama model entry */
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

// ============================================================
// Bookmarks
// ============================================================

export interface Bookmark {
  filePath: string;
  line: number;
  note: string;
  createdAt: number;
}

// ============================================================
// Reading History
// ============================================================

export interface ReadingEntry {
  filePath: string;
  lastOpened: number;
  openCount: number;
}

// ============================================================
// Webview Messages (Extension ↔ Webview)
// ============================================================

// Extension → Reader Webview
export type ToReaderMessage =
  | { type: 'loadFile'; filePath: string; content: string; language: string }
  | { type: 'updateTheme'; theme: ReaderTheme }
  | { type: 'updateFontSize'; size: number }
  | { type: 'updateSymbols'; symbols: SymbolNode[] }
  | { type: 'updateBookmarks'; bookmarks: Bookmark[] };

// Reader Webview → Extension
export type FromReaderMessage =
  | { type: 'selection'; text: string; startLine: number; endLine: number; filePath: string }
  | { type: 'addBookmark'; line: number; note?: string; filePath: string }
  | { type: 'requestSymbols'; filePath: string }
  | { type: 'ready' };

// Extension → Explainer Webview
export type ToExplainerMessage =
  | { type: 'explanationStart'; mode: ExplainMode }
  | { type: 'explanationChunk'; chunk: string }
  | { type: 'explanationDone'; fullText: string }
  | { type: 'explanationError'; error: string }
  | { type: 'contextUpdate'; fileName: string; functionName: string };

// Explainer Webview → Extension
export type FromExplainerMessage =
  | { type: 'askQuestion'; question: string }
  | { type: 'requestExplain'; code: string; mode: ExplainMode; filePath: string }
  | { type: 'cancelExplain' }
  | { type: 'ready' };

export type ReaderTheme = 'light' | 'sepia' | 'dark';

// ============================================================
// AI Service Interface
// ============================================================

export interface IAIService {
  checkHealth(): Promise<boolean>;
  listModels(): Promise<string[]>;
  explainCode(
    code: string,
    mode: ExplainMode,
    context: CodeContext,
    onChunk: (text: string) => void,
    signal: AbortSignal,
  ): Promise<string>;
}

// ============================================================
// Bookmarks Service Interface
// ============================================================

export interface IBookmarkService {
  add(bookmark: Bookmark): void;
  remove(filePath: string, line: number): void;
  getAll(): Bookmark[];
  getByFile(filePath: string): Bookmark[];
}

// ============================================================
// Reading History Service Interface
// ============================================================

export interface IReadingHistory {
  add(filePath: string): void;
  getAll(): ReadingEntry[];
  getRecent(limit?: number): ReadingEntry[];
}

// ============================================================
// Dependency Graph
// ============================================================

export interface DependencyEdge {
  from: string; // caller name
  to: string; // callee name
  filePath: string;
}
