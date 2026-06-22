/**
 * commands/render.ts — Implementation of `j-skill <name> [--copy]`.
 *
 * Resolves a named skill from the local registry and writes its body (YAML
 * frontmatter stripped) to stdout. When --copy is passed the same content is
 * also sent to the system clipboard via the platform-specific helper in
 * clipboard.ts.
 *
 * Clipboard errors are reported as warnings (to stderr) rather than hard
 * failures because the primary output (stdout) has already succeeded by the
 * time the copy is attempted.
 *
 * Seam: to support rendering a specific version or tag of a skill, thread a
 * version option through runRender() and resolveSkill().
 */
import { resolveSkill } from "../skills/resolver.ts";
import { copyToClipboard } from "../clipboard.ts";

export async function runRender(
  name: string,
  options: { copy?: boolean },
): Promise<void> {
  const skill = resolveSkill(name);
  if (!skill) {
    console.error(`skill '${name}' not found`);
    Deno.exitCode = 1;
    return;
  }

  console.log(skill.body);

  if (options.copy) {
    try {
      await copyToClipboard(skill.body);
      console.error(`copied '${name}' to clipboard`);
    } catch (e) {
      console.error(
        `warning: could not copy to clipboard: ${(e as Error).message}`,
      );
    }
  }
}
