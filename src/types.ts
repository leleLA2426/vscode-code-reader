/** 语法高亮 Token */
export interface Token {
  startByte: number;
  endByte: number;
  line: number;
  type: string; // "keyword" | "string" | "comment" | "function" | "number" | "text"
}

/** 符号节点 */
export interface SymbolNode {
  name: string;
  kind: string; // "function" | "class" | "method" | "variable" | "interface"
  startLine: number;
  endLine: number;
  children: SymbolNode[];
}

/** 折叠范围 */
export interface FoldRange {
  startLine: number;
  endLine: number;
}

/** C++ 解析器返回结果 */
export interface ParseResult {
  content: string;
  tokens: Token[];
  symbols: SymbolNode[];
  folds: FoldRange[];
}

/** 阅读主题 */
export type ReaderTheme = "light" | "sepia" | "dark";
