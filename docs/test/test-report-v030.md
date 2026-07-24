# Code Reader v0.3.0 测试报告

**测试日期**：2026-07-23 | **被测版本**：v0.3.0 | **对比基线**：v0.2.0 首轮报告 | **测试范围**：19 个源文件 + 构建/打包配置

## 执行摘要

本轮对 v0.2.0 首轮测试报告中的全部 16 个缺陷进行了回归验证。其中 **9 个已修复**（含 4 个阻塞级全部修复），**7 个尚未处理**。同时新发现 **7 个问题**（含 1 个严重级、2 个中等级）。

当前版本核心链路已全面连通：TypeScript 编译通过 ✅、webview 脚本已构建 ✅、原生模块动态加载 ✅、C++ tree-sitter 解析器完整实现 ✅、打包排除规则正确 ✅。

---

## 一、v0.2.0 缺陷回归结果

### 阻塞级（全部已修复）

| 编号 | 标题 | 状态 | v0.3.0 修复方式 |
|------|------|------|----------|
| B1 | `webview/reader.js` 缺失且无构建步骤 | ✅ 已修复 | `esbuild.config.cjs` 新增 `"webview/reader": "webview/reader.ts"` 入口点 |
| B2 | 原生模块路径 Release vs Debug 不匹配 | ✅ 已修复 | `resolveNativePath()` 动态检测：先试 Debug 再 fallback Release |
| B3 | C++ 解析器为完整空壳实现 | ✅ 已修复 | 集成 tree-sitter，实现 Napi::AsyncWorker、语法高亮、折叠、符号提取 |
| B4 | `.vscodeignore` 排除了 `native/` 目录 | ✅ 已修复 | 改为仅排除 `native/src/` 和 `native/deps/`，编译产物保留 |

### 严重级（全部已修复）

| 编号 | 标题 | 状态 | v0.3.0 修复方式 |
|------|------|------|----------|
| C1 | 原生模块加载失败被静默吞掉 | ✅ 已修复 | `catch` 块增加 `console.warn("[Code Reader] Native parse failed...")` |
| C2 | `maxFileSize` 配置被读取但从未使用 | ✅ 已修复 | `readFileContent()` 接受 `maxLines`，超出行数截断并插入提示行 |
| C3 | FileTreeProvider 使用 any 类型 | ✅ 已修复 | 定义 `TreeItemWithPath` 接口，移除 `(element as any)` 断言 |

### 中等级

| 编号 | 标题 | 状态 |
|------|------|------|
| M1 | 文件树过滤隐藏文件规则过度宽泛 | ✅ 已修复：仅跳过 `.git`，其余隐藏文件正常展示 |
| M2 | 单例 Webview Panel 无法同时查看多个文件 | ❌ 未修复 |
| M3 | 不支持多根工作区 | ❌ 未修复 |
| M4 | 无扩展名文件边界处理 | ✅ 已修复：显式 `dotIdx === -1` 判断 |
| M5 | Webview 无 Content Security Policy | ❌ 未修复 |

### 建议级

| 编号 | 标题 | 状态 |
|------|------|------|
| L1 | renderContent 全量 DOM 渲染 | ❌ 未修复（但折叠功能已实现，可以缓解） |
| L2 | reader.ts 缺少独立 tsconfig.json | ✅ 已修复：esbuild 直接编译 webview/reader.ts |
| L3 | 测试脚本为占位符 | ❌ 未修复 |
| L4 | 打包后 require() 相对路径不可靠 | ✅ 已修复：使用 `vscode.extensions.getExtension` + `path.join` |
| L5 | 键盘快捷键无使用说明 | ❌ 未修复（键位已改为 `ctrl+alt+r`） |

**回归统计**：16 个缺陷 → 9 修复 / 7 未修复。修复率 56%。

---

## 二、v0.3.0 新增功能验证

| 功能 | 模块 | 验证结果 |
|------|------|----------|
| Symbol 树视图 | `SymbolTreeProvider` 注册在 `codeReader.symbols` 视图 | ✅ 正确 |
| 折叠展开交互 | webview 新增 `fold-toggle` 元素，点击切换折叠 | ✅ 正确 |
| 无参命令支持 | `openReader` 不传参数时使用当前编辑器文件 | ✅ 正确 |
| 配置热更新 | `onDidChangeConfiguration` 监听主题/字号实时推送 | ✅ 正确 |
| GBK 编码兼容 | `iconv-lite` 检测 `\uFFFD` 后尝试 GBK 解码 | ✅ 正确 |
| 异步解析 | C++ `ParseWorker` 继承 `Napi::AsyncWorker` | ✅ 正确 |
| Grammar 注册表 | `GrammarRegistry` 管理四种语言 parser | ✅ 正确 |
| 构建分离 | esbuild `entryPoints` 对象同时构建扩展 + webview | ✅ 正确 |

---

## 三、v0.3.0 新发现缺陷

### N1 — 严重：webview 渲染中 tree-sitter 字节偏移与 JS 字符索引不匹配

**涉及文件**：`webview/reader.ts:50-75`、`native/src/parser/parser.cpp`

C++ 原生解析器通过 `ts_node_start_byte / ts_node_end_byte` 返回 UTF-8 编码下的字节偏移量，但 JavaScript `String.slice()` 按 UTF-16 编码单元索引切分。对于 ASCII 内容二者一致，但对非 ASCII 字符（中文注释、emoji）严重偏离。

**影响**：含中文注释/字符串的代码高亮完全错乱，GBK→UTF-8 转换可能进一步加剧。

**修复建议**：在 C++ 侧 `ParseWorker::OnOK` 中转换偏移，或在 JS 侧用 `TextEncoder/TextDecoder` 统一处理。

---

### N2 — 中等：TSX/JSX 语法未被正确解析

**涉及文件**：`native/src/parser/grammar_registry.cpp:12-16`

`grammar_registry.cpp` 只声明了 `tree_sitter_typescript()`，四种 JS/TS 变体全部映射到标准 TypeScript grammar。但 `binding.gyp` 实际编译了 `tsx/src/parser.c`（导出 `tree_sitter_tsx()`），该函数从未被调用。

**影响**：`.tsx` / `.jsx` 文件中的 JSX 语法（`<div>` 等）无法正确解析。

**修复建议**：增加 `extern "C" { const TSLanguage* tree_sitter_tsx(); }`，将 `javascriptreact` 和 `typescriptreact` 映射到 TSX grammar。

---

### N3 — 中等：FoldingProvider 是死代码

**涉及文件**：`native/src/parser/foldingProvider.cpp`

`compute()` 始终返回空数组，折叠逻辑已内联在 `Parser::parse()` 的 AST 遍历中完成。该类无实际调用路径。

**修复建议**：删除 `foldingProvider.cpp/.h` 或委托折叠逻辑到此模块。

---

### N4 — 低：`vscodeLangToTreeSitter("csharp")` 是不可达代码

**涉及文件**：`native/src/parser/parser.cpp:27`

`csharp` 不在 `SUPPORTED_LANGUAGES` 中，`GrammarRegistry` 也未注册。

---

### N5 — 低：截断提示行使用 C 风格注释

**涉及文件**：`src/utils/fileUtils.ts:32`

```typescript
const note = `\n// ... (${lines.length - showLines} more lines not shown)`;
```

对 Python/HTML 等非 C 系文件不适当。

---

### N6 — 低：webview 与扩展共用 esbuild cjs format

**涉及文件**：`esbuild.config.cjs:14`

`format: "cjs"` 同时应用于 Node.js 环境和浏览器 webview，语义不正确。建议 webview 单独用 `"iife"`。

---

### N7 — 低：`.token-text` 未定义 CSS 样式

C++ `nodeTypeToTokenType()` 可能返回 `"text"`，但 CSS 中无对应规则。

---

## 四、尚未修复的遗留问题（来自 v0.2.0）

| 编号 | 标题 | 严重度 |
|------|------|--------|
| M2 | 单例 Webview Panel，多文件互相覆盖 | 中等 |
| M3 | 不支持多根工作区 | 中等 |
| M5 | 无 Content Security Policy | 中等 |
| L1 | 全量 DOM 渲染（折叠已部分缓解） | 建议 |
| L3 | 测试脚本为占位符 | 建议 |

---

## 五、编译与构建验证

| 检查项 | 结果 |
|--------|------|
| `tsc --noEmit` | ✅ 通过 (0 errors) |
| `node esbuild.config.cjs` | ✅ 通过 |
| `dist/extension.js` | ✅ 存在 |
| `dist/webview/reader.js` | ✅ 存在 |
| `dist/webview/reader.js.map` | ✅ 存在 |
| `build/Debug/code-reader-native.node` | ✅ 存在 |
| `.vscodeignore` 包含 native/build/ | ✅ 正确 |
| `readerPanel` 引用 dist/webview/reader.js | ✅ 正确 |
| `nativeBridge` 动态路径解析 | ✅ 正确 |

---

## 六、缺陷汇总

| 级别 | 总数 | v0.3.0 新增 | v0.2.0 遗留 | v0.2.0 已修复 |
|------|------|-------------|-------------|--------------|
| 阻塞 | 0 | 0 | 0 | 4/4 |
| 严重 | 1 | 1 | 0 | 3/3 |
| 中等 | 4 | 2 | 2 | 2/4 |
| 建议 | 7 | 4 | 3 | 3/5 |
| **合计** | **12** | **7** | **5** | **9** |

---

## 七、修复优先级

1. **N2（TSX/JSX 语法）** — 修复成本极低（加两行声明），影响 .tsx/.jsx 用户
2. **N1（字节偏移）** — 影响中文字符场景，需 C++ 或 JS 侧索引转换
3. **M2（单例面板）** — 用户体验改善，中等实现成本
4. **N3 / M3 / M5 / N4-N7** — 按需迭代

---

*报告生成时间：2026-07-23 | 测试方法：静态代码审查 + 编译验证 + 构建产物对比*

## v0.3.0-验收 bug 修复 (2026-07-24)

| 编号 | 描述 | 状态 |
|------|------|------|
| R1 | 渲染内容重复 — reader.ts 行相对位置重写 | ✅ |
| R2 | 全文件默认折叠 — 初始状态改为展开 | ✅ |
| R3 | 关键字识别太少 — 100+ 关键字 + variable 类型 | ✅ |
| R4 | 折叠误判头文件/宏 — 白名单 + 最小行数阈值 | ✅ |
| R5 | C 符号提取为 0 — findName 递归查找 | ✅ |
| R6 | 符号跳转无效 — scrollToLine 随 loadFile 发送 | ✅ |
| R7 | 符号跳转闪烁标记 — jump-highlight CSS animation | ✅ |
| R8 | 空文件清空 Symbols — onSymbolsReady 无条件调用 | ✅ |