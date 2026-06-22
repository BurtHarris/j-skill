import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { join } from "@std/path";

import { resolveSkill } from "../src/skills/resolver.ts";

let tmpDir: string;

beforeEach(() => {
  tmpDir = Deno.makeTempDirSync({ prefix: "j-skill-test-" });
  Deno.mkdirSync(join(tmpDir, "commands"), { recursive: true });
  Deno.mkdirSync(join(tmpDir, "skills"), { recursive: true });
  Deno.env.set("J_SKILL_REGISTRY", tmpDir);
});

afterEach(() => {
  Deno.env.delete("J_SKILL_REGISTRY");
  Deno.removeSync(tmpDir, { recursive: true });
});

it("resolveSkill: finds command-style skill", () => {
  Deno.writeTextFileSync(
    join(tmpDir, "commands", "concise.md"),
    "---\nname: concise\ndescription: Brief.\n---\nKeep it short.\n",
  );
  const skill = resolveSkill("concise");
  assertEquals(skill !== null, true);
  assertEquals(skill!.name, "concise");
  assertEquals(skill!.type, "command");
  assertEquals(skill!.body, "Keep it short.");
});

it("resolveSkill: finds agent-skill package", () => {
  Deno.mkdirSync(join(tmpDir, "skills", "diagnose"));
  Deno.writeTextFileSync(
    join(tmpDir, "skills", "diagnose", "SKILL.md"),
    "---\nname: diagnose\ndescription: Debug.\n---\nDebug steps.\n",
  );
  const skill = resolveSkill("diagnose");
  assertEquals(skill !== null, true);
  assertEquals(skill!.name, "diagnose");
  assertEquals(skill!.type, "agent-skill");
  assertEquals(skill!.body, "Debug steps.");
});

it("resolveSkill: command takes precedence over agent-skill", () => {
  Deno.writeTextFileSync(
    join(tmpDir, "commands", "overlap.md"),
    "---\nname: overlap\ndescription: Command version.\n---\nFrom command.\n",
  );
  Deno.mkdirSync(join(tmpDir, "skills", "overlap"));
  Deno.writeTextFileSync(
    join(tmpDir, "skills", "overlap", "SKILL.md"),
    "---\nname: overlap\ndescription: Skill version.\n---\nFrom skill.\n",
  );
  const skill = resolveSkill("overlap");
  assertEquals(skill !== null, true);
  assertEquals(skill!.type, "command");
  assertEquals(skill!.body, "From command.");
});

it("resolveSkill: returns null for unknown skill", () => {
  const skill = resolveSkill("unknown");
  assertEquals(skill, null);
});

it("resolveSkill: body does not contain frontmatter", () => {
  Deno.writeTextFileSync(
    join(tmpDir, "commands", "test.md"),
    "---\nname: test\ndescription: A test.\n---\n## Instructions\n\nDo the thing.\n",
  );
  const skill = resolveSkill("test");
  assertEquals(skill !== null, true);
  assertEquals(skill!.body.includes("---"), false);
  assertEquals(skill!.body.includes("name: test"), false);
  assertEquals(skill!.body.includes("## Instructions"), true);
});
