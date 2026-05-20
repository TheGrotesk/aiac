import { readFile, writeFile, appendFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { FileStage } from '../types.js';
import type { ExecutionContext } from '../context.js';
import { interpolate } from '../context.js';

export async function executeFileStage(
  stage: FileStage,
  ctx: ExecutionContext,
  currentInput: string,
): Promise<string> {
  const resolvedPath = interpolate(stage.path, ctx, currentInput);
  const encoding = (stage.encoding ?? 'utf-8') as BufferEncoding;

  switch (stage.action) {
    case 'read': {
      const contents = await readFile(resolvedPath, { encoding });
      return contents;
    }

    case 'write': {
      const content = stage.content ? interpolate(stage.content, ctx, currentInput) : currentInput;
      await mkdir(dirname(resolvedPath), { recursive: true });
      await writeFile(resolvedPath, content, { encoding });
      return `Written to ${resolvedPath}`;
    }

    case 'append': {
      const content = stage.content ? interpolate(stage.content, ctx, currentInput) : currentInput;
      await mkdir(dirname(resolvedPath), { recursive: true });
      await appendFile(resolvedPath, content, { encoding });
      return `Appended to ${resolvedPath}`;
    }

    default: {
      const _exhaustive: never = stage.action;
      throw new Error(`Unknown file action: ${_exhaustive}`);
    }
  }
}
