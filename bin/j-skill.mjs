#!/usr/bin/env node
/**
 * bin/j-skill.mjs — npm binary entry point for the j-skill CLI.
 *
 * This shim invokes the Deno runtime to execute the TypeScript CLI directly,
 * eliminating the need for a transpile/build step and removing npm supply-chain
 * risk for the runtime dependencies.
 *
 * To create a fully self-contained executable (no Deno required at runtime),
 * run: deno task compile
 *
 * Seam: process.argv is forwarded unchanged so the CLI sees the real args.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = join(__dirname, '..', 'src', 'cli.ts');

const result = spawnSync(
  'deno',
  ['run', '--allow-read', '--allow-write', '--allow-env', '--allow-net', '--allow-run', cli, ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env }
);

process.exit(result.status ?? 0);
