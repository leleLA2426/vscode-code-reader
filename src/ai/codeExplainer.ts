import type { ExplainRequest } from '../types';
import { OllamaClient } from './ollamaClient';

export class CodeExplainer {
  private currentController: AbortController | null = null;

  constructor(private client: OllamaClient) {}

  async explain(request: ExplainRequest): Promise<string> {
    this.cancel();

    const controller = new AbortController();
    this.currentController = controller;

    try {
      const fullText = await this.client.explainCode(
        request.code,
        request.mode,
        request.context,
        request.onChunk,
        controller.signal,
      );
      request.onDone(fullText);
      return fullText;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return '';
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      request.onError(message);
      return '';
    } finally {
      if (this.currentController === controller) {
        this.currentController = null;
      }
    }
  }

  cancel(): void {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
  }

  get isBusy(): boolean {
    return this.currentController !== null;
  }
}