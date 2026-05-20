import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import type { ShellStage } from '../types.js';
import type { ExecutionContext } from '../context.js';
import { interpolate } from '../context.js';

const execAsync = promisify(exec);

export async function executeShellStage(
  stage: ShellStage,
  ctx: ExecutionContext,
  currentInput: string,
): Promise<string> {
  const command = interpolate(stage.command, ctx, currentInput);
  const cwd = stage.workdir ? interpolate(stage.workdir, ctx, currentInput) : undefined;

  if (stage.interactive) {
    console.log(chalk.gray('  (interactive — exit the session to continue the workflow)\n'));

    return new Promise<string>((resolve, reject) => {
      const child = spawn(command, {
        shell: true,
        stdio: 'inherit',
        ...(cwd ? { cwd } : {}),
        env: { ...process.env, ...ctx.env },
      });

      child.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.log(chalk.yellow(`\n[${stage.id}] session exited with code ${code} — continuing workflow`));
        }
        resolve('interactive session completed');
      });

      child.on('error', reject);
    });
  }

  const { stdout, stderr } = await execAsync(command, {
    ...(cwd ? { cwd } : {}),
    env: { ...process.env, ...ctx.env },
  }).catch((err: NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number }) => {
    const message = err.stderr ?? err.message ?? 'Unknown error';
    throw new Error(
      `Shell command failed (exit ${err.code ?? 1}): ${message.trim()}`,
    );
  });

  if (stderr) {
    process.stderr.write(`[shell stderr] ${stderr}`);
  }

  return stdout;
}
