import { homedir } from 'node:os';
import { join } from 'node:path';

export function getRegistryDir(): string {
  return process.env.J_SKILL_REGISTRY ?? join(homedir(), '.agents');
}

export function getCommandsDir(): string {
  return join(getRegistryDir(), 'commands');
}

export function getSkillsDir(): string {
  return join(getRegistryDir(), 'skills');
}

export function getManifestsDir(): string {
  return join(getRegistryDir(), 'manifests');
}
