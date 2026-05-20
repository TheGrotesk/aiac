import chalk from 'chalk';
import type { InputStage } from '../types.js';
import type { ExecutionContext } from '../context.js';
import { interpolate } from '../context.js';
import { readLine } from '../stdin.js';

export async function executeInputStage(
  stage: InputStage,
  ctx: ExecutionContext,
  currentInput: string,
): Promise<string> {
  const message = interpolate(stage.message, ctx, currentInput);

  process.stdout.write('\n');
  console.log(chalk.bold.yellow('┌─ Human review required ') + chalk.yellow('─'.repeat(35)));
  console.log(message);
  console.log(chalk.yellow('└' + '─'.repeat(59)));

  if (!process.stdin.isTTY) {
    throw new Error(
      `Stage "${stage.id}" requires interactive input but stdin is not a TTY.\n` +
      'Run the workflow in an interactive terminal.',
    );
  }

  const hint = stage.placeholder ? chalk.gray(` (${stage.placeholder})`) : '';
  process.stdout.write(chalk.bold.cyan('> ') + hint);

  return readLine();
}
