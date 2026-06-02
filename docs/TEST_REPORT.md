# Code Reader v0.1.2 — 测试报告

> 测试师：资深 QA | 日期：2026-06-02 | 版本：v0.1.2

---

## 一、总览

| 维度 | 结果 |
|------|------|
| 测试范围 | 全量源代码审查（40 文件，约 3756 行） |
| 严重缺陷 | 1（已修复） |
| 一般缺陷 | 5（已修复） |
| 建议项 | 5（已修复） |
| 通过项 | 架构设计、类型定义、构建配置、ESLint 配置 |

---

## 二、严重缺陷

### BUG-01：TreeView 点击文件不打开阅读面板

**位置：** `src/treeview/fileTreeProvider.ts:52-56`

**现象：** FileTreeItem 上注册了 `command: 'vscode.open'`，VS Code 直接用编辑器打开文件。虽然 `extension.ts` 中监听了 `onDidChangeSelection`，但 TreeItem 内置命令优先级更高，导致阅读面板完全不可达。

**状态：✅ 已修复 (2026-06-01)** — 删除了 FileTreeItem 中的命令赋值，点击侧边栏文件现在由 `onDidChangeSelection` 事件处理，正确打开阅读面板。

---

## 三、一般缺陷

### BUG-02：讲解面板流式渲染在 chunk 边界截断 Markdown 语法

**状态：✅ 已修复 (2026-06-02)** — 使用流式缓冲区累积完整文本后再渲染 Markdown，消除跨 chunk 截断问题。

### BUG-03：explanationDone 缺少 fullText

**状态：✅ 已修复 (2026-06-02)** — 移除未使用的 `explanationText` 变量，`done` 消息不再依赖 `fullText`。

### BUG-04：dependencyGraph 实例化后未被使用

**状态：✅ 已修复 (2026-06-02)** — 删除 `extension.ts` 中未被注入的 `depGraph` 实例。

### BUG-05：explainerPanel.show() 每次调用重置 HTML 丢失之前消息

**状态：✅ 已修复 (2026-06-02)** — 添加 `initialized` 标志，二次调用通过 `postMessage` 发送 `clearMessages` 而非重置 HTML。

### BUG-06：书签添加后未自动刷新阅读面板中的书签标记

**状态：✅ 已修复 (2026-06-02)** — 添加 `refreshBookmarks()` 方法，书签变更后推送消息同步阅读面板。

---

## 四、建议项

### SUG-01：缺少 onCommand 激活事件

**状态：✅ 已修复 (2026-06-02)** — 添加 6 个 `onCommand` 激活事件，覆盖所有快捷键和菜单命令。

### SUG-02：聚焦模式不完全（选区未排除）

**状态：✅ 已修复 (2026-06-02)** — 监听选区变化事件，聚焦时动态排除选中范围。

### SUG-03：Ollama 连接失败时无重试机制

**状态：✅ 已修复 (2026-06-02)** — 添加 `checkHealthWithRetry()` 方法，3 次指数退避重试（3s/6s/12s），已接入启动流程。

### SUG-04：大文件加载无进度提示

**状态：✅ 已修复 (2026-06-02)** — 超过 3000 行的文件在工具栏显示 "(large file)" 标签。

### SUG-05：getConfig 返回值缺少运行时校验

**状态：✅ 已修复 (2026-06-02)** — `updateConfig` 增加运行时类型校验，防止非法配置值。

---

## 五、通过项

| 检查项 | 结果 |
|--------|------|
| 代码架构分层清晰 | ✅ 模块职责单一，依赖方向正确 |
| TypeScript 严格模式编译通过 | ✅ `tsconfig.json` strict: true |
| esbuild 构建通过（0.7s） | ✅ |
| AI Prompt 三种模式设计合理 | ✅ 覆盖逐行/概览/追问 |
| Webview 消息协议类型安全 | ✅ 双向消息均有联合类型 |
| 书签/历史/阅读列表持久化 | ✅ workspaceState 存储 |
| VS Code 配置项注册完整 | ✅ 6 个可配置项 |
| 快捷键绑定正确 | ✅ 3 组快捷键 |
| Git 历史清晰 | ✅ |

---

## 六、结论

全部 11 项问题已于 v0.1.2 修复完毕。项目架构设计优秀，代码质量良好，可投入使用。