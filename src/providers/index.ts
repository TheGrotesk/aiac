import type { Provider } from '../types.js';
import type { LLMCallOptions } from './anthropic.js';

export interface LLMProvider {
  call(
    model: string,
    system: string | undefined,
    prompt: string,
    options?: LLMCallOptions,
  ): Promise<string>;
}

const PROVIDER_ENV_KEYS: Record<Provider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  gemini: 'GOOGLE_API_KEY',
};

export function checkProviderKey(provider: Provider): void {
  const key = PROVIDER_ENV_KEYS[provider];
  if (!process.env[key]) {
    throw new Error(
      `Missing ${key} environment variable required for provider "${provider}".`,
    );
  }
}

export async function getProvider(name: Provider): Promise<LLMProvider> {
  checkProviderKey(name);

  switch (name) {
    case 'anthropic': {
      const mod = await import('./anthropic.js');
      return { call: mod.call };
    }
    case 'openai': {
      const mod = await import('./openai.js');
      return { call: mod.call };
    }
    case 'gemini': {
      const mod = await import('./gemini.js');
      return { call: mod.call };
    }
    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}

/**
 * Return the list of providers used by a workflow so callers can
 * pre-flight check all required API keys before starting execution.
 */
export { PROVIDER_ENV_KEYS };
