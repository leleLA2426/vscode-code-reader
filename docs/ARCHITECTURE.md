# ARCHITECTURE - Code Reader 架构设计文档

## 总体架构

```
┌─────────────────────────────────────────────┐
│              VSCode Extension (TypeScript)    │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Commands │ │  Views   │ │  Webviews   │  │
│  │ & Menus  │ │(TreeView) │ │(Reader/Exp) │  │
│  └────┬─────┘ └────┬─────┘ └──────┬──────┘  │
│       │             │              │         │
│  ┌────┴─────────────┴──────────────┴──────┐  │
│  │          Extension Core (TS)           │  │
│  │   N-API Bridge / Message Dispatch      │  │
│  └────────────────┬───────────────────────┘  │
└───────────────────┼──────────────────────────┘
                    │ N-API (C++ addon)
┌───────────────────┼──────────────────────────┐
│         C++ Native Addon (code-reader-core)   │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Parser  │ │  Search  │ │ Ollama Client│  │
│  │ (tree-  │ │  Engine  │ │   (libcurl)  │  │
│  │ sitter) │ │          │ │              │  │
│  └────┬────┘ └────┬─────┘ └──────┬───────┘  │
│       │            │              │          │
│  ┌────┴────────────┴──────────────┴───────┐  │
│  │          Persistence (SQLite)          │  │
│  │   bookmarks / history / annotations    │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │           Export (Markdown / PDF)       │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## 分层职责

### TypeScript 层（扩展宿主）

VSCode 扩展的入口层，负责所有 VSCode API 交互，本身不处理计算密集逻辑。

| 模块 | 职责 |
|------|------|
| **extension.ts** | 扩展激活/停用，命令注册，生命周期管理 |
| **bridge/nativeBridge.ts** | N-API 封装层，导出 C++ 函数为 Promise 接口，统一错误转换 |
| **panels/readerPanel.ts** | 阅读面板，创建和管理 reader Webview |
| **panels/explainerPanel.ts** | AI 解释面板，创建和管理 explainer Webview |
| **treeviews/fileTreeProvider.ts** | 项目文件树 TreeView Provider |
| **treeviews/bookmarkTreeProvider.ts** | 书签列表 TreeView Provider |
| **treeviews/readingListProvider.ts** | 阅读列表 TreeView Provider |
| **treeviews/symbolTreeProvider.ts** | 符号列表 TreeView Provider |
| **features/focusMode.ts** | 专注模式切换逻辑 |
| **features/decorations.ts** | 编辑器装饰（书签标记等） |
| **utils/config.ts** | VSCode 配置读取 |
| **utils/fileUtils.ts** | 文件操作工具 |

### C++ Native Addon 层（核心引擎）

通过 N-API 导出为 Node.js 原生模块，承担所有 CPU 密集型工作。

#### parser 模块
- **职责**：基于 tree-sitter 解析代码
- **输入**：文件路径 / 代码字符串 + 语言标识
- **输出**：语法高亮 token 列表、符号树、折叠范围、定义-引用关系、调用图
- **依赖**：tree-sitter + 各语言 grammar
- **接口**：
  - `parseFile(path) -> ParseResult { tokens, symbols, foldRanges }`
  - `getSymbols(path) -> SymbolNode[]`
  - `getCallGraph(path) -> CallEdge[]`
  - `findDefinition(path, line, col) -> Location`
  - `findReferences(symbol, path) -> Location[]`

#### search 模块
- **职责**：全项目文件索引和内容搜索
- **接口**：
  - `searchFiles(pattern) -> string[]`
  - `searchContent(pattern, isRegex) -> SearchResult[]`
  - `searchSymbols(name) -> SymbolMatch[]`

#### ollama 模块
- **职责**：libcurl 封装的 Ollama HTTP REST 客户端
- **接口**：
  - `checkHealth() -> bool`
  - `listModels() -> ModelInfo[]`
  - `chat(model, messages, onChunk, signal) -> string`
- **错误处理**：连接超时（默认 5s）、请求超时、指数退避重试（最多 3 次）

#### prompt 模块
- **职责**：构建发给 LLM 的提示词
- **接口**：
  - `buildExplainPrompt(code, context) -> string`
  - `buildSummaryPrompt(code, context) -> string`
  - `buildQuestionAnswerPrompt(code, question, context) -> string`

#### persistence 模块
- **职责**：SQLite 持久化存储
- **表设计**：
  - `bookmarks` (id, file_path, line, note, created_at)
  - `reading_history` (id, file_path, last_opened, open_count)
  - `reading_list` (id, file_path, added_at, read)
  - `annotations` (id, file_path, start_line, end_line, note, created_at)
- **接口**：CRUD 操作，所有方法以 `Result<T>` 返回

#### export 模块
- **职责**：代码片段导出
- **接口**：
  - `exportMarkdown(code, language, notes) -> string`
  - `exportPDF(code, language, notes, outputPath) -> string`
- **依赖**：libharu（PDF 生成）、内建 Markdown 构造

### Webview 层（浏览器渲染）

每个面板是一个独立的 HTML 页面，通过 `vscode.postMessage` 与 TS 层通信。

- **reader.html/ts**：代码阅读主界面，负责渲染语法高亮、符号导航、折叠交互
- **explainer.html/ts**：AI 对话界面，流式显示回答，支持追问输入

## 数据流

```
用户操作
  │
  ├─ [打开文件]
  │   TS: ReaderPanel.open(filePath)
  │     -> C++: parseFile(filePath)
  │     <- TS: 接收 ParseResult -> 注入 Webview
  │     -> C++: database.addHistory(filePath)
  │
  ├─ [选中代码->解释]
  │   Webview -> TS -> Bridge
  │     -> C++: buildExplainPrompt(code, context)
  │     -> C++: ollamaClient.chat(model, prompt, onChunk, signal)
  │     -> TS: 逐块推送到 Explainer Webview
  │
  ├─ [搜索]
  │   TS: vscode.window.showInputBox -> C++: searchContent(pattern)
  │   <- TS: 结果列表 -> QuickPick 或自定义 TreeView
  │
  ├─ [书签]
  │   TS -> C++: database.addBookmark(...)
  │   <- TS: 刷新 BookmarkTreeProvider
  │
  └─ [导出]
      TS -> C++: exporter.exportMarkdown/PDF(...)
      <- TS: 获取内容/路径 -> vscode.workspace.openTextDocument
```

## N-API 通信规范

- **异步**：所有 C++ 函数包装为 `Napi::AsyncWorker`，TS 侧通过 Promise 调用，不阻塞 UI 线程
- **线程安全**：SQLite 写入使用互斥锁；tree-sitter 解析为只读操作，可并发
- **错误传递**：C++ 层抛出 `Napi::Error`，包含结构化错误码；TS 侧统一 catch 后映射为用户提示
- **内存管理**：使用 `Napi::Buffer` 传递大块数据（文件内容），避免多次拷贝

## 依赖库

### C++ 三方库

| 库 | 版本 | 用途 |
|-----|------|------|
| tree-sitter | 0.22+ | 代码语法解析 |
| libcurl | 8.x | Ollama HTTP 通信 |
| SQLite3 | 3.45+ | 数据持久化 |
| nlohmann/json | 3.11+ | JSON 序列化/反序列化 |
| libharu | 2.4+ | PDF 生成 |
| Google Test | 1.14+ | C++ 单元测试 |

### TypeScript 依赖

| 包 | 用途 |
|-----|------|
| @types/vscode | VSCode API 类型 |
| node-addon-api | N-API C++ 封装 |
| esbuild | TS 打包 |
| node-gyp | C++ addon 编译 |
| jest / @vscode/test-electron | 测试 |
