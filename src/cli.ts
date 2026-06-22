/**
 * cli.ts — Entry point for the j-skill CLI.
 *
 * Dispatches Deno.args to the appropriate command implementation modules in
 * src/commands/. Replaces the commander-based CLI to eliminate the npm
 * commander dependency and reduce supply-chain risk.
 *
 * Seam: add new sub-commands by importing from src/commands/ and adding a
 * branch in the dispatch block below.
 */
import { runImport } from './commands/import.ts';
import { runList } from './commands/list.ts';
import { runRender } from './commands/render.ts';
import { runExport } from './commands/export.ts';

const VERSION = '0.1.0';

function printHelp(): void {
  console.log(`j-skill v${VERSION} — A personal control plane for portable AI skills.

Usage: j-skill [command] [options]

Commands:
  import <source>                         Import a skill collection
  list                                    List available skills
  export [skills...] --target <target>    Export skills to an AI platform format
  <skill> [--copy]                        Render a named skill to stdout

Options:
  --help, -h       Show this help message
  --version, -V    Show version number

Export targets:
  copilot-chat     .github/copilot-instructions.md
  claude-code      .claude/commands/<name>.md
`);
}

const args = Deno.args;

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  printHelp();
  Deno.exit(0);
}

if (args[0] === '--version' || args[0] === '-V') {
  console.log(VERSION);
  Deno.exit(0);
}

const command = args[0];

if (command === 'import') {
  if (args.length < 2) {
    console.error("error: missing required argument '<source>'");
    Deno.exit(1);
  }
  runImport(args[1]).catch((err: Error) => {
    console.error(`error: ${err.message}`);
    process.exitCode = 1;
  });
} else if (command === 'list') {
  runList();
} else if (command === 'export') {
  const skillNames: string[] = [];
  let target: string | undefined;
  let output: string | undefined;
  let i = 1;
  while (i < args.length) {
    if (args[i] === '--target' && i + 1 < args.length) {
      target = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      output = args[++i];
    } else if (!args[i].startsWith('-')) {
      skillNames.push(args[i]);
    }
    i++;
  }
  if (!target) {
    console.error("error: required option '--target' not specified");
    process.exitCode = 1;
  } else {
    runExport(skillNames, { target, output }).catch((err: Error) => {
      console.error(`error: ${err.message}`);
      process.exitCode = 1;
    });
  }
} else if (!command.startsWith('-')) {
  // Default: render a named skill
  const copy = args.includes('--copy');
  runRender(command, { copy });
} else {
  console.error(`error: unknown option '${command}'`);
  printHelp();
  Deno.exit(1);
}
