# v0.2.0 基础阅读面板 + 文件浏览 — 实现计划

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 VSCode 扩展 + C++ native addon 的项目骨架，实现基础阅读面板和文件浏览功能。

**Architecture:** TS 层注册扩展入口、命令、侧边栏视图；C++ 层实现 tree-sitter 语法解析（高亮、折叠、符号）；两者通过 N-API 桥接；Webview 渲染代码阅读界面。

**Tech Stack:** TypeScript + VSCode API, C++17 + N-API + tree-sitter, esbuild + node-gyp

---

## Task 1: 项目基础配置

**目标:** 搭建完整的 Node.js / VSCode 扩展项目骨架，确保 `npm install` 后扩展即可加载。

- [ ] **1-1** — 创建 `package.json`：包含扩展元信息、`main` 入口、`contributes`（侧边栏容器 + 视图 + 命令 + 快捷键 + 配置项）、`activationEvents`、构建与测试脚本、`@types/vscode` / `esbuild` / `typescript` / `node-addon-api` 依赖。

- [ ] **1-2** — 创建 `tsconfig.json`：target ES2020、module commonjs、strict 模式、rootDir=src、outDir=out。

- [ ] **1-3** — 创建 `esbuild.config.cjs`：入口 `src/extension.ts`，输出 `dist/`，external=vscode，支持 `--production`（压缩）和 `--watch`（监听）。

- [ ] **1-4** — 创建 `.gitignore`：排除 `node_modules/`、`dist/`、`out/`、`*.vsix`、`build/`、`native/build/`、`native/deps/`、`.vscode-test/`。

- [ ] **1-5** — 创建 `.vscodeignore`：打包时排除 `.vscode/`、`node_modules/`、`native/`、`src/`、`tsconfig.json`、`esbuild.config.cjs`、`.gitignore`、`docs/`、`test/`。

- [ ] **1-6** — 创建 `.vscode/launch.json`：调试配置，"Run Extension" 用 `extensionHost` 启动当前工作区。

- [ ] **1-7** — 创建 `.vscode/tasks.json`：构建任务，`build:ts` 为默认构建，`build:native` 为附加构建任务。

- [ ] **1-8** — 创建 `media/icon.svg`：书本图标，24x24 viewBox，stroke 风格。

- [ ] **1-9** — 执行 `npm install`，确认无报错，`node_modules/` 正常生成。

---

## Task 2: C++ Native Addon 骨架

**目标:** 搭建 C++ N-API 原生模块的编译框架和数据模型，占位实现确保能成功编译出 `.node` 文件。

- [ ] **2-1** — 创建 `binding.gyp`：target_name=`code-reader-native`，源文件包含 `addon.cpp`、`parser/` 下三个 cpp，include_dirs 引用 `node-addon-api` 和 `native/src`，Windows 下 MSVC 启用 `/std:c++17`。

- [ ] **2-2** — 创建 `native/CMakeLists.txt`：最小 CMake 配置，用于 IDE 代码提示（不参与 node-gyp 构建）。

- [ ] **2-3** — 创建 `native/src/addon.cpp`：N-API 模块入口，`Napi::Object Init()` 中调用 `Parser::Register` 将 C++ 导出给 Node.js，`NODE_API_MODULE` 宏注册。

- [ ] **2-4** — 创建 `native/src/parser/parser.h`：定义数据类型（`Token`、`SymbolNode`、`FoldRange`、`ParseResult`）和 `Parser` 类接口（`parse()` 方法 + `Register` 静态方法），使用 `std::unique_ptr` 管理 PImpl。

- [ ] **2-5** — 创建 `native/src/parser/parser.cpp`：占位实现——构造函数初始化 Impl，`parse()` 仅返回 content 不含解析数据，`Register()` 尚未导出函数。

- [ ] **2-6** — 创建 `native/src/parser/symbolExtractor.h` + `.cpp`：空壳，`extract()` 返回空 vector。

- [ ] **2-7** — 创建 `native/src/parser/foldingProvider.h` + `.cpp`：空壳，`compute()` 返回空 vector。

- [ ] **2-8** — 执行 `node-gyp rebuild --debug`，确认编译成功，生成 `build/Release/code-reader-native.node`。

---

## Task 3: 集成 tree-sitter

**目标:** 将 tree-sitter 编译进 native addon，实现真正的代码解析——语法高亮 token 提取 + 折叠范围计算。

- [ ] **3-1** — 在 `native/deps/` 下克隆 tree-sitter 核心库及三个 grammar 仓库（tree-sitter、tree-sitter-typescript、tree-sitter-python、tree-sitter-c），均 `--depth 1`。

- [ ] **3-2** — 更新 `binding.gyp`：添加 `tree-sitter/lib/src/lib.c` 到源文件列表，添加 `tree-sitter/lib/include` 和 `tree-sitter/lib/src` 到 include_dirs。

- [ ] **3-3** — 创建 `native/src/parser/grammar_registry.h`：定义 `GrammarRegistry` 类，管理 `string → TSLanguage*` 映射，提供 `createParser(language)` 和 `hasLanguage(language)`。

- [ ] **3-4** — 创建 `native/src/parser/grammar_registry.cpp`：构造函数中注册 typescript/javascript/tsx（共用 TS grammar）、python、c/cpp 语言；`createParser` 创建 TSParser 并设置语言。

- [ ] **3-5** — 重写 `parser.cpp`：`Impl` 持有 `GrammarRegistry` 实例；`parse()` 中根据 language 创建 TSParser → 调用 `ts_parser_parse_string` → 递归遍历 AST 节点——叶子节点提取为 Token（含行号、字节偏移、类型字符串），多行父节点生成 FoldRange → 最后提取符号并返回完整 `ParseResult`。

- [ ] **3-6** — 在 `parser.cpp` 中实现 `Register()`：通过 `Napi::Function::New` 导出 `parseFile(content, language)` 同步函数，将 C++ `ParseResult` 转换为 Napi Object 返回（内含 `content` 字符串、`tokens` 数组、`folds` 数组）。

- [ ] **3-7** — 执行 `node-gyp rebuild --debug`，确认 tree-sitter 链接成功，无符号未定义错误。

---

## Task 4: TypeScript 桥接层 + 工具模块

**目标:** 封装 C++ native addon 调用为 TS 接口，实现配置读取、文件类型识别等工具函数。

- [ ] **4-1** — 创建 `src/types.ts`：定义 TS 侧数据类型——`Token`（startByte/endByte/line/type）、`SymbolNode`、`FoldRange`、`ParseResult`、`ReaderTheme` 联合类型。

- [ ] **4-2** — 创建 `src/constants.ts`：扩展 ID 常量、Ollama 默认 URL、支持语言扩展名映射（.ts→typescript 等）、自动折叠目录列表（node_modules/.git 等）。

- [ ] **4-3** — 创建 `src/utils/config.ts`：`getConfig()` 从 `vscode.workspace.getConfiguration('codeReader')` 读取 readerFontSize/readerTheme/autoCollapseNodeModules/maxFileSize，带默认值。

- [ ] **4-4** — 创建 `src/utils/fileUtils.ts`：`getLanguageForFile(path)` 优先用 VSCode 已打开文档的语言标识，否则回退扩展名映射；`shouldCollapseDir(name)` 判断是否应自动折叠；`readFileContent(path)` 用 `vscode.workspace.fs.readFile` 读取 UTF-8。

- [ ] **4-5** — 创建 `src/bridge/nativeBridge.ts`：惰性加载 `build/Release/code-reader-native.node`，导出 `parseFile(content, language): ParseResult`，失败时抛出友好错误。

---

## Task 5: 扩展入口 + 文件树侧边栏

**目标:** 实现 VSCode 扩展激活入口和侧边栏「Project Files」文件浏览器。

- [ ] **5-1** — 创建 `src/treeviews/fileTreeProvider.ts`：实现 `TreeDataProvider<TreeItem>`，`getChildren` 递归读取目录（`vscode.workspace.fs.readDirectory`），目录在前文件在后按字母排序，跳过点文件，`node_modules`/`.git` 等自动折叠，文件项绑定 `codeReader.openReader` 命令。

- [ ] **5-2** — 创建 `src/extension.ts`：`activate` 中——① 注册 `FileTreeProvider` 并创建 `codeReader.fileTree` 视图（支持 CollapseAll）；② 注册 `codeReader.openReader` 命令（调用 `openReader`，带 try-catch 错误提示）；③ 注册 `codeReader.refreshFileTree` 命令（调用 `fileTreeProvider.refresh()`）；④ 显示 "Code Reader activated" 信息提示。

- [ ] **5-3** — 创建 `src/panels/readerPanel.ts`（初始占位版）：`openReader(filePath)` 仅读取文件内容并 `vscode.window.showInformationMessage` 显示文件名，实际面板在 Task 6 完整实现。

- [ ] **5-4** — 执行 `npm run build:ts`，确认 `dist/extension.js` 生成无 TypeScript 编译错误。

---

## Task 6: 阅读面板 Webview

**目标:** 实现沉浸式代码阅读面板——语法高亮渲染、行号显示、代码折叠、主题切换。

- [ ] **6-1** — 创建 `media/styles/reader.css`：三种主题（light/sepia/dark）的背景和前景色，`var(--reader-font-size)` 可控字号，`.code-line` flex 布局（行号 48px 固定宽度 + 内容 flex 1），6 种 token 颜色（keyword/string/comment/number/function/class）三种主题各有适配色值。

- [ ] **6-2** — 创建 `webview/reader.html`：声明引用 `styles/reader.css` 和 `reader.js`，body 默认 `theme-sepia`，内含 `<div id="reader-content">` 容器。

- [ ] **6-3** — 创建 `webview/reader.ts`：接收 `loadFile` / `updateTheme` / `updateFontSize` 三种 postMessage，`renderContent()` 遍历 `content.split('\n')` 逐行创建 `.code-line`，根据 `tokens` 的 `startByte`/`endByte` 插入 `<span class="token-xxx">` 实现语法高亮，根据 `folds` 的计算结果给折叠行加 `.fold-hidden`（display:none）。

- [ ] **6-4** — 重写 `src/panels/readerPanel.ts`（替换 Task 5 占位版）：创建/复用 `vscode.WebviewPanel`（`Beside` 列、启用脚本、`retainContextWhenHidden`），读取 `reader.html` → 替换 CSS/JS 路径为 `asWebviewUri` 后的真实 URI → 注入 Webview HTML → 发送 `loadFile`（含 parseFile 返回的 tokens/folds）→ 发送 `updateTheme` 和 `updateFontSize` → 面板标题设为 `Reader: {fileName}`。

- [ ] **6-5** — 执行 `npm run build:ts` 编译 TS，同时需要单独编译 `webview/reader.ts`（或复制原版 JS 到 webview 目录让 esbuild 同时处理），确认 `dist/extension.js` 更新且无错误。

---

## 最终验证

- [ ] **V-1** — 执行 `npm run build:native`，确认 `build/Release/code-reader-native.node` 存在。

- [ ] **V-2** — 执行 `npm run build:ts`，确认 `dist/extension.js` 存在。

- [ ] **V-3** — 按 F5 启动扩展开发主机：① 侧边栏出现「Code Reader」活动栏图标；② 「Project Files」视图显示当前工作区文件树（目录在前、node_modules 折叠）；③ 点击任意代码文件，右侧打开阅读面板；④ 代码显示语法高亮（不同 token 类型不同颜色）；⑤ 行号正确显示；⑥ 可通过 VSCode 设置修改 readerFontSize 和 readerTheme 并即时生效。

- [ ] **V-4** — 关闭 Ollama 时扩展不崩溃（此版本尚无 AI 功能，仅验证扩展加载无 native addon 依赖时降级可用）。
