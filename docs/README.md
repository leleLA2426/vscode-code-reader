# Code Reader

> VS Code 沉浸式代码阅读扩展，集成本地 AI（Ollama）逐行讲解

## 功能

- **项目文件浏览器** — 专属侧边栏，自动折叠无关目录（node_modules、dist 等）
- **沉浸式阅读面板** — 三种主题（亮色 / 暖黄 / 暗色），独立于编辑器主题
- **符号大纲** — 函数、类、接口一键跳转
- **引用追踪** — 点击符号查看项目中所有引用位置（基于 TSServer）
- **代码折叠** — 点击缩进块起始行号折叠/展开
- **AI 讲解** — 选中代码，由本地 Ollama 模型逐行解释
- **AI 对话** — 追问模式，像聊天一样深入理解代码
- **书签管理** — 标记重点行，侧边栏集中查看
- **阅读列表** — 排队阅读，不打断思路
- **专注模式** — 除选中范围外全部变暗

## 环境要求

- **VS Code** >= 1.85
- **Ollama** — [下载](https://ollama.com) 并运行 `ollama serve`
- 推荐模型：`ollama pull codellama:7b`

## 快速开始

1. 安装扩展
2. 打开项目文件夹
3. 点击左侧活动栏的 Code Reader 图标
4. 点击任意文件打开阅读面板
5. 选中代码 → 按 `Ctrl+Shift+E` 获取 AI 解释

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+R` | 在 Code Reader 中打开当前文件 |
| `Ctrl+Shift+E` | AI 解释选中的代码 |
| `Ctrl+Shift+F` | 切换专注模式 |

## 配置项

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `codeReader.ollamaBaseUrl` | `http://localhost:11434` | Ollama 服务地址 |
| `codeReader.defaultModel` | `codellama:7b` | 默认 AI 模型 |
| `codeReader.readerFontSize` | `16` | 阅读面板字号 |
| `codeReader.readerTheme` | `sepia` | 阅读主题（light / sepia / dark） |
| `codeReader.autoCollapseNodeModules` | `true` | 自动折叠无关目录 |
| `codeReader.maxFileSize` | `5000` | 大文件分页阈值（行数） |

## 开发

```bash
npm install --registry=https://registry.npmmirror.com --cache .npm-cache
npm run watch    # 文件变更自动构建
# 按 F5 启动扩展开发主机
```

详见 [开发文档](./docs/DEVELOPMENT.md)

## 许可证

MIT