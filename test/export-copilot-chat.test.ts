import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { assertEquals, assertFalse } from "@std/assert";
import { join } from "@std/path";
import { existsSync } from "@std/fs";
import { exportToCopilotChat } from "../src/exporters/copilot-chat.ts";

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

it("exportToCopilotChat: writes a single skill as a ## section", () => {
  const outputPath = join(outputDir, "copilot-instructions.md");
  exportToCopilotChat(
    [{ name: "concise", body: "Keep responses short." }],
    { outputPath },
  );
  const content = Deno.readTextFileSync(outputPath);
  assertEquals(content.includes("## concise"), true);
  assertEquals(content.includes("Keep responses short."), true);
});

it("exportToCopilotChat: writes multiple skills as separate ## sections", () => {
  const outputPath = join(outputDir, "copilot-instructions.md");
  exportToCopilotChat(
    [
      { name: "concise", body: "Keep responses short." },
      { name: "troubleshoot", body: "Follow a systematic process." },
    ],
    { outputPath },
  );
  const content = Deno.readTextFileSync(outputPath);
  assertEquals(content.includes("## concise"), true);
  assertEquals(content.includes("Keep responses short."), true);
  assertEquals(content.includes("## troubleshoot"), true);
  assertEquals(content.includes("Follow a systematic process."), true);
});

it("exportToCopilotChat: sections are separated by blank lines", () => {
  const outputPath = join(outputDir, "copilot-instructions.md");
  exportToCopilotChat(
    [
      { name: "a", body: "Body A." },
      { name: "b", body: "Body B." },
    ],
    { outputPath },
  );
  const content = Deno.readTextFileSync(outputPath);
  // The two sections must be separated by at least one blank line
  assertEquals(content.includes("Body A.\n\n## b"), true);
});

it("exportToCopilotChat: output file ends with a newline", () => {
  const outputPath = join(outputDir, "copilot-instructions.md");
  exportToCopilotChat([{ name: "x", body: "Content." }], { outputPath });
  const content = Deno.readTextFileSync(outputPath);
  assertEquals(content.endsWith("\n"), true);
});

it("exportToCopilotChat: creates parent directory if it does not exist", () => {
  const nestedPath = join(outputDir, "nested", "deep", "copilot-instructions.md");
  exportToCopilotChat([{ name: "x", body: "Content." }], { outputPath: nestedPath });
  const content = Deno.readTextFileSync(nestedPath);
  assertEquals(content.includes("## x"), true);
});

it("exportToCopilotChat: output does not contain YAML frontmatter delimiters", () => {
  const outputPath = join(outputDir, "copilot-instructions.md");
  exportToCopilotChat(
    [{ name: "concise", body: "Keep responses short." }],
    { outputPath },
  );
  const content = Deno.readTextFileSync(outputPath);
  assertFalse(content.includes("---"));
});

// Populate registry and verify runExport produces expected output
it("runExport copilot-chat: exports all registry skills when no names given", async () => {
  // Seed registry with two skills
  Deno.writeTextFileSync(
    join(registryDir, "commands", "concise.md"),
    "---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n",
  );
  Deno.writeTextFileSync(
    join(registryDir, "commands", "verbose.md"),
    "---\nname: verbose\ndescription: Detailed.\n---\nProvide full detail.\n",
  );

  const outputPath = join(outputDir, "out.md");
  const { runExport } = await import("../src/commands/export.ts");
  await runExport([], { target: "copilot-chat", output: outputPath });

  const content = Deno.readTextFileSync(outputPath);
  assertEquals(content.includes("## concise"), true);
  assertEquals(content.includes("## verbose"), true);
});

it("runExport copilot-chat: exports only named skills when names are given", async () => {
  Deno.writeTextFileSync(
    join(registryDir, "commands", "concise.md"),
    "---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n",
  );
  Deno.writeTextFileSync(
    join(registryDir, "commands", "verbose.md"),
    "---\nname: verbose\ndescription: Detailed.\n---\nProvide full detail.\n",
  );

  const outputPath = join(outputDir, "out.md");
  const { runExport } = await import("../src/commands/export.ts");
  await runExport(["concise"], { target: "copilot-chat", output: outputPath });

  const content = Deno.readTextFileSync(outputPath);
  assertEquals(content.includes("## concise"), true);
  assertFalse(content.includes("## verbose"));
});

it("runExport copilot-chat: sets exitCode=1 for unknown skill name", async () => {
  const { runExport } = await import("../src/commands/export.ts");
  const original = Deno.exitCode;
  Deno.exitCode = 0;
  await runExport(["no-such-skill"], {
    target: "copilot-chat",
    output: join(outputDir, "out.md"),
  });
  assertEquals(Deno.exitCode, 1);
  Deno.exitCode = original;
});

it("runExport: sets exitCode=1 for unsupported target", async () => {
  const { runExport } = await import("../src/commands/export.ts");
  const original = Deno.exitCode;
  Deno.exitCode = 0;
  await runExport([], {
    target: "unsupported-target",
    output: join(outputDir, "out.md"),
  });
  assertEquals(Deno.exitCode, 1);
  Deno.exitCode = original;
});
