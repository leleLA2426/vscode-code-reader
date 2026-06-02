(function () {
  const vscode = acquireVsCodeApi();

  let selectedLineRange: { start: number; end: number } | null = null;
  let currentFontSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--reader-font-size')) || 16;

  const codeTable = document.getElementById('code-table') as HTMLTableElement;
  const outlinePanel = document.getElementById('outline-panel');
  const refsContent = document.getElementById('refs-content');

  // =============================================
  // Toolbar
  // =============================================

  document.querySelector('.theme-select')?.addEventListener('change', (e) => {
    const theme = (e.target as HTMLSelectElement).value;
    document.body.dataset.theme = theme;
    vscode.postMessage({ type: 'switchTheme', theme });
  });

  document.querySelectorAll('.toolbar-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = (btn as HTMLElement).dataset.action;
      switch (action) {
        case 'decrease-font':
          currentFontSize = Math.max(10, currentFontSize - 2);
          applyFontSize();
          break;
        case 'increase-font':
          currentFontSize = Math.min(40, currentFontSize + 2);
          applyFontSize();
          break;
        case 'toggle-outline':
          outlinePanel?.classList.toggle('visible');
          break;
      }
    });
  });

  function applyFontSize(): void {
    document.documentElement.style.setProperty('--reader-font-size', `${currentFontSize}px`);
    vscode.postMessage({ type: 'changeFontSize', size: currentFontSize });
  }

  // =============================================
  // Code folding
  // =============================================

  if (codeTable) {
    codeTable.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const row = target.closest('tr') as HTMLTableRowElement;
      if (!row) return;

      if (target.classList.contains('line-number') && row.dataset.foldStart === 'true') {
        toggleFold(row);
        return;
      }

      handleLineSelection(row, e.shiftKey);
    });
  }

  function toggleFold(row: HTMLTableRowElement): void {
    const startLine = parseInt(row.dataset.line || '0', 10);
    const startIndent = getIndentLevel(row);

    if (row.classList.contains('folded')) {
      expandFold(row);
    } else {
      collapseFold(row, startLine, startIndent);
    }
  }

  function collapseFold(row: HTMLTableRowElement, startLine: number, startIndent: number): void {
    row.classList.add('folded');
    let next = row.nextElementSibling as HTMLTableRowElement | null;
    let hiddenCount = 0;

    while (next) {
      const line = parseInt(next.dataset.line || '0', 10);
      if (line <= startLine) break;
      const indent = getIndentLevel(next);
      if (indent < 0) { next = next.nextElementSibling as HTMLTableRowElement; continue; }
      if (indent > startIndent) {
        next.classList.add('fold-hidden');
        hiddenCount++;
      } else {
        break;
      }
      next = next.nextElementSibling as HTMLTableRowElement;
    }

    const lineNumCell = row.querySelector('.line-number') as HTMLElement;
    if (lineNumCell) {
      lineNumCell.dataset.originalText = lineNumCell.textContent || '';
      lineNumCell.innerHTML = `&#9654; ${startLine + 1}-${startLine + hiddenCount + 1}`;
    }
  }

  function expandFold(row: HTMLTableRowElement): void {
    row.classList.remove('folded');
    let next = row.nextElementSibling as HTMLTableRowElement | null;
    const startLine = parseInt(row.dataset.line || '0', 10);

    while (next) {
      const line = parseInt(next.dataset.line || '0', 10);
      if (line <= startLine) break;
      if (next.classList.contains('fold-hidden')) {
        next.classList.remove('fold-hidden');
      } else {
        break;
      }
      next = next.nextElementSibling as HTMLTableRowElement;
    }

    const lineNumCell = row.querySelector('.line-number') as HTMLElement;
    if (lineNumCell?.dataset.originalText) {
      lineNumCell.textContent = lineNumCell.dataset.originalText;
    }
  }

  function getIndentLevel(row: HTMLTableRowElement): number {
    const cls = row.className;
    if (cls.includes('indent-0')) return 0;
    if (cls.includes('indent-1')) return 1;
    if (cls.includes('indent-2')) return 2;
    if (cls.includes('indent-3')) return 3;
    return -1;
  }

  // =============================================
  // Line selection
  // =============================================

  function handleLineSelection(row: HTMLTableRowElement, shiftKey: boolean): void {
    const lineNumText = row.querySelector('.line-number')?.textContent?.replace(/^\D+/g, '') || '0';
    const lineNumber = parseInt(lineNumText, 10);
    if (!lineNumber) return;

    if (shiftKey && selectedLineRange) {
      const start = Math.min(selectedLineRange.start, lineNumber);
      const end = Math.max(selectedLineRange.start, lineNumber);
      selectRange(start, end);
    } else {
      if (selectedLineRange?.start === lineNumber && selectedLineRange?.end === lineNumber) {
        clearSelection();
        return;
      }
      selectRange(lineNumber, lineNumber);
    }

    // Request references for the clicked line
    vscode.postMessage({ type: 'requestReferences', line: lineNumber - 1 });
  }

  function selectRange(start: number, end: number): void {
    clearSelection();
    selectedLineRange = { start, end };

    const lines: string[] = [];
    codeTable?.querySelectorAll('tr').forEach((r) => {
      const ln = parseInt((r as HTMLTableRowElement).dataset.line || '0', 10) + 1;
      if (ln >= start && ln <= end) {
        r.classList.add('selected');
        lines.push(r.querySelector('.line-content code')?.textContent || '');
      }
    });

    const filePath = document.body.dataset.filepath || '';
    vscode.postMessage({
      type: 'selection',
      text: lines.join('\n'),
      startLine: start - 1,
      endLine: end - 1,
      filePath,
    });
  }

  function clearSelection(): void {
    codeTable?.querySelectorAll('tr.selected').forEach((r) => r.classList.remove('selected'));
    selectedLineRange = null;
  }

  // =============================================
  // Outline navigation
  // =============================================

  document.getElementById('outline-panel')?.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest('a[data-line]') as HTMLAnchorElement;
    if (!link) return;
    e.preventDefault();

    const targetLine = parseInt(link.dataset.line || '0', 10);
    const row = codeTable?.querySelector(`tr[data-line="${targetLine}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('flash');
      setTimeout(() => row.classList.remove('flash'), 1500);
    }
  });

  // =============================================
  // Right-click bookmark
  // =============================================

  codeTable?.addEventListener('contextmenu', (e) => {
    const row = (e.target as HTMLElement).closest('tr') as HTMLTableRowElement;
    if (!row) return;
    const lineNumber = parseInt(row.dataset.line || '0', 10);
    const filePath = document.body.dataset.filepath || '';
    vscode.postMessage({ type: 'addBookmark', line: lineNumber, filePath });
  });

  // =============================================
  // Keyboard
  // =============================================

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') clearSelection();
  });

  // =============================================
  // Messages from extension
  // =============================================

  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'updateTheme':
        document.body.dataset.theme = msg.theme;
        break;
      case 'updateFontSize':
        currentFontSize = msg.size;
        document.documentElement.style.setProperty('--reader-font-size', `${msg.size}px`);
        break;
      case 'updateReferences':
        if (refsContent) {
          refsContent.innerHTML = buildRefsHtml(msg);
        }
        break;
    }
  });

  function buildRefsHtml(data: { symbolName: string; edges: Array<{ from: string; filePath: string; line: number }>; referenceCount: number; definition: string }): string {
    if (!data.symbolName) return '<div class="refs-hint">Click a symbol name to see references</div>';

    let html = `<div class="refs-symbol">${escHtml(data.symbolName)}</div>`;

    if (data.definition) {
      html += `<div class="refs-def">Defined in: ${escHtml(data.definition)}</div>`;
    }

    html += `<div class="refs-count">${data.referenceCount} reference${data.referenceCount !== 1 ? 's' : ''}</div>`;

    if (data.edges.length > 0) {
      html += '<ul class="refs-list">';
      const unique = new Map<string, { from: string; line: number }>();
      for (const edge of data.edges) {
        const key = `${edge.filePath}:${edge.line}`;
        if (!unique.has(key)) unique.set(key, { from: edge.from, line: edge.line });
      }

      let count = 0;
      for (const [filePath, info] of unique) {
        if (count++ >= 20) { html += '<li class="refs-more">... and more</li>'; break; }
        const fileName = filePath.split(/[/\\]/).pop() || filePath;
        html += `<li class="refs-item">
          <span class="refs-file">${escHtml(fileName)}</span>
          <span class="refs-line">:${info.line + 1}</span>
        </li>`;
      }
      html += '</ul>';
    }

    return html;
  }

  function escHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Update file info for large files
  const totalLines = codeTable?.querySelectorAll('tr').length || 0;
  if (totalLines > 3000) {
    const info = document.querySelector('.file-lines');
    if (info) info.textContent = totalLines + ' lines (large file)';
  }

  // ---- Signal ready ----
  vscode.postMessage({ type: 'ready' });
})();