/**
 * commands/import.ts — Implementation of `j-skill import <source>`.
 *
 * Orchestrates the full import pipeline:
 *   1. Parse the source string (URL / shorthand / local path)
 *   2. Fetch skills from the appropriate resolver (GitHub or local filesystem)
 *   3. Validate every skill — accumulate ALL errors before terminating
 *   4. Write a JSON manifest to ~/.agents/manifests/ on success
 *
 * importFromGitHub() is private to this module because it depends on the
 * GitHub Contents API; the local equivalent lives in resolvers/local.ts.
 *
 * Seam: to add a new import source (e.g., an npm package or a ZIP archive),
 * add a new branch in runImport() alongside the existing 'local' / 'github'
 * branches and implement a matching resolver module.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getRegistryDir, getCommandsDir, getManifestsDir, getSkillsDir } from '../registry/paths.ts';
import { saveManifest, type Manifest } from '../registry/manifest.ts';
import { parseSource } from '../resolvers/url.ts';
import { importFromLocal } from '../resolvers/local.ts';
import { fetchGitHubContents, fetchGitHubFile } from '../resolvers/github.ts';
import { parseFrontmatter, validateFrontmatter } from '../skills/frontmatter.ts';
import { Diagnostics } from '../diagnostics.ts';
import type { SkillEntry } from '../registry/manifest.ts';

async function importFromGitHub(
  owner: string,
  repo: string,
  diagnostics: Diagnostics
): Promise<{ files: string[]; skills: SkillEntry[] } | null> {
  const files: string[] = [];
  const skills: SkillEntry[] = [];

  let topLevel: Awaited<ReturnType<typeof fetchGitHubContents>>;
  try {
    topLevel = await fetchGitHubContents(owner, repo);
  } catch (e) {
    diagnostics.error(`failed to fetch ${owner}/${repo}: ${(e as Error).message}`);
    return null;
  }

  const hasCommands = topLevel.some(e => e.name === 'commands' && e.type === 'dir');
  const hasSkills = topLevel.some(e => e.name === 'skills' && e.type === 'dir');

  if (!hasCommands && !hasSkills) {
    diagnostics.warn(`${owner}/${repo}: no 'commands/' or 'skills/' directory found`);
  }

  if (hasCommands) {
    let commandEntries: Awaited<ReturnType<typeof fetchGitHubContents>>;
    try {
      commandEntries = await fetchGitHubContents(owner, repo, 'commands');
    } catch (e) {
      diagnostics.error(`failed to fetch commands/: ${(e as Error).message}`);
      commandEntries = [];
    }

    for (const entry of commandEntries) {
      if (entry.type !== 'file' || !entry.name.endsWith('.md')) continue;

      let content: string;
      try {
        content = await fetchGitHubFile(owner, repo, entry.path);
      } catch (e) {
        diagnostics.error(`failed to fetch ${entry.path}: ${(e as Error).message}`);
        continue;
      }

      const { frontmatter, hasFrontmatter } = parseFrontmatter(content);
      if (!hasFrontmatter) {
        diagnostics.warn(`${entry.path}: no YAML frontmatter found, skipping`);
        continue;
      }

      const { errors, warnings } = validateFrontmatter(frontmatter, entry.path);
      for (const w of warnings) diagnostics.warn(w);
      if (errors.length > 0) {
        for (const e of errors) diagnostics.error(e);
        continue;
      }

      mkdirSync(getCommandsDir(), { recursive: true });
      writeFileSync(join(getCommandsDir(), entry.name), content, 'utf-8');

      const relPath = `commands/${entry.name}`;
      files.push(relPath);
      skills.push({ name: frontmatter.name!, type: 'command', path: relPath });
    }
  }

  if (hasSkills) {
    let skillDirs: Awaited<ReturnType<typeof fetchGitHubContents>>;
    try {
      skillDirs = await fetchGitHubContents(owner, repo, 'skills');
    } catch (e) {
      diagnostics.error(`failed to fetch skills/: ${(e as Error).message}`);
      skillDirs = [];
    }

    for (const dir of skillDirs) {
      if (dir.type !== 'dir') continue;

      const skillMdPath = `skills/${dir.name}/SKILL.md`;
      let content: string;
      try {
        content = await fetchGitHubFile(owner, repo, skillMdPath);
      } catch {
        diagnostics.warn(`${dir.path}: no SKILL.md found, skipping`);
        continue;
      }

      const { frontmatter, hasFrontmatter } = parseFrontmatter(content);
      if (!hasFrontmatter) {
        diagnostics.warn(`${skillMdPath}: no YAML frontmatter found, skipping`);
        continue;
      }

      const { errors, warnings } = validateFrontmatter(frontmatter, skillMdPath);
      for (const w of warnings) diagnostics.warn(w);
      if (errors.length > 0) {
        for (const e of errors) diagnostics.error(e);
        continue;
      }

      const destDir = join(getSkillsDir(), dir.name);
      mkdirSync(destDir, { recursive: true });

      // Fetch all files in the skill directory
      let skillFiles: Awaited<ReturnType<typeof fetchGitHubContents>>;
      try {
        skillFiles = await fetchGitHubContents(owner, repo, `skills/${dir.name}`);
      } catch {
        skillFiles = [];
      }

      for (const f of skillFiles) {
        if (f.type !== 'file') continue;
        let fileContent: string;
        try {
          fileContent = await fetchGitHubFile(owner, repo, f.path);
        } catch {
          continue;
        }
        writeFileSync(join(destDir, f.name), fileContent, 'utf-8');
        files.push(`skills/${dir.name}/${f.name}`);
      }

      skills.push({
        name: frontmatter.name!,
        type: 'agent-skill',
        path: `skills/${dir.name}/SKILL.md`,
      });
    }
  }

  return { files, skills };
}

export async function runImport(source: string): Promise<void> {
  const diagnostics = new Diagnostics();

  const parsed = parseSource(source);
  if (!parsed) {
    diagnostics.error(`cannot parse source: '${source}'. Use owner/repo, https://github.com/owner/repo, or a local path`);
    diagnostics.report();
    process.exitCode = 1;
    return;
  }

  // Ensure registry directories exist
  mkdirSync(getRegistryDir(), { recursive: true });
  mkdirSync(getManifestsDir(), { recursive: true });

  let result: { files: string[]; skills: SkillEntry[] } | null = null;
  let manifestName: string;
  let manifestSource: string;

  if (parsed.type === 'local') {
    const absPath = resolve(parsed.localPath!);
    result = importFromLocal(absPath, diagnostics);
    manifestName = absPath;
    manifestSource = absPath;
  } else {
    const owner = parsed.owner!;
    const repo = parsed.repo!;
    result = await importFromGitHub(owner, repo, diagnostics);
    manifestName = `${owner}/${repo}`;
    manifestSource = parsed.type === 'github-url'
      ? parsed.originalUrl!
      : `https://github.com/${owner}/${repo}`;
  }

  // Always report all collected diagnostics before deciding to terminate
  diagnostics.report();

  if (diagnostics.hasErrors()) {
    console.error(`import failed with ${diagnostics.errors.length} error(s)`);
    process.exitCode = 1;
    return;
  }

  if (!result || result.skills.length === 0) {
    console.error('no skills were imported');
    process.exitCode = 1;
    return;
  }

  const manifest: Manifest = {
    schemaVersion: '0.1',
    name: manifestName,
    source: manifestSource,
    scope: 'user',
    importedAt: new Date().toISOString(),
    files: result.files,
    skills: result.skills,
    adapters: {},
  };

  const manifestPath = saveManifest(manifest);
  console.log(`imported ${result.skills.length} skill(s) from '${source}'`);
  console.log(`manifest saved to ${manifestPath}`);
  for (const skill of result.skills) {
    console.log(`  - ${skill.name} (${skill.type})`);
  }
}
