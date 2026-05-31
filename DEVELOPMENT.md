# VS Code Code Reader — 开发文档

> 一个专注于**沉浸式代码阅读**的 VS Code 扩展，集成本地 AI 进行逐行讲解。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目架构](#3-项目架构)
4. [开发周期](#4-开发周期)
5. [详细开发步骤](#5-详细开发步骤)
6. [API 与接口设计](#6-api-与接口设计)
7. [测试策略](#7-测试策略)
8. [发布清单](#8-发布清单)

---

## 1. 项目概述

### 1.1 基本信息

| 项目 | 说明 |
|------|------|
| **项目名称** | Code Reader |
| **类型** | VS Code Extension |
| **目标用户** | 开发者（个人使用 + 开源社区） |
| **许可证** | MIT |
| **仓库** | GitHub（个人账号下） |

### 1.2 核心功能

| 功能 | 描述 |
|------|------|
| 📂 项目结构树 | 侧边栏 TreeView，智能过滤无关文件 |
| 📖 阅读面板 | Webview 只读代码渲染，独立主题与排版 |
| 🧭 符号导航 | 函数/类/接口大纲，点击跳转 |
| 🤖 AI 讲解 | Ollama 本地模型，逐行解释代码 |
| 📝 书签与标注 | 标记关键代码行，记录阅读心得 |
| 🔗 依赖图谱 | 当前函数调用了谁、被谁调用（TSServer） |
| 🎯 专注模式 | 除选中范围外全部变暗 |

---

## 2. 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **语言** | TypeScript | ^5.x | 全栈使用 |
| **VS Code API** | Extension API | ^1.85 | 最低兼容版本 |
| **构建** | esbuild | ^0.20 | 快速打包 |
| **Lint** | ESLint + Prettier | - | 代码规范 |
| **AI 运行时** | Ollama | latest | 本地模型服务 |
| **推荐模型** | codellama:7b / llama3.2:1b | - | 代码理解 |
| **Webview UI** | 原生 HTML/CSS/TS | - | 零框架依赖 |
| **包管理** | pnpm | ^8 | 高效 |

---

## 3. 项目架构

### 3.1 目录结构

```
code-reader/
├── .vscode/                    # VS Code 调试配置
│   ├── launch.json
│   └── tasks.json
├── src/
│   ├── extension.ts            # 入口：激活/停用
│   ├── constants.ts            # 命令 ID、配置键常量
│   ├── types.ts                # 类型定义
│   │
│   ├── treeview/               # 侧边栏 TreeView
│   │   ├── fileTreeProvider.ts
│   │   └── readingListProvider.ts
│   │
│   ├── reader/                 # 阅读面板 Webview
│   │   ├── readerPanel.ts
│   │   └── readerContent.ts
│   │
│   ├── symbols/                # 符号导航
│   │   ├── symbolProvider.ts
│   │   └── dependencyGraph.ts
│   │
│   ├── ai/                     # AI 服务
│   │   ├── ollamaClient.ts
│   │   ├── promptBuilder.ts
│   │   ├── codeExplainer.ts
│   │   └── modelManager.ts
│   │
│   ├── explainer/              # AI 讲解面板 Webview
│   │   ├── explainerPanel.ts
│   │   └── explainerContent.ts
│   │
│   ├── features/               # 辅助功能
│   │   ├── bookmarks.ts
│   │   ├── readingHistory.ts
│   │   └── focusMode.ts
│   │
│   └── utils/                  # 工具函数
│       ├── config.ts
│       ├── fileUtils.ts
│       └── decorations.ts
│
├── media/                      # 静态资源
│   ├── icon.svg
│   └── styles/
│       ├── reader.css
│       └── explainer.css
│
├── webview/                    # Webview 端 TypeScript
│   ├── reader.ts
│   └── explainer.ts
│
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── README.md
├── DEVELOPMENT.md
└── LICENSE
```

### 3.2 模块关系图

```
扩展入口 extension.ts
  ├── TreeView (fileTreeProvider / readingListProvider)
  ├── Reader Panel (readerPanel → Webview)
  ├── Symbol Provider (symbolProvider / dependencyGraph)
  ├── AI Service (ollamaClient / promptBuilder / codeExplainer)
  ├── Explainer Panel (explainerPanel → Webview)
  └── Features (bookmarks / history / focusMode)
```

---

## 4. 开发周期

> 总预估：**约 4 周**（业余时间，每天 2-3 小时）

| 阶段 | 内容 | 工时 | 里程碑 |
|------|------|------|--------|
| **Phase 1** | 项目初始化 & 基础架构 | 1 周 | 扩展可调试运行 |
| **Phase 2** | 核心阅读功能 | 1.5 周 | 阅读面板可用 |
| **Phase 3** | AI 讲解集成 | 1 周 | AI 解释功能可用 |
| **Phase 4** | 辅助功能 & 体验优化 | 0.5 周 | 完整功能集 |
| **Phase 5** | 文档 & 发布 | 0.5 周 | GitHub Release |

---

## 5. 详细开发步骤

### Phase 1：项目初始化（第 1 周）

| 天 | 任务 | 备注 |
|----|------|------|
| 1 | 初始化项目骨架，配置 esbuild、TSConfig、ESLint | 验证 F5 可调试 |
| 2-3 | 创建目录结构，实现 extension.ts / constants.ts / types.ts / config.ts | 生命周期 + 类型 |
| 4-5 | 实现 fileTreeProvider（递归读取、过滤无关文件）+ readingListProvider | 两个 TreeView |

### Phase 2：核心阅读功能（第 2 周）

| 天 | 任务 | 备注 |
|----|------|------|
| 6-7 | 实现 readerPanel（Webview 创建/复用、消息通信、HTML 生成） | 基础渲染 |
| 8-9 | 实现阅读面板交互（折叠、选中、书签、三种阅读主题） | CSS + webview/reader.ts |
| 10-11 | 实现符号导航（symbolProvider + dependencyGraph） | TSServer API |

### Phase 3：AI 讲解集成（第 3 周）

| 天 | 任务 | 备注 |
|----|------|------|
| 12-13 | 实现 ollamaClient（连接 /api/tags + /api/generate 流式）+ modelManager | HTTP + 错误处理 |
| 14-15 | 实现 promptBuilder（三种模式模板）+ codeExplainer | 业务编排 |
| 16-17 | 实现 AI 讲解面板 Webview（聊天 UI、Markdown 渲染、模式切换） | 流式渲染 |

### Phase 4：辅助功能 & 优化（第 4 周前半）

| 天 | 任务 | 备注 |
|----|------|------|
| 18 | 实现 focusMode、readingHistory、状态栏集成 | 体验打磨 |
| 19 | 快捷键、设置面板、性能优化（大文件分页） | polish |

### Phase 5：文档 & 发布（第 4 周后半）

| 天 | 任务 | 备注 |
|----|------|------|
| 20 | 编写 README + CHANGELOG | 用户文档 |
| 21 | Git 初始化、打 tag、推送到 GitHub | Release |

---

## 6. API 与接口设计

### 6.1 VS Code 命令

| 命令 ID | 标题 | 快捷键 |
|---------|------|--------|
| `codeReader.openReader` | Open Code Reader | Ctrl+Shift+R |
| `codeReader.explainSelection` | Explain Selected Code | Ctrl+Shift+E |
| `codeReader.toggleFocusMode` | Toggle Focus Mode | Ctrl+Shift+F |
| `codeReader.addBookmark` | Add Bookmark | - |
| `codeReader.switchModel` | Switch AI Model | - |

### 6.2 Webview 消息协议

```typescript
// Extension → Reader Webview
type ToReaderMessage =
  | { type: 'loadFile'; filePath: string; content: string; language: string }
  | { type: 'updateTheme'; theme: 'light' | 'sepia' | 'dark' }
  | { type: 'updateFontSize'; size: number }
  | { type: 'updateSymbols'; symbols: SymbolNode[] };

// Reader Webview → Extension
type FromReaderMessage =
  | { type: 'selection'; text: string; startLine: number; endLine: number; filePath: string }
  | { type: 'addBookmark'; line: number; note?: string; filePath: string }
  | { type: 'requestSymbols'; filePath: string };

// Extension → Explainer Webview
type ToExplainerMessage =
  | { type: 'explanationChunk'; chunk: string }
  | { type: 'explanationDone'; fullText: string }
  | { type: 'explanationError'; error: string }
  | { type: 'contextUpdate'; fileName: string; functionName: string };

// Explainer Webview → Extension
type FromExplainerMessage =
  | { type: 'askQuestion'; question: string }
  | { type: 'requestExplain'; code: string; mode: ExplainMode; filePath: string }
  | { type: 'cancelExplain' };

type ExplainMode = 'line-by-line' | 'overview' | 'chat';
```

### 6.3 核心服务接口

```typescript
interface IAIService {
  checkHealth(): Promise<boolean>;
  listModels(): Promise<string[]>;
  explainCode(
    code: string,
    mode: ExplainMode,
    context: CodeContext,
    onChunk: (text: string) => void,
    signal: AbortSignal
  ): Promise<string>;
}

interface CodeContext {
  fileName: string;
  functionName?: string;
  language: string;
  imports?: string[];
}

interface Bookmark {
  filePath: string;
  line: number;
  note: string;
  createdAt: number;
}
```

---

## 7. 测试策略

### 测试层级

| 层级 | 范围 | 工具 |
|------|------|------|
| 单元测试 | ollamaClient、promptBuilder、bookmarks | vitest |
| 集成测试 | 激活流程、文件打开渲染、AI 调用 | vitest + VS Code Test |
| 手动测试 | 多平台、大文件、Ollama 未安装引导 | 手动 |

### 手动测试清单

- [ ] Windows 完整功能测试
- [ ] 大文件（5000+ 行）阅读性能
- [ ] Ollama 未安装时的引导流程
- [ ] 多工作区同时打开

---

## 8. 发布清单

### GitHub 发布步骤

```bash
git init
git add .
git commit -m "feat: Code Reader v0.1.0"
git tag v0.1.0
git remote add origin https://github.com/<username>/vscode-code-reader.git
git push -u origin main --tags
```

### 必备文件

- [x] `README.md`（功能 + 截图 + 安装）
- [x] `DEVELOPMENT.md`（本文件）
- [ ] `CHANGELOG.md`
- [ ] `LICENSE`（MIT）
- [ ] `.vscodeignore`

---

## 附录

### A. 开发环境

| 工具 | 版本 |
|------|------|
| Node.js | >= 20.x |
| pnpm | >= 8.x |
| VS Code | >= 1.85 |
| Ollama | latest |

### B. 快速启动

```bash
pnpm install        # 安装依赖
pnpm run watch      # 文件变更自动构建
# 按 F5 启动扩展开发
```

### C. 参考链接

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)
