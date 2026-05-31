import type { IAIService, CodeContext } from '../types';
import type { ExplainMode } from '../constants';
import { DEFAULT_OLLAMA_URL } from '../constants';

interface OllamaTagsResponse {
  models: Array<{ name: string; modified_at: string; size: number }>;
}

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
}

export class OllamaClient implements IAIService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || DEFAULT_OLLAMA_URL;
    this.model = model || 'codellama:7b';
  }

  /** Update the active model name */
  setModel(model: string): void {
    this.model = model;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data: OllamaTagsResponse = await response.json();
      return data.models.map((m) => m.name);
    } catch {
      return [];
    }
  }

  async pullModel(modelName: string, onProgress?: (msg: string) => void): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true }),
      });

      if (!response.ok) return false;

      const reader = response.body?.getReader();
      if (!reader) return false;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.status && onProgress) onProgress(data.status);
          } catch { /* skip */ }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async explainCode(
    code: string,
    mode: ExplainMode,
    context: CodeContext,
    onChunk: (text: string) => void,
    signal: AbortSignal,
  ): Promise<string> {
    const prompt = this.buildPrompt(code, mode, context);
    let fullText = '';

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: true,
          options: {
            temperature: 0.3,
            num_predict: 2048,
          },
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk: OllamaGenerateResponse = JSON.parse(line);
            if (chunk.response) {
              fullText += chunk.response;
              onChunk(chunk.response);
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        throw err;
      }
    }

    return fullText;
  }

  private buildPrompt(code: string, mode: ExplainMode, context: CodeContext): string {
    const fileInfo = `Language: ${context.language}\nFile: ${context.fileName}`;
    const funcInfo = context.functionName ? `\nInside: ${context.functionName}()` : '';

    switch (mode) {
      case 'line-by-line':
        return `You are a code tutor. Explain each line of the following code in plain language. Be concise — one short sentence per line. Use the format:
**Line N**: explanation

${fileInfo}${funcInfo}

Code:
\`\`\`${context.language}
${code}
\`\`\``;

      case 'overview':
        return `Summarize the following code at a high level. What problem does it solve? What's the approach? What are the key patterns? Keep it to 2-3 short paragraphs.

${fileInfo}${funcInfo}

Code:
\`\`\`${context.language}
${code}
\`\`\``;

      case 'chat':
        return `You are a helpful, friendly code assistant. Answer questions about this code snippet.

${fileInfo}${funcInfo}

Code:
\`\`\`${context.language}
${code}
\`\`\`

The user will now ask questions about this code.`;

      default:
        return code;
    }
  }

  dispose(): void {
    // No cleanup needed for now
  }
}