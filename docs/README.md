[![VSCode](https://img.shields.io/badge/VSCode-%5E1.85.0-blue)](https://code.visualstudio.com/)
[![C++](https://img.shields.io/badge/C%2B%2B-17-orange)](https://isocpp.org/)

# Code Reader - VSCode 代码阅读器插件

一个沉浸式代码阅读 VSCode 扩展，支持语法高亮、符号导航、调用关系图、全项目搜索，并集成本地 Ollama AI 大模型用于代码解释。

## 功能概览

- **沉浸式阅读** — 多语言语法高亮、行号显示、代码折叠、专注模式
- **智能导航** — 符号（函数/类/变量）列表、定义与引用跳转、调用关系图
- **全项目搜索** — 文件名匹配、内容 grep、正则搜索、符号搜索
- **AI 辅助** — 接入本地 Ollama 大模型，选中代码即可解释、摘要、问答
- **阅读管理** — 书签（附备注）、阅读列表、阅读历史追踪
- **导出分享** — 代码片段导出为 Markdown / PDF，支持代码块标注笔记
- **个性化** — 多主题配色（亮色/暗色/护眼褐）、可调字号

## 技术栈

| 层级 | 技术 |
|------|------|
| 扩展宿主 | TypeScript (VSCode Extension API) |
| 核心引擎 | C++17 (N-API native addon) |
| 代码解析 | tree-sitter |
| 搜索 | 自研文件索引 + 内容匹配引擎 |
| AI 服务 | Ollama HTTP API (libcurl) |
| 持久化 | SQLite3 |
| 导出 | Markdown / libharu (PDF) |
| 测试 | Google Test (C++), Jest (TS), @vscode/test-electron (E2E) |

## 快速开始

### 前置条件

- Windows 10+
- VSCode 1.85+
- Node.js 20+
- C++ 构建工具（Visual Studio 2022 with C++ workload）
- Ollama（本地运行，默认端口 11434）

### 开发构建

```bash
npm install
npm run build:ts    # 编译 TypeScript
npm run build:native # 编译 C++ addon
```

### 调试

按 F5 在 VSCode 中启动扩展开发主机。

### 使用

- `Ctrl+Shift+R` — 打开代码阅读面板
- `Ctrl+Shift+E` — 解释选中代码（需 Ollama 运行）
- `Ctrl+Shift+F` — 切换专注模式
- 侧边栏提供项目文件树、阅读列表、书签视图

## 项目文档

- [产品需求文档](PRD.md)
- [架构设计文档](ARCHITECTURE.md)
- [开发指南](DEVELOPMENT.md)
- [变更日志](CHANGELOG.md)
- [AGENTS.md](AGENTS.md) — 开发规范

## 许可

MIT
