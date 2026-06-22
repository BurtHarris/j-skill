/**
 * registry/paths.ts — Local registry directory resolution.
 *
 * All registry paths are derived from a single root directory (default:
 * ~/.agents/). Callers must NOT hard-code paths; they must use these helpers so
 * that the test suite can redirect the registry to a temporary directory via the
 * J_SKILL_REGISTRY environment variable without touching the real user registry.
 *
 * Seam: J_SKILL_REGISTRY env var is the primary extension point for hermetic
 * testing and CI. To support project-scoped registries in the future, add an
 * additional resolution layer here before falling back to the home directory.
 */
import { join } from "@std/path";

function homedir(): string {
  return Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "/tmp";
}

export function getRegistryDir(): string {
  return Deno.env.get("J_SKILL_REGISTRY") ?? join(homedir(), ".agents");
}

export function getCommandsDir(): string {
  return join(getRegistryDir(), "commands");
}

export function getSkillsDir(): string {
  return join(getRegistryDir(), "skills");
}

export function getManifestsDir(): string {
  return join(getRegistryDir(), "manifests");
}
