/**
 * index.ts — Public API barrel for the j-skill library.
 *
 * Re-exports the stable surface area used by tests and any future programmatic
 * consumers. Internal implementation details that are not part of the public API
 * should NOT be added here.
 *
 * Seam: add new exports here when promoting internal modules to the public API.
 */
export { parseFrontmatter, validateFrontmatter } from './skills/frontmatter.ts';
export { resolveSkill } from './skills/resolver.ts';
export { saveManifest, loadManifest, listManifests } from './registry/manifest.ts';
export { parseSource } from './resolvers/url.ts';
export { Diagnostics } from './diagnostics.ts';
export { getRegistryDir, getCommandsDir, getSkillsDir, getManifestsDir } from './registry/paths.ts';
export { exportToCopilotChat } from './exporters/copilot-chat.ts';
export { exportToClaudeCode } from './exporters/claude-code.ts';
