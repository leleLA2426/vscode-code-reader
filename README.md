# Code Reader

> VS Code 沉浸式代码阅读扩展，集成本地 AI（Ollama）逐行讲解

## 功能

- 🗂️ 项目文件浏览器 — 自动折叠无关目录
- 📖 沉浸式阅读面板 — 三种主题，独立排版
- 🧭 符号大纲 — 一键跳转函数/类/接口
- 🔗 引用追踪 — TSServer 查找所有引用
- 📁 代码折叠 — 缩进块折叠
- 🤖 AI 讲解 — Ollama 本地模型逐行解释
- 💬 AI 对话 — 追问模式
- 📝 书签 + 阅读列表
- 🎯 专注模式

## 环境要求

- VS Code >= 1.85
- [Ollama](https://ollama.com) + 推荐 `ollama pull codellama:7b`

## 快速开始

1. 安装扩展
2. 打开项目 → 点击左侧 Code Reader 图标
3. 点击文件打开阅读面板
4. 选中代码 → `Ctrl+Shift+E` AI 解释

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+R` | 打开阅读器 |
| `Ctrl+Shift+E` | AI 解释 |
| `Ctrl+Shift+F` | 专注模式 |

## 配置项

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `codeReader.ollamaBaseUrl` | `http://localhost:11434` | Ollama 地址 |
| `codeReader.defaultModel` | `codellama:7b` | 默认模型 |
| `codeReader.readerFontSize` | `16` | 字号 |
| `codeReader.readerTheme` | `sepia` | 主题 |
| `codeReader.maxFileSize` | `5000` | 大文件阈值 |

## 文档

- [开发文档](./docs/DEVELOPMENT.md)
- [测试报告](./docs/TEST_REPORT.md)
- [更新日志](./docs/CHANGELOG.md)

## 许可证

MIT