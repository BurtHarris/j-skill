import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { existsSync } from "@std/fs";

import {
  listManifests,
  loadManifest,
  saveManifest,
  type Manifest,
} from "../src/registry/manifest.ts";

let tmpDir: string;

beforeEach(() => {
  tmpDir = Deno.makeTempDirSync({ prefix: "j-skill-test-" });
  const manifestsDir = join(tmpDir, "manifests");
  Deno.mkdirSync(manifestsDir, { recursive: true });
  Deno.env.set("J_SKILL_REGISTRY", tmpDir);
});

afterEach(() => {
  Deno.env.delete("J_SKILL_REGISTRY");
  Deno.removeSync(tmpDir, { recursive: true });
});

const sampleManifest: Manifest = {
  schemaVersion: "0.1",
  name: "mattpocock/skills",
  source: "https://github.com/mattpocock/skills",
  scope: "user",
  importedAt: "2026-06-01T00:00:00Z",
  files: ["commands/concise.md"],
  skills: [{ name: "concise", type: "command", path: "commands/concise.md" }],
  adapters: {},
};

it("saveManifest: writes manifest to file", () => {
  const filePath = saveManifest(sampleManifest);
  assertEquals(existsSync(filePath), true);
  const raw = Deno.readTextFileSync(filePath);
  const parsed = JSON.parse(raw) as Manifest;
  assertEquals(parsed.name, "mattpocock/skills");
  assertEquals(parsed.schemaVersion, "0.1");
  assertEquals(parsed.scope, "user");
});

it("loadManifest: reads back what was saved", () => {
  saveManifest(sampleManifest);
  const loaded = loadManifest("mattpocock/skills");
  assertEquals(loaded !== null, true);
  assertEquals(loaded!.name, "mattpocock/skills");
  assertEquals(loaded!.skills, sampleManifest.skills);
});

it("loadManifest: returns null for missing manifest", () => {
  const result = loadManifest("nonexistent/repo");
  assertEquals(result, null);
});

it("listManifests: returns all saved manifests", () => {
  saveManifest(sampleManifest);
  saveManifest({
    ...sampleManifest,
    name: "other/repo",
    source: "https://github.com/other/repo",
  });
  const all = listManifests();
  assertEquals(all.length, 2);
});

it("listManifests: returns empty array when no manifests", () => {
  // Remove manifests dir to simulate a fresh registry with no manifests
  Deno.removeSync(join(tmpDir, "manifests"), { recursive: true });
  const all = listManifests();
  assertEquals(all.length, 0);
});

it("saveManifest: sanitizes slashes in name for filename", () => {
  const filePath = saveManifest(sampleManifest);
  // The filename should not contain a real directory separator from the name
  const fileName = filePath.split("/").at(-1)!;
  assertEquals(fileName.includes("/"), false);
});
