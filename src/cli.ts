/**
 * cli.ts — Entry point for the j-skill CLI.
 *
 * Registers all top-level Commander commands and wires them to their
 * implementation modules in src/commands/. The render action doubles as the
 * default (no-subcommand) action and must be registered last so that named
 * sub-commands take precedence.
 *
 * Seam: add new sub-commands here by importing from src/commands/ and calling
 * program.command(...).action(...).
 */
import { createCommand } from 'commander';
import { runImport } from './commands/import.ts';
import { runList } from './commands/list.ts';
import { runRender } from './commands/render.ts';
import { runExport } from './commands/export.ts';

const program = createCommand('j-skill');
program.description('A personal control plane for portable AI skills.');
program.version('0.1.0');

program
  .command('import <source>')
  .description('Import a skill collection from GitHub, a local path, or a GitHub URL')
  .action((source: string) => {
    runImport(source).catch(err => {
      console.error(`error: ${(err as Error).message}`);
      process.exitCode = 1;
    });
  });

program
  .command('list')
  .description('List available skills')
  .action(() => {
    runList();
  });

program
  .command('export [skills...]')
  .description('Export skills to an AI platform format')
  .requiredOption('--target <target>', 'export target: copilot-chat, claude-code')
  .option('--output <path>', 'output path or directory (default depends on target)')
  .action((skills: string[], options: { target: string; output?: string }) => {
    runExport(skills, options).catch(err => {
      console.error(`error: ${(err as Error).message}`);
      process.exitCode = 1;
    });
  });

// Default: render a named skill (must be placed after named sub-commands)
program
  .argument('[skill]', 'skill name to render')
  .option('--copy', 'copy rendered output to clipboard')
  .action((skill: string | undefined, options: { copy?: boolean }) => {
    if (!skill) {
      program.help();
      return;
    }
    runRender(skill, options);
  });

program.parse(process.argv);
