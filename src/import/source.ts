import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from 'node:child_process';

export interface ResolvedImportSource {
  kind: 'local' | 'github';
  original: string;
  sourceLabel: string;
  workingDirectory: string;
  cleanup(): Promise<void>;
}

export async function resolveImportSource(input: string): Promise<ResolvedImportSource> {
  if (await isDirectory(input)) {
    return {
      kind: 'local',
      original: input,
      sourceLabel: path.resolve(input),
      workingDirectory: path.resolve(input),
      cleanup: async () => undefined,
    };
  }

  const github = parseGitHubSource(input);
  if (github !== null) {
    return downloadGitHubRepository(github.owner, github.repo, input);
  }

  throw new Error(`Unsupported import source: ${input}`);
}

function parseGitHubSource(input: string): { owner: string; repo: string } | null {
  const shorthandMatch = input.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (shorthandMatch) {
    return { owner: shorthandMatch[1], repo: shorthandMatch[2] };
  }

  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com') {
      return null;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length < 2) {
      return null;
    }

    return {
      owner: segments[0],
      repo: segments[1].replace(/\.git$/, ''),
    };
  } catch {
    return null;
  }
}

async function downloadGitHubRepository(owner: string, repo: string, original: string): Promise<ResolvedImportSource> {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'j-skill-import-'));
  const extractRoot = path.join(temporaryRoot, 'source');
  await runCommand('git', ['clone', '--depth', '1', `https://github.com/${owner}/${repo}.git`, extractRoot]);

  return {
    kind: 'github',
    original,
    sourceLabel: `https://github.com/${owner}/${repo}`,
    workingDirectory: extractRoot,
    cleanup: async () => {
      await fs.rm(temporaryRoot, { recursive: true, force: true });
    },
  };
}

async function isDirectory(targetPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function runCommand(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore' });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
      }
    });
  });
}
