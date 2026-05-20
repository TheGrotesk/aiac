import type { HTTPStage } from '../types.js';
import type { ExecutionContext } from '../context.js';
import { interpolate, interpolateDeep } from '../context.js';

export async function executeHTTPStage(
  stage: HTTPStage,
  ctx: ExecutionContext,
  currentInput: string,
): Promise<string> {
  const url = interpolate(stage.url, ctx, currentInput);

  const headers: Record<string, string> = {};
  if (stage.headers) {
    for (const [key, value] of Object.entries(stage.headers)) {
      headers[key] = interpolate(value, ctx, currentInput);
    }
  }

  let bodyString: string | undefined;
  if (stage.body !== undefined) {
    const interpolatedBody = interpolateDeep(stage.body, ctx, currentInput);
    if (typeof interpolatedBody === 'string') {
      bodyString = interpolatedBody;
    } else {
      bodyString = JSON.stringify(interpolatedBody);
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
    }
  }

  const response = await fetch(url, {
    method: stage.method,
    headers,
    ...(bodyString !== undefined ? { body: bodyString } : {}),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `HTTP ${stage.method} ${url} failed with status ${response.status}: ${responseText.slice(0, 500)}`,
    );
  }

  return responseText;
}
