import Anthropic from '@anthropic-ai/sdk';

export interface LLMCallOptions {
  temperature?: number;
  max_tokens?: number;
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'Missing ANTHROPIC_API_KEY environment variable. ' +
        'Set it with: export ANTHROPIC_API_KEY=sk-ant-...',
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function call(
  model: string,
  system: string | undefined,
  prompt: string,
  options: LLMCallOptions = {},
): Promise<string> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model,
    max_tokens: options.max_tokens ?? 4096,
    ...(system ? { system } : {}),
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Anthropic returned no text content');
  }
  return textBlock.text;
}
