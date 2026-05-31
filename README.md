# 📖 Code Reader

> Immersive code reading experience for VS Code, powered by local AI (Ollama)

![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.85-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **📂 Project File Browser** — Browse files in a dedicated sidebar, auto-collapse noise (node_modules, dist, etc.)
- **📖 Immersive Reader Panel** — Read code in a beautifully formatted view with 3 themes (Light / Sepia / Dark)
- **🧭 Symbol Outline** — Jump between functions, classes, and interfaces with one click
- **🔗 Reference Tracking** — Click any symbol to see where it''s used across the project (powered by TSServer)
- **📁 Code Folding** — Collapse indented blocks by clicking line numbers
- **🤖 AI Explanations** — Select code and get line-by-line explanations from a local Ollama model
- **💬 AI Chat** — Ask follow-up questions about the code
- **📝 Bookmarks** — Mark lines with bookmarks, view them in the sidebar
- **📚 Reading List** — Queue files for focused reading sessions
- **🎯 Focus Mode** — Dim everything except the current selection

## Requirements

- **VS Code** >= 1.85
- **Ollama** — [Download](https://ollama.com) and run `ollama serve`
- A model (recommended: `ollama pull codellama:7b`)

## Quick Start

1. Install the extension
2. Open a project folder
3. Click the 📖 Code Reader icon in the activity bar
4. Click any file to open the reader panel
5. Select code → press `Ctrl+Shift+E` for AI explanation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+R` | Open current file in Code Reader |
| `Ctrl+Shift+E` | Explain selected code with AI |
| `Ctrl+Shift+F` | Toggle Focus Mode |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `codeReader.ollamaBaseUrl` | `http://localhost:11434` | Ollama server URL |
| `codeReader.defaultModel` | `codellama:7b` | Default AI model |
| `codeReader.readerFontSize` | `16` | Reader panel font size |
| `codeReader.readerTheme` | `sepia` | Reader theme (`light`, `sepia`, `dark`) |
| `codeReader.autoCollapseNodeModules` | `true` | Hide noisy directories in file tree |
| `codeReader.maxFileSize` | `5000` | Lines before pagination kicks in |

## Development

```bash
npm install --registry=https://registry.npmmirror.com --cache .npm-cache
npm run watch    # Auto-rebuild on changes
# Press F5 to launch Extension Development Host
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for full architecture and roadmap.

## License

MIT