# CHANGELOG

## v0.2.0 (2026-07-22)

### 新增
- 沉浸式阅读面板（代码内容渲染 + 行号显示）
- 三种阅读主题（light / sepia / dark），VSCode 设置实时同步
- 可调节字体大小，设置实时同步
- 侧边栏 Project Files 文件树（目录在前、文件在后、自动折叠 node_modules 等目录）
- 快捷键 `Ctrl+Alt+R` 打开当前编辑器文件到阅读面板
- 大文件截断（默认 5000 行，可配置 codeReader.maxFileSize）
- 中文编码兼容（UTF-8 优先，自动回退 GBK）
- 原生 C++ 模块加载失败自动降级为纯文本模式，不崩溃

### 修复
- B1: webview/reader.js 缺失 — esbuild 新增 webview 入口点
- B2: nativeBridge Debug/Release 路径不匹配 — __dirname 动态构建 + 自动检测
- B4: .vscodeignore 排除 native/ — 改为只排除 native/src/ 和 native/deps/
- C1: 原生模块加载失败静默吞掉 — 添加 console.warn 日志
- C2: maxFileSize 配置未使用 — 实现截断逻辑 + 警告提示
- C3: FileTreeProvider any 类型 — 定义 TreeItemWithPath 接口
- M1: 隐藏文件过滤过严 — 只排除 .git
- M4: 无扩展名文件边界处理

### 已知限制
- 语法高亮、代码折叠、符号导航等功能将在 v0.3.0 实现（需集成 tree-sitter）
- C++ 解析器为占位实现，无实际解析能力

### 技术栈
- TypeScript + VSCode Extension API
- C++17 + N-API (node-addon-api)
- esbuild 打包
- node-gyp + MSVC (VS2022) 编译 native addon
- iconv-lite 编码检测

---

## v0.1.0 (2026-07-22)

### 新增
- 项目初始化
- 架构设计与文档输出（README / PRD / ARCHITECTURE / DEVELOPMENT）
- 设计规约 + 实现计划