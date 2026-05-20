import OpenAI from 'openai';
import type { LLMCallOptions } from './anthropic.js';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'Missing OPENAI_API_KEY environment variable. ' +
        'Set it with: export OPENAI_API_KEY=sk-...',
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function call(
  model: string,
  system: string | undefined,
  prompt: string,
  options: LLMCallOptions = {},
): Promise<string> {
  const openai = getClient();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await openai.chat.completions.create({
    model,
    messages,
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(options.max_tokens !== undefined ? { max_tokens: options.max_tokens } : {}),
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned no content');
  }
  return content;
}
