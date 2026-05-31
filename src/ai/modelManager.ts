import * as vscode from 'vscode';
import { OllamaClient } from './ollamaClient';
import { getConfig, updateConfig } from '../utils/config';
import { CONFIG } from '../constants';

export class ModelManager {
  private currentModel: string;

  constructor(private client: OllamaClient) {
    this.currentModel = getConfig<string>(CONFIG.DEFAULT_MODEL);
  }

  async checkHealth(): Promise<boolean> {
    const healthy = await this.client.checkHealth();
    if (!healthy) {
      const action = await vscode.window.showWarningMessage(
        'Ollama is not running. Start it with "ollama serve" first.',
        'Open Ollama Website',
        'Dismiss',
      );
      if (action === 'Open Ollama Website') {
        vscode.env.openExternal(vscode.Uri.parse('https://ollama.com'));
      }
    }
    return healthy;
  }

  async listModels(): Promise<string[]> {
    return this.client.listModels();
  }

  async setModel(model: string): Promise<void> {
    this.currentModel = model;
    this.client.setModel(model);
    await updateConfig(CONFIG.DEFAULT_MODEL, model);
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  /** Ensure at least one model is available. Returns false if manual intervention needed. */
  async ensureModel(): Promise<boolean> {
    const models = await this.listModels();
    if (models.length > 0) {
      // Auto-select first model if current not in list
      if (!models.includes(this.currentModel)) {
        await this.setModel(models[0]);
      }
      return true;
    }

    const action = await vscode.window.showWarningMessage(
      'No Ollama models found. Would you like to pull one?',
      'Pull codellama:7b',
      'Pull llama3.2:1b',
      'Dismiss',
    );

    if (action === 'Pull codellama:7b' || action === 'Pull llama3.2:1b') {
      const modelName = action === 'Pull codellama:7b' ? 'codellama:7b' : 'llama3.2:1b';
      return this.pullWithProgress(modelName);
    }

    return false;
  }

  private async pullWithProgress(modelName: string): Promise<boolean> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Pulling ${modelName}...`,
        cancellable: true,
      },
      async (progress, token) => {
        const success = await this.client.pullModel(modelName, (status) => {
          progress.report({ message: status });
        });

        if (success) {
          await this.setModel(modelName);
          vscode.window.showInformationMessage(`${modelName} is ready!`);
        } else {
          vscode.window.showErrorMessage(`Failed to pull ${modelName}`);
        }

        token.onCancellationRequested(() => {
          vscode.window.showWarningMessage('Model pull was cancelled');
        });

        return success;
      },
    );
  }
}