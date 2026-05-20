import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMCallOptions } from './anthropic.js';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env['GOOGLE_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'Missing GOOGLE_API_KEY environment variable. ' +
        'Set it with: export GOOGLE_API_KEY=AIza...',
    );
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function call(
  model: string,
  system: string | undefined,
  prompt: string,
  options: LLMCallOptions = {},
): Promise<string> {
  const client = getClient();

  const generativeModel = client.getGenerativeModel({
    model,
    ...(system ? { systemInstruction: system } : {}),
    generationConfig: {
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.max_tokens !== undefined ? { maxOutputTokens: options.max_tokens } : {}),
    },
  });

  const result = await generativeModel.generateContent(prompt);
  const text = result.response.text();
  if (!text) {
    throw new Error('Gemini returned no text content');
  }
  return text;
}
