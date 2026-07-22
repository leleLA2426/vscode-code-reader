export const EXTENSION_ID = "codeReader";
export const OLLAMA_DEFAULT_URL = "http://localhost:11434";

/** 文件扩展名 → VSCode 语言标识映射 */
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescriptreact",
  ".js": "javascript",
  ".jsx": "javascriptreact",
  ".py": "python",
  ".c": "c",
  ".cpp": "cpp",
  ".h": "c",
  ".hpp": "cpp",
};

/** 文件树中自动折叠的目录名 */
export const COLLAPSIBLE_DIRS = [
  "node_modules",
  ".git",
  "__pycache__",
  ".vscode",
  "dist",
  "build",
  ".next",
];
