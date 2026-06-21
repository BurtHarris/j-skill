#!/usr/bin/env node
import { ensureRegistry, listSkills } from './registry.ts';
import { importSkills } from './import/importer.ts';
import { formatError, renderSkill } from './render.ts';

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    return 0;
  }

  await ensureRegistry();
  const [command, ...rest] = args;

  try {
    if (command === 'import') {
      const source = rest[0];
      if (!source) {
        throw new Error('Usage: j-skill import <source>');
      }
      const result = await importSkills(source);
      process.stdout.write(`Imported ${result.importedSkills.length} skill(s): ${result.importedSkills.join(', ')}\n`);
      process.stdout.write(`Manifest: ${result.manifestPath}\n`);
      return 0;
    }

    if (command === 'list') {
      const skills = await listSkills();
      if (skills.length === 0) {
        process.stdout.write('No skills found.\n');
        return 0;
      }

      for (const skill of skills) {
        process.stdout.write(`${skill.name}\t${skill.type}\n`);
      }
      return 0;
    }

    const copyToClipboard = rest.includes('--copy');
    const rendered = await renderSkill(command, copyToClipboard);
    process.stdout.write(rendered.endsWith('\n') ? rendered : `${rendered}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${formatError(error)}\n`);
    return 1;
  }
}

function printHelp(): void {
  process.stdout.write(`j-skill

Usage:
  j-skill import <source>
  j-skill list
  j-skill <skill>
  j-skill <skill> --copy
`);
}

const exitCode = await main(process.argv);
process.exit(exitCode);
