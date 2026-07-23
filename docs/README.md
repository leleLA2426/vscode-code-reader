[![VSCode](https://img.shields.io/badge/VSCode-%5E1.85.0-blue)](https://code.visualstudio.com/)
[![C++](https://img.shields.io/badge/C%2B%2B-17-orange)](https://isocpp.org/)

# Code Reader - VSCode 代码阅读器插件

沉浸式代码阅读 VSCode 扩展，支持语法高亮（即将）、符号导航（即将）、调用关系图（即将），并集成本地 Ollama AI 大模型用于代码解释（即将）。

## 当前版本：v0.2.0

### 已实现

- **沉浸式阅读面板** — 代码内容渲染 + 行号显示
- **三种阅读主题** — 亮色 / 暗色 / 护眼褐，VSCode 设置实时同步
- **可调字号** — 设置实时同步
- **文件树浏览** — 侧边栏 Project Files，目录优先排序，自动折叠依赖目录
- **快捷键** — `Ctrl+Alt+R` 打开当前编辑器文件到阅读面板
- **大文件截断** — 超限自动截断 + 提示（可配置阈值）
- **中文兼容** — UTF-8 优先，自动回退 GBK 编码
- **降级保护** — C++ 原生模块不可用时自动降级纯文本，不崩溃

### 开发构建

```bash
npm install
npm run build:native   # C++ addon (需 VS2022 + Python 3.10)
npm run build:ts       # TypeScript
```

### 调试

按 F5 在 VSCode 中启动扩展开发主机。

### 文档

- [产品需求文档](PRD.md)
- [架构设计文档](ARCHITECTURE.md)
- [开发指南](DEVELOPMENT.md)
- [变更日志](CHANGELOG.md)
- [测试报告](test-report.md)
- [AGENTS.md](AGENTS.md)

## 许可

MIT