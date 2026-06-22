#!/usr/bin/env node
/**
 * bin/j-skill.mjs — npm binary entry point for the j-skill CLI.
 *
 * This file is intentionally .mjs (plain ESM JavaScript), not TypeScript,
 * because npm executes bin scripts directly via the OS shebang line before any
 * build step runs. TypeScript files cannot be executed directly by Node without
 * the --experimental-strip-types flag, which must be passed explicitly.
 *
 * This shim's sole job is to re-invoke Node with --experimental-strip-types so
 * that the actual CLI implementation (src/cli.ts) can be loaded as TypeScript at
 * runtime — no compile step required.
 *
 * Seam: process.argv is forwarded unchanged so Commander sees the real args.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = join(__dirname, '..', 'src', 'cli.ts');

const result = spawnSync(
  process.execPath,
  ['--experimental-strip-types', '--no-warnings', cli, ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env }
);

process.exit(result.status ?? 0);
