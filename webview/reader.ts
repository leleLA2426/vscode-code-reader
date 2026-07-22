// Webview script — rendered in reader.html, communicates via postMessage

interface Token { startByte: number; endByte: number; line: number; type: string; }
interface FoldRange { startLine: number; endLine: number; }
interface ParseResult { content: string; tokens: Token[]; symbols: unknown[]; folds: FoldRange[]; }

let currentContent = "";
let currentTokens: Token[] = [];
let currentFolds: FoldRange[] = [];

window.addEventListener("message", (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "loadFile":
      currentContent = msg.result.content;
      currentTokens = msg.result.tokens;
      currentFolds = msg.result.folds;
      renderContent();
      break;
    case "updateTheme":
      if (msg.theme) document.body.className = `theme-${msg.theme}`;
      break;
    case "updateFontSize":
      if (msg.size)
        document.documentElement.style.setProperty("--reader-font-size", `${msg.size}px`);
      break;
  }
});

function renderContent(): void {
  const container = document.getElementById("reader-content");
  if (!container) return;

  const lines = currentContent.split("\n");

  // 构建每行 token 索引
  const lineTokens: Map<number, Token[]> = new Map();
  for (const t of currentTokens) {
    const list = lineTokens.get(t.line) || [];
    list.push(t);
    lineTokens.set(t.line, list);
  }

  // 构建折叠行集合
  const collapsedLines: Set<number> = new Set();
  for (const f of currentFolds) {
    for (let i = f.startLine + 1; i <= f.endLine; i++) {
      collapsedLines.add(i);
    }
  }

  container.innerHTML = "";

  for (let i = 0; i < lines.length; i++) {
    const isFolded = collapsedLines.has(i);
    const lineDiv = document.createElement("div");
    lineDiv.className = `code-line${isFolded ? " fold-hidden" : ""}`;
    lineDiv.setAttribute("data-line", String(i));

    // 行号
    const lineNum = document.createElement("span");
    lineNum.className = "line-number";
    lineNum.textContent = String(i + 1);
    lineDiv.appendChild(lineNum);

    // 代码内容（带高亮）
    const contentSpan = document.createElement("span");
    contentSpan.className = "line-content";

    const tokens = lineTokens.get(i);
    if (tokens && tokens.length > 0) {
      let lastEnd = 0;
      for (const tok of tokens) {
        if (tok.startByte > lastEnd) {
          contentSpan.appendChild(
            document.createTextNode(currentContent.slice(lastEnd, tok.startByte))
          );
        }
        const tokenSpan = document.createElement("span");
        tokenSpan.className = `token-${tok.type}`;
        tokenSpan.textContent = currentContent.slice(tok.startByte, tok.endByte);
        contentSpan.appendChild(tokenSpan);
        lastEnd = tok.endByte;
      }
    } else {
      contentSpan.textContent = lines[i];
    }

    lineDiv.appendChild(contentSpan);
    container.appendChild(lineDiv);
  }
}
