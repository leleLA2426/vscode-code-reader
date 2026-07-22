# Code Reader v0.2.0 测试报告

测试时间：2026-07-22 | 测试版本：v0.2.0 | 状态：已验收

## 缺陷修复状态

| 编号 | 严重级别 | 标题 | 状态 |
|------|----------|------|------|
| B1 | 阻塞 | webview/reader.js 缺失且无构建步骤 | ✅ 已修复 (esbuild 新增 webview 入口点) |
| B2 | 阻塞 | 原生模块路径 Release vs Debug 不匹配 | ✅ 已修复 (extContext.extensionPath + 自动检测) |
| B3 | 阻塞 | C++ 解析器为完整空壳实现 | ⏳ v0.3.0 (需 tree-sitter 集成) |
| B4 | 阻塞 | .vscodeignore 排除了 native/ 目录 | ✅ 已修复 (改为 native/src/ + native/deps/) |
| C1 | 严重 | 原生模块加载失败被静默吞掉 | ✅ 已修复 (console.warn) |
| C2 | 严重 | maxFileSize 配置读取但未使用 | ✅ 已修复 (截断逻辑 + 警告) |
| C3 | 严重 | FileTreeProvider 使用 any 绕过类型安全 | ✅ 已修复 (TreeItemWithPath 接口) |
| M1 | 中等 | 文件树过滤隐藏文件过度宽泛 | ✅ 已修复 (只排除 .git) |
| M2 | 中等 | 单例 Webview Panel 无法同时查看多个文件 | 📋 未修复 (v0.3.0) |
| M3 | 中等 | 不支持多根工作区 | 📋 未修复 (v0.3.0) |
| M4 | 中等 | 无扩展名文件 getLanguageForFile 边界处理 | ✅ 已修复 |
| M5 | 中等 | Webview 无 Content Security Policy | 📋 未修复 |
| L1 | 建议 | renderContent 全量 DOM 渲染无虚拟滚动 | 📋 未修复 |
| L2 | 建议 | reader.ts 缺少独立 tsconfig.json | 📋 未修复 |
| L3 | 建议 | 测试脚本为占位符 echo | 📋 未修复 |
| L4 | 建议 | 打包后 require() 相对路径不可靠 | ✅ 已修复 (vscode.extensions.getExtension) |
| L5 | 建议 | 键盘快捷键无使用说明 | 📋 未修复 |

## 新增 bug 修复（验收期间发现）

| 编号 | 描述 | 状态 |
|------|------|------|
| A1 | reader.html 路径解析错误 (ENOENT) | ✅ 已修复 (extContext.extensionPath) |
| A2 | reader.js 在 dist/webview/ 而非 webview/ | ✅ 已修复 (distDir 加入 localResourceRoots) |
| A3 | 中文字符乱码 (UTF-8 / GBK 混用) | ✅ 已修复 (iconv-lite 自动检测) |
| A4 | 主题/字号切换不实时生效 | ✅ 已修复 (onDidChangeConfiguration) |
| A5 | Ctrl+Shift+R 与 VSCode 冲突 | ✅ 已修复 (改为 Ctrl+Alt+R，去掉 when 限制) |
| A6 | 大文件截断多占行 (note 换行) | ✅ 已修复 (保留 1 行提示) |