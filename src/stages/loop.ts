import chalk from 'chalk';
import type { LoopStage, Stage } from '../types.js';
import type { ExecutionContext } from '../context.js';
import { interpolate } from '../context.js';
import { executeStage } from './index.js';
import { readLine } from '../stdin.js';

const DONE_WORDS = new Set(['done', 'ship', 'yes', 'y', 'ok', 'approve', 'approved', 'lgtm']);
const STOP_WORDS = new Set(['stop', 'quit', 'abort', 'exit', 'cancel', 'no']);

export async function executeLoopStage(
  stage: LoopStage,
  ctx: ExecutionContext,
  currentInput: string,
): Promise<string> {
  const maxIter = stage.max_iterations ?? 10;
  let iterInput = currentInput;
  let lastOutput = currentInput;

  for (let iteration = 1; iteration <= maxIter; iteration++) {
    // Make iteration number available inside sub-stage prompts
    ctx.vars['loop_iteration'] = String(iteration);

    console.log(chalk.bold.cyan(`\n[loop: ${stage.id}] iteration ${iteration}/${maxIter}`));

    for (const subStage of stage.stages as Stage[]) {
      const subOutput = await executeStage(subStage, ctx, iterInput);
      ctx.stages[subStage.id] = { output: subOutput };
      iterInput = subOutput;
    }
    lastOutput = iterInput;

    // Built-in approval gate
    if (stage.approve) {
      const response = await promptApproval(stage, iteration, maxIter, lastOutput, ctx);

      if (STOP_WORDS.has(response.toLowerCase().trim())) {
        console.log(chalk.yellow(`[loop: ${stage.id}] aborted by user at iteration ${iteration}`));
        break;
      }

      if (DONE_WORDS.has(response.toLowerCase().trim())) {
        console.log(chalk.green(`[loop: ${stage.id}] approved by user after iteration ${iteration}`));
        break;
      }

      // Any other text = feedback for the next iteration
      ctx.vars['loop_feedback'] = response;
      console.log(chalk.gray(`[loop: ${stage.id}] feedback stored, running iteration ${iteration + 1}...`));
      iterInput = lastOutput; // reset so next iter starts from loop output, not feedback text
      continue;
    }

    // Evaluate until condition
    if (evaluateUntil(stage.until, lastOutput, ctx)) {
      console.log(chalk.green(`[loop: ${stage.id}] condition met after ${iteration} iteration(s)`));
      break;
    }

    if (iteration === maxIter) {
      console.log(chalk.yellow(
        `[loop: ${stage.id}] reached max_iterations (${maxIter}) without satisfying until condition.\n` +
        `  condition: ${stage.until}\n` +
        `  last output: ${lastOutput.slice(0, 200)}${lastOutput.length > 200 ? '…' : ''}`,
      ));
    }
  }

  delete ctx.vars['loop_iteration'];
  return lastOutput;
}

function evaluateUntil(condition: string, output: string, ctx: ExecutionContext): boolean {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('output', 'stages', `return (${condition});`);
    return Boolean(fn(output, ctx.stages));
  } catch (err) {
    throw new Error(
      `Error evaluating loop 'until' condition "${condition}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function promptApproval(
  stage: LoopStage,
  iteration: number,
  maxIter: number,
  lastOutput: string,
  ctx: ExecutionContext,
): Promise<string> {
  const message = stage.approve_message
    ? interpolate(stage.approve_message, ctx, lastOutput)
    : lastOutput;

  process.stdout.write('\n');
  console.log(chalk.bold.yellow(`┌─ [loop: ${stage.id}] iteration ${iteration}/${maxIter} — review `) + chalk.yellow('─'.repeat(20)));
  console.log(message);
  console.log(chalk.yellow('└' + '─'.repeat(59)));
  process.stdout.write(chalk.bold.cyan('> ') + chalk.gray('(done/ship/yes  ·  stop/abort  ·  or type feedback) '));

  if (!process.stdin.isTTY) {
    throw new Error(
      `Loop stage "${stage.id}" requires interactive input (approve: true) but stdin is not a TTY.`,
    );
  }

  return readLine();
}
