// Webview script 闂?rendered in reader.html, communicates via postMessage

interface Token { startByte: number; endByte: number; line: number; type: string; }
interface FoldRange { startLine: number; endLine: number; }
interface ParseResult { content: string; tokens: Token[]; symbols: unknown[]; folds: FoldRange[]; }

let currentContent = "";
let currentTokens: Token[] = [];
let currentFolds: FoldRange[] = [];
const foldState = new Map<number, boolean>();

window.addEventListener("message", (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "loadFile":
      currentContent = msg.result.content;
      currentTokens = msg.result.tokens;
      currentFolds = msg.result.folds;
      foldState.clear();
      for (const f of currentFolds) {
        foldState.set(f.startLine, false);
      }
      renderContent();
      if (msg.scrollToLine !== undefined) {
        setTimeout(() => {
          const el = document.querySelector('.code-line[data-line="' + msg.scrollToLine + '"]');
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                      el.classList.add('jump-highlight');
                      setTimeout(() => el.classList.remove('jump-highlight'), 2000);
        }, 100);
      }
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

  // Precompute byte offset for the start of each line
  const lineStartBytes: number[] = [];
  let bytePos = 0;
  for (let i = 0; i < lines.length; i++) {
    lineStartBytes.push(bytePos);
    bytePos += lines[i].length + 1; // +1 for the newline
  }

  // Build per-line token index
  const lineTokens: Map<number, Token[]> = new Map();
  for (const t of currentTokens) {
    const list = lineTokens.get(t.line) || [];
    list.push(t);
    lineTokens.set(t.line, list);
  }

  // Build collapsed line set from fold state
  const collapsedLines: Set<number> = new Set();
  for (const f of currentFolds) {
    if (foldState.get(f.startLine) !== false) {
      for (let i = f.startLine + 1; i <= f.endLine; i++) {
        collapsedLines.add(i);
      }
    }
  }

  const foldStartLines = new Set<number>();
  for (const f of currentFolds) {
    foldStartLines.add(f.startLine);
  }

  container.innerHTML = "";

  for (let i = 0; i < lines.length; i++) {
    const isFoldStart = foldStartLines.has(i);
    const isCollapsed = foldState.get(i) !== false;
    const isFolded = collapsedLines.has(i);

    const lineDiv = document.createElement("div");
    lineDiv.className = `code-line${isFolded ? " fold-hidden" : ""}`;
    lineDiv.setAttribute("data-line", String(i));

    // Line number + optional fold toggle
    const lineNum = document.createElement("span");
    lineNum.className = "line-number";
    if (isFoldStart) {
      const foldBtn = document.createElement("span");
      foldBtn.className = "fold-toggle";
      foldBtn.textContent = isCollapsed ? "\u25B6" : "\u25BC";
      foldBtn.addEventListener("click", () => toggleFold(i));
      lineNum.appendChild(foldBtn);
    }
    lineNum.appendChild(document.createTextNode(String(i + 1)));
    lineDiv.appendChild(lineNum);

    // Code content with syntax highlighting
    const contentSpan = document.createElement("span");
    contentSpan.className = "line-content";

    const tokens = lineTokens.get(i);
    const lineStart = lineStartBytes[i];
    const lineStr = lines[i];

    if (tokens && tokens.length > 0) {
      let lastEnd = 0; // relative position within this line
      for (const tok of tokens) {
        // Convert absolute byte/char index to line-relative
        const relStart = tok.startByte - lineStart;
        const relEnd = tok.endByte - lineStart;

        if (relStart > lastEnd) {
          contentSpan.appendChild(
            document.createTextNode(lineStr.slice(lastEnd, relStart))
          );
        }
        const tokenSpan = document.createElement("span");
        tokenSpan.className = `token-${tok.type}`;
        tokenSpan.textContent = lineStr.slice(relStart, relEnd);
        contentSpan.appendChild(tokenSpan);
        lastEnd = relEnd;
      }
      if (lastEnd < lineStr.length) {
        contentSpan.appendChild(
          document.createTextNode(lineStr.slice(lastEnd))
        );
      }
    } else {
      contentSpan.textContent = lineStr;
    }

    lineDiv.appendChild(contentSpan);
    container.appendChild(lineDiv);
  }
}
