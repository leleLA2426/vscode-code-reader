/** VS Code command IDs */
export const COMMANDS = {
  OPEN_READER: 'codeReader.openReader',
  EXPLAIN_SELECTION: 'codeReader.explainSelection',
  TOGGLE_FOCUS_MODE: 'codeReader.toggleFocusMode',
  ADD_BOOKMARK: 'codeReader.addBookmark',
  ADD_TO_READING_LIST: 'codeReader.addToReadingList',
  REMOVE_FROM_READING_LIST: 'codeReader.removeFromReadingList',
  SWITCH_MODEL: 'codeReader.switchModel',
  REFRESH_FILE_TREE: 'codeReader.refreshFileTree',
} as const;

/** VS Code view IDs */
export const VIEWS = {
  FILE_TREE: 'codeReader.fileTree',
  READING_LIST: 'codeReader.readingList',
  BOOKMARKS: 'codeReader.bookmarks',
} as const;

/** Configuration keys */
export const CONFIG = {
  SECTION: 'codeReader',
  OLLAMA_BASE_URL: 'ollamaBaseUrl',
  DEFAULT_MODEL: 'defaultModel',
  READER_FONT_SIZE: 'readerFontSize',
  READER_THEME: 'readerTheme',
  AUTO_COLLAPSE_NODE_MODULES: 'autoCollapseNodeModules',
  MAX_FILE_SIZE: 'maxFileSize',
} as const;

/** Webview view types */
export const WEBVIEW_TYPES = {
  READER: 'codeReader.readerPanel',
  EXPLAINER: 'codeReader.explainerPanel',
} as const;

/** Directories to exclude from file tree */
export const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '__pycache__',
  '.venv',
  'venv',
  '.cache',
  '.vscode-test',
  'coverage',
];

/** Default Ollama API endpoint */
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

/** AI explain modes */
export const EXPLAIN_MODES = ['line-by-line', 'overview', 'chat'] as const;
export type ExplainMode = (typeof EXPLAIN_MODES)[number];
