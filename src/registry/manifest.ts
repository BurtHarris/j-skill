/**
 * registry/manifest.ts — Import manifest persistence layer.
 *
 * Each successful `j-skill import` call writes one JSON manifest file to
 * ~/.agents/manifests/<safe-name>.json. Manifests record the source, the list
 * of imported files, and per-skill metadata so imports are reproducible.
 *
 * Schema version "0.1" is the initial format. If the schema changes in a
 * breaking way, bump schemaVersion and add a migration path.
 *
 * Seam: the `adapters` field is intentionally left as an open Record for future
 * platform adapter state (GitHub Copilot, Claude, etc.). It is always written as
 * an empty object in MVP.
 */
import { join } from "@std/path";
import { existsSync } from "@std/fs";
import { getManifestsDir } from "./paths.ts";

export interface SkillEntry {
  name: string;
  type: "command" | "agent-skill";
  path: string;
}

export interface Manifest {
  schemaVersion: "0.1";
  name: string;
  source: string;
  scope: "user";
  importedAt: string;
  files: string[];
  skills: SkillEntry[];
  adapters: Record<string, unknown>;
}

export function saveManifest(manifest: Manifest): string {
  const safeName = manifest.name.replace(/[/\\:*?"<>|]/g, "_");
  const filePath = join(getManifestsDir(), `${safeName}.json`);
  Deno.writeTextFileSync(filePath, JSON.stringify(manifest, null, 2) + "\n");
  return filePath;
}

export function loadManifest(name: string): Manifest | null {
  const safeName = name.replace(/[/\\:*?"<>|]/g, "_");
  const filePath = join(getManifestsDir(), `${safeName}.json`);
  if (!existsSync(filePath)) return null;
  return JSON.parse(Deno.readTextFileSync(filePath)) as Manifest;
}

export function listManifests(): Manifest[] {
  const dir = getManifestsDir();
  if (!existsSync(dir)) return [];
  return [...Deno.readDirSync(dir)]
    .filter((e) => e.isFile && e.name.endsWith(".json"))
    .map((e) =>
      JSON.parse(Deno.readTextFileSync(join(dir, e.name))) as Manifest
    );
}
