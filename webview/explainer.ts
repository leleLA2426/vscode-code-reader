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
  let explanationText = '';

  // ---- Mode switching ----
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode || 'line-by-line';

      // Show/hide chat input
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
          cancelBtn?.classList.remove('hidden');
          addMessage('ai', '');
        }
        appendToLastMessage(msg.chunk);
        break;

      case 'explanationDone':
        isStreaming = false;
        cancelBtn?.classList.add('hidden');
        explanationText = msg.fullText;
        break;

      case 'explanationError':
        isStreaming = false;
        cancelBtn?.classList.add('hidden');
        addMessage('error', msg.error);
        break;
    }
  });

  // ---- UI helpers ----
  function addMessage(role: 'user' | 'ai' | 'error', text: string): void {
    if (!messages) return;

    const div = document.createElement('div');
    div.className = `message ${role}`;

    if (role === 'ai') {
      div.innerHTML = renderMarkdown(text);
    } else {
      div.textContent = text;
    }

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendToLastMessage(chunk: string): void {
    if (!messages) return;

    const last = messages.lastElementChild;
    if (last && last.classList.contains('ai')) {
      last.innerHTML = renderMarkdown(last.textContent + chunk);
      messages.scrollTop = messages.scrollHeight;
    }
  }

  function renderMarkdown(text: string): string {
    // Simple Markdown-like rendering
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
})();
