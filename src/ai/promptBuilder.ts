import type { ExplainMode } from '../constants';
import type { CodeContext } from '../types';

export function buildPrompt(
  code: string,
  mode: ExplainMode,
  context: CodeContext,
): string {
  switch (mode) {
    case 'line-by-line':
      return buildLineByLinePrompt(code, context);
    case 'overview':
      return buildOverviewPrompt(code, context);
    case 'chat':
      return buildChatPrompt(code, context);
    default:
      return code;
  }
}

function buildLineByLinePrompt(code: string, ctx: CodeContext): string {
  return `Explain the following code line by line. For each line, state what it does in simple terms.

Language: ${ctx.language}
File: ${ctx.fileName}${ctx.functionName ? `\nFunction: ${ctx.functionName}` : ''}

Code:
\`\`\`${ctx.language}
${code}
\`\`\``;
}

function buildOverviewPrompt(code: string, ctx: CodeContext): string {
  return `Summarize this code at a high level. Focus on purpose, algorithms, and patterns.

Language: ${ctx.language}
File: ${ctx.fileName}${ctx.functionName ? `\nFunction: ${ctx.functionName}` : ''}

Code:
\`\`\`${ctx.language}
${code}
\`\`\``;
}

function buildChatPrompt(code: string, ctx: CodeContext): string {
  return `You are a code assistant. Answer questions about this code.

Language: ${ctx.language}
File: ${ctx.fileName}

Code:
\`\`\`${ctx.language}
${code}
\`\`\``;
}
