import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { assertEquals, assertFalse } from "@std/assert";
import { join } from "@std/path";
import { existsSync } from "@std/fs";
import { exportToClaudeCode } from "../src/exporters/claude-code.ts";

let tmpDir: string;
let registryDir: string;
let outputDir: string;

beforeEach(() => {
  tmpDir = Deno.makeTempDirSync({ prefix: "j-skill-test-" });
  registryDir = join(tmpDir, "registry");
  outputDir = join(tmpDir, "output");
  Deno.mkdirSync(join(registryDir, "commands"), { recursive: true });
  Deno.mkdirSync(join(registryDir, "skills"), { recursive: true });
  Deno.mkdirSync(outputDir, { recursive: true });
  Deno.env.set("J_SKILL_REGISTRY", registryDir);
});

afterEach(() => {
  Deno.env.delete("J_SKILL_REGISTRY");
  Deno.removeSync(tmpDir, { recursive: true });
});

it("exportToClaudeCode: creates one .md file per skill", () => {
  exportToClaudeCode(
    [
      { name: "concise", body: "Keep responses short." },
      { name: "troubleshoot", body: "Follow a systematic process." },
    ],
    { outputDir },
  );
  const files = [...Deno.readDirSync(outputDir)].map((e) => e.name);
  assertEquals(files.includes("concise.md"), true);
  assertEquals(files.includes("troubleshoot.md"), true);
  assertEquals(files.length, 2);
});

it("exportToClaudeCode: file content equals skill body", () => {
  exportToClaudeCode(
    [{ name: "concise", body: "Keep responses short." }],
    { outputDir },
  );
  const content = Deno.readTextFileSync(join(outputDir, "concise.md"));
  assertEquals(content.includes("Keep responses short."), true);
});

it("exportToClaudeCode: output files end with a newline", () => {
  exportToClaudeCode(
    [{ name: "x", body: "Content." }],
    { outputDir },
  );
  const content = Deno.readTextFileSync(join(outputDir, "x.md"));
  assertEquals(content.endsWith("\n"), true);
});

it("exportToClaudeCode: output files contain no YAML frontmatter delimiters", () => {
  exportToClaudeCode(
    [{ name: "concise", body: "Keep responses short." }],
    { outputDir },
  );
  const content = Deno.readTextFileSync(join(outputDir, "concise.md"));
  assertFalse(content.includes("---"));
});

it("exportToClaudeCode: creates output directory if it does not exist", () => {
  const nestedDir = join(outputDir, "new", "nested");
  exportToClaudeCode(
    [{ name: "x", body: "Content." }],
    { outputDir: nestedDir },
  );
  assertEquals(existsSync(join(nestedDir, "x.md")), true);
});

// Populate registry and verify runExport produces expected Claude Code output
it("runExport claude-code: exports all registry skills when no names given", async () => {
  Deno.writeTextFileSync(
    join(registryDir, "commands", "concise.md"),
    "---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n",
  );
  Deno.mkdirSync(join(registryDir, "skills", "diagnose"), { recursive: true });
  Deno.writeTextFileSync(
    join(registryDir, "skills", "diagnose", "SKILL.md"),
    "---\nname: diagnose\ndescription: Debug methodically.\n---\nDebug steps here.\n",
  );

  const { runExport } = await import("../src/commands/export.ts");
  await runExport([], { target: "claude-code", output: outputDir });

  assertEquals(existsSync(join(outputDir, "concise.md")), true);
  assertEquals(existsSync(join(outputDir, "diagnose.md")), true);
});

it("runExport claude-code: exports only named skills when names are given", async () => {
  Deno.writeTextFileSync(
    join(registryDir, "commands", "concise.md"),
    "---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n",
  );
  Deno.writeTextFileSync(
    join(registryDir, "commands", "verbose.md"),
    "---\nname: verbose\ndescription: Detailed.\n---\nProvide full detail.\n",
  );

  const { runExport } = await import("../src/commands/export.ts");
  await runExport(["concise"], { target: "claude-code", output: outputDir });

  assertEquals(existsSync(join(outputDir, "concise.md")), true);
  assertFalse(existsSync(join(outputDir, "verbose.md")));
});

it("runExport claude-code: exported file body matches registry skill body", async () => {
  Deno.writeTextFileSync(
    join(registryDir, "commands", "concise.md"),
    "---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n",
  );

  const { runExport } = await import("../src/commands/export.ts");
  await runExport(["concise"], { target: "claude-code", output: outputDir });

  const content = Deno.readTextFileSync(join(outputDir, "concise.md"));
  assertEquals(content.includes("Keep responses short."), true);
  assertFalse(content.includes("name: concise"));
  assertFalse(content.includes("---"));
});

it("runExport claude-code: sets exitCode=1 for unknown skill name", async () => {
  const { runExport } = await import("../src/commands/export.ts");
  const original = Deno.exitCode;
  Deno.exitCode = 0;
  await runExport(["no-such-skill"], { target: "claude-code", output: outputDir });
  assertEquals(Deno.exitCode, 1);
  Deno.exitCode = original;
});
