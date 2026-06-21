import { resolveSkill } from '../skills/resolver.ts';
import { copyToClipboard } from '../clipboard.ts';

export function runRender(name: string, options: { copy?: boolean }): void {
  const skill = resolveSkill(name);
  if (!skill) {
    console.error(`skill '${name}' not found`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(skill.body + '\n');

  if (options.copy) {
    try {
      copyToClipboard(skill.body);
      console.error(`copied '${name}' to clipboard`);
    } catch (e) {
      console.error(`warning: could not copy to clipboard: ${(e as Error).message}`);
    }
  }
}
