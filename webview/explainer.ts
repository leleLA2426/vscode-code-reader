(function () {
  const vscode = acquireVsCodeApi();

  const messages = document.getElementById('messages');
  const cancelBtn = document.getElementById('cancelBtn');
  const chatInput = document.getElementById('chatInput');
  const questionInput = document.getElementById('questionInput') as HTMLInputElement;
  const sendBtn = document.getElementById('sendBtn');
  const modeButtons = document.querySelectorAll('.mode-btn');

  let currentMode = 'line-by-line';
  let isStreaming = false;
  let streamingBuffer = '';    // Accumulate raw chunks for clean Markdown rendering
  let currentAiMessage: HTMLDivElement | null = null;

  // ---- Mode switching ----
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode || 'line-by-line';

      if (currentMode === 'chat') {
        chatInput?.classList.remove('hidden');
      } else {
        chatInput?.classList.add('hidden');
      }
    });
  });

  // ---- Cancel ----
  cancelBtn?.addEventListener('click', () => {
    vscode.postMessage({ type: 'cancelExplain' });
    cancelBtn.classList.add('hidden');
    isStreaming = false;
    streamingBuffer = '';
    currentAiMessage = null;
  });

  // ---- Send question ----
  sendBtn?.addEventListener('click', sendQuestion);
  questionInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendQuestion();
  });

  function sendQuestion(): void {
    const text = questionInput?.value.trim();
    if (!text) return;
    vscode.postMessage({ type: 'askQuestion', question: text });
    addMessage('user', text);
    if (questionInput) questionInput.value = '';
  }

  // ---- Message handlers from extension ----
  window.addEventListener('message', (event) => {
    const msg = event.data;

    switch (msg.type) {
      case 'explanationChunk':
        if (!isStreaming) {
          isStreaming = true;
          streamingBuffer = '';
          cancelBtn?.classList.remove('hidden');
          currentAiMessage = addMessage('ai', '');
        }
        streamingBuffer += msg.chunk;
        // Re-render entire accumulated text for clean Markdown across chunks
        if (currentAiMessage) {
          currentAiMessage.innerHTML = renderMarkdown(streamingBuffer);
        }
        messages!.scrollTop = messages!.scrollHeight;
        break;

      case 'explanationDone':
        isStreaming = false;
        cancelBtn?.classList.add('hidden');
        streamingBuffer = '';
        currentAiMessage = null;
        break;

      case 'clearMessages':
        if (messages) messages.innerHTML = '';
        break;

      case 'explanationError':
        isStreaming = false;
        cancelBtn?.classList.add('hidden');
        streamingBuffer = '';
        currentAiMessage = null;
        addMessage('error', msg.error);
        break;
    }
  });

  // ---- UI helpers ----
  function addMessage(role: 'user' | 'ai' | 'error', text: string): HTMLDivElement | null {
    if (!messages) return null;

    const div = document.createElement('div');
    div.className = `message ${role}`;

    if (role === 'ai') {
      div.innerHTML = renderMarkdown(text);
    } else {
      div.textContent = text;
    }

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function renderMarkdown(text: string): string {
    // Escape HTML first, then apply Markdown replacements
    let out = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks (multi-line)
    out = out.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Inline code
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Line breaks
    out = out.replace(/\n/g, '<br>');

    return out;
  }
})();