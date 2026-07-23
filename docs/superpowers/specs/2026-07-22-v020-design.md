# Code Reader v2 - 设计规约

> 日期: 2026-07-22 | 状态: 已批准

## 1. 概述

基于 VSCode 扩展框架的代码阅读器，TS 层负责 VSCode UI 交互，C++ native addon 负责计算密集型逻辑。集成本地 Ollama 大模型实现 AI 代码解释。

## 2. 架构决策

- **TS + C++ Native Addon 混合架构**：TS 作为 VSCode 扩展宿主，C++ 通过 N-API 导出为 Node.js 原生模块
- **tree-sitter 代码解析**：统一 AST 解析器，支持 7+ 语言
- **libcurl HTTP 客户端**：与 Ollama REST API 通信
- **SQLite 持久化**：书签、历史、笔记、阅读列表
- **Napi::AsyncWorker 异步模型**：所有 C++ 调用不阻塞 VSCode UI 线程

## 3. 模块设计

### C++ 层（6 模块）

| 模块 | 核心类/函数 | 职责 |
|------|-----------|------|
| parser | Parser, SymbolExtractor, CallGraphBuilder, FoldingProvider | 代码解析、符号提取、调用图、折叠范围 |
| search | SearchEngine | 文件索引、内容搜索、符号搜索 |
| ollama | OllamaClient | HTTP 通信、流式响应、超时重试、模型管理 |
| prompt | PromptBuilder | 解释/摘要/问答提示词构建、上下文注入 |
| persistence | Database | SQLite CRUD，4 张表 |
| export | Exporter | Markdown/PDF 导出 |

### TS 层（4 模块）

| 模块 | 文件 | 职责 |
|------|------|------|
| bridge | nativeBridge.ts | N-API 封装、Promise 包装、错误映射 |
| panels | readerPanel.ts, explainerPanel.ts | Webview 创建与管理 |
| treeviews | fileTreeProvider.ts, bookmarkTreeProvider.ts, readingListProvider.ts, symbolTreeProvider.ts | 侧边栏数据源 |
| extension | extension.ts, features/, utils/ | 命令注册、菜单、配置、装饰 |

## 4. 数据流设计

- 文件打开: TS -> C++ parseFile -> 返回 tokens/symbols/folds -> TS 注入 Webview
- AI 解释: Webview -> TS -> C++ buildPrompt + ollamaClient.chat -> 流式回调 -> TS 逐块推送
- 搜索: TS input box -> C++ searchEngine -> 结果列表 -> TS QuickPick/TreeView
- 持久化: TS -> C++ Database CRUD -> 结果 -> TS 刷新 View
- 导出: TS -> C++ Exporter -> 文件/内容 -> TS 打开/写入

## 5. 错误处理策略

| 错误类型 | C++ 处理 | TS 展示 |
|----------|---------|--------|
| 网络超时 | 指数退避重试（3次），返回错误码 | Toast: "无法连接 Ollama" |
| 模型未加载 | 返回 ModelNotAvailable | 弹窗引导 pull 模型 |
| 解析失败 | 回退纯文本高亮 | 静默降级 |
| IO 错误 | 日志记录，返回错误码 | Toast: 具体错误信息 |
| 文件过大 | 分页加载 | 显示分页导航 |

## 6. 测试策略

- C++ 单元: Google Test，覆盖率 80%+
- C++ 集成: GTest + mock server + 真实 SQLite
- TS 单元: Jest，覆盖率 70%+
- E2E: @vscode/test-electron
- 性能: 大文件解析基准测试

## 7. 版本路线

- v0.2.0: 基础阅读面板 + 文件浏览
- v0.3.0: 符号导航 + 代码跳转 + 调用关系图
- v0.4.0: 全项目搜索 + 可视化架构图
- v0.5.0: AI 代码解释 + 摘要
- v0.6.0: 书签 + 阅读列表 + 历史
- v0.7.0: 导出 + 代码笔记
