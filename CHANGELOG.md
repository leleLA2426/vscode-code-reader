# Changelog

## v0.1.1 (2026-06-01)

### Fixed
- 淇鏂囦欢鏍戠偣鍑讳笉鎵撳紑闃呰闈㈡澘鐨勯棶棰?(BUG-01)


## v0.1.2 (2026-06-02)

### Fixed
- BUG-02: 流式渲染使用缓冲区避免 Markdown 跨 chunk 截断
- BUG-03: 移除未使用的 explanationText 变量
- BUG-04: 删除未注入的 dependencyGraph 实例
- BUG-05: 讲解面板不复位 HTML，通过 postMessage 清屏
- BUG-06: 书签变更后自动同步到阅读面板

### Improved
- SUG-01: 添加 6 个 onCommand 激活事件
- SUG-02: 聚焦模式动态排除选区（不再全屏变暗）
- SUG-03: Ollama 启动时自动重试（3 次指数退避）
- SUG-04: 大文件（>3000 行）工具栏显示标签
- SUG-05: updateConfig 增加运行时类型校验

## v0.1.0 (2026-05-31)

### Added
- Project file browser TreeView with auto-collapse
- Immersive reader panel with Light/Sepia/Dark themes
- Adjustable font size (A-/A+ buttons)
- Code folding by indentation blocks
- Symbol outline with jump-to navigation
- Reference tracking via TSServer (click to see usages)
- AI code explanation (line-by-line, overview, chat modes)
- Ollama integration with model management
- Bookmarks with sidebar view
- Reading list for queuing files
- Focus mode (dim unfocused code)
- Reading history tracking
- Keyboard shortcuts (Ctrl+Shift+R/E/F)
- VS Code settings integration