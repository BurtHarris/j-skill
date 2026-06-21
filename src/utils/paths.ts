import os from "node:os";
import path from "node:path";

export function getRegistryRoot(): string {
  return path.join(os.homedir(), '.agents');
}

export function normalizeSlashes(value: string): string {
  return value.replaceAll('\\', '/');
}

export function toPlatformPath(value: string): string {
  return path.normalize(value);
}
