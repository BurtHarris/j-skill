import fs from "node:fs/promises";
import os from 'node:os';
import { spawn } from 'node:child_process';
import { DiagnosticError } from './domain/errors.ts';
import { resolveSkill } from './registry.ts';
import { parseSkillText } from './skills/frontmatter.ts';

export async function renderSkill(name: string, copyToClipboard: boolean, registryRoot?: string): Promise<string> {
  const skill = await resolveSkill(name, registryRoot);
  if (skill === null) {
    throw new Error(`Skill "${name}" was not found in the local registry.`);
  }

  const source = await fs.readFile(skill.path, 'utf8');
  const parsed = parseSkillText(source, skill.path);

  if (copyToClipboard) {
    await writeToClipboard(parsed.body);
  }

  return parsed.body;
}

export function formatError(error: unknown): string {
  if (error instanceof DiagnosticError) {
    return error.diagnostics
      .map((diagnostic) => `${diagnostic.severity.toUpperCase()}: ${diagnostic.location ?? '<unknown>'}: ${diagnostic.message}`)
      .join('\n');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function writeToClipboard(text: string): Promise<void> {
  const platform = os.platform();

  if (platform === 'win32') {
    await runClipboardCommand(
      'powershell',
      ['-NoProfile', '-Command', '$value = [Console]::In.ReadToEnd(); Set-Clipboard -Value $value'],
      text,
    );
    return;
  }

  if (platform === 'darwin') {
    await runClipboardCommand('pbcopy', [], text);
    return;
  }

  try {
    await runClipboardCommand('xclip', ['-selection', 'clipboard'], text);
  } catch {
    await runClipboardCommand('xsel', ['--clipboard', '--input'], text);
  }
}

async function runClipboardCommand(command: string, args: string[], text: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Clipboard command failed: ${command}`));
      }
    });

    child.stdin.end(text);
  });
}
