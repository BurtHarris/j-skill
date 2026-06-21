import { createCommand } from 'commander';
import { runImport } from './commands/import.ts';
import { runList } from './commands/list.ts';
import { runRender } from './commands/render.ts';

const program = createCommand('j-skill');
program.description('A personal control plane for portable AI skills.');
program.version('0.1.0');

program
  .command('import <source>')
  .description('Import a skill collection from GitHub, a local path, or a URL')
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
