# DEVELOPMENT - Code Reader 开发指南

## 环境准备

### 必需工具

- **Windows 10/11**
- **Visual Studio 2022**（含 "使用 C++ 的桌面开发" 工作负载）
- **Node.js** 20.x（推荐 20.11+）
- **Python** 3.x（node-gyp 编译依赖）
- **Ollama** [ollama.com](https://ollama.com)

### 安装依赖

```bash
# 克隆项目
git clone <repo-url>
cd code-reader

# 安装 Node 依赖
npm install

# 拉取推荐模型（可选，用于测试 AI 功能）
ollama pull codellama:7b
ollama pull deepseek-coder:6.7b
```

## 项目结构

```
code-reader/
├── src/           # TypeScript 源代码
├── native/        # C++ 源代码
│   ├── src/       # C++ 实现
│   └── deps/      # C++ 第三方依赖
├── webview/       # Webview HTML/TS
├── media/         # 图标、CSS
├── docs/          # 文档
└── test/          # 测试
```

## 开发命令

```bash
# 编译 C++ addon（Debug 模式）
npm run build:native

# 编译 C++ addon（Release 模式）
npm run build:native:release

# 编译 TypeScript
npm run build:ts

# 监听模式（自动重新编译）
npm run watch

# 运行 C++ 单元测试
npm run test:native

# 运行 TS 测试
npm run test:ts

# 运行 E2E 测试
npm run test:e2e

# Lint
npm run lint

# 格式化
npm run format
```

## C++ 编码规范

- **标准**：C++17
- **内存管理**：使用 `std::unique_ptr` / `std::shared_ptr`，禁止裸指针所有权
- **错误处理**：使用 `std::optional<T>` / 自定义 `Result<T>` 类型，不抛异常跨 N-API 边界
- **命名**：类名 PascalCase、函数 camelCase、常量 kConstantName、成员变量 trailing _
- **注释**：公共 API 使用 Doxygen 风格注释

## 添加新语言支持

1. 在 `native/deps/tree-sitter/` 下添加目标语言 grammar
2. 注册到 `parser.cpp` 的 `initGrammars()` 函数
3. 在 `src/utils/config.ts` 中添加文件扩展名映射
4. 更新 `README.md` 的语言列表

## 调试

### 调试 C++ addon

1. 在 VSCode 中设置断点于 C++ 源文件
2. 使用 `.vscode/launch.json` 中的 "Debug Extension (C++)" 配置
3. 按 F5 启动调试

### 调试 Webview

1. 按 `Ctrl+Shift+P` -> "Developer: Toggle Developer Tools"
2. 在弹出的 Chrome DevTools 中调试 reader/explainer webview

## 发布

```bash
# 打包扩展
npm run package

# 生成 .vsix
npx vsce package
```
