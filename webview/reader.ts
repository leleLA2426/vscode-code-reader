// Webview script — rendered in reader.html, communicates via postMessage

interface Token { startByte: number; endByte: number; line: number; type: string; }
interface FoldRange { startLine: number; endLine: number; }
interface ParseResult { content: string; tokens: Token[]; symbols: unknown[]; folds: FoldRange[]; }

let currentContent = "";
let currentTokens: Token[] = [];
let currentFolds: FoldRange[] = [];

// Track fold state: fold start line → collapsed?
const foldState = new Map<number, boolean>();

window.addEventListener("message", (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "loadFile":
      currentContent = msg.result.content;
      currentTokens = msg.result.tokens;
      currentFolds = msg.result.folds;
      // Reset fold state for new file
      foldState.clear();
      for (const f of currentFolds) {
        foldState.set(f.startLine, true); // all folds start collapsed
      }
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

function toggleFold(startLine: number): void {
  const current = foldState.get(startLine);
  foldState.set(startLine, !current);
  renderContent();
}

function renderContent(): void {
  const container = document.getElementById("reader-content");
  if (!container) return;

  const lines = currentContent.split("\n");

  // Build per-line token index
  const lineTokens: Map<number, Token[]> = new Map();
  for (const t of currentTokens) {
    const list = lineTokens.get(t.line) || [];
    list.push(t);
    lineTokens.set(t.line, list);
  }

  // Build collapsed line set from current fold state
  const collapsedLines: Set<number> = new Set();
  for (const f of currentFolds) {
    if (foldState.get(f.startLine) !== false) {
      // Fold is collapsed (default) or explicitly collapsed
      for (let i = f.startLine + 1; i <= f.endLine; i++) {
        collapsedLines.add(i);
      }
    }
  }

  // Build set of fold-start lines for quick lookup
  const foldStartLines = new Set<number>();
  for (const f of currentFolds) {
    foldStartLines.add(f.startLine);
  }

  container.innerHTML = "";

  for (let i = 0; i < lines.length; i++) {
    const isFoldStart = foldStartLines.has(i);
    const isCollapsed = foldState.get(i) !== false; // default true = collapsed
    const isFolded = collapsedLines.has(i);

    const lineDiv = document.createElement("div");
    lineDiv.className = `code-line${isFolded ? " fold-hidden" : ""}`;
    lineDiv.setAttribute("data-line", String(i));

    // Line number
    const lineNum = document.createElement("span");
    lineNum.className = "line-number";
    if (isFoldStart) {
      // Fold toggle button before line number
      const foldBtn = document.createElement("span");
      foldBtn.className = "fold-toggle";
      foldBtn.textContent = isCollapsed ? "\u25B6" : "\u25BC";
      foldBtn.addEventListener("click", () => toggleFold(i));
      lineNum.appendChild(foldBtn);
    }
    lineNum.appendChild(document.createTextNode(String(i + 1)));
    lineDiv.appendChild(lineNum);

    // Code content (with syntax highlighting when tokens exist)
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
      // Remaining text after last token
      if (lastEnd < lines[i].length) {
        contentSpan.appendChild(
          document.createTextNode(lines[i].slice(lastEnd))
        );
      }
    } else {
      contentSpan.textContent = lines[i];
    }

    lineDiv.appendChild(contentSpan);
    container.appendChild(lineDiv);
  }
}