import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { importFromLocal } from "../src/resolvers/local.ts";
import { Diagnostics } from "../src/diagnostics.ts";

let tmpDir: string;

beforeEach(() => {
  tmpDir = Deno.makeTempDirSync({ prefix: "j-skill-test-" });
  Deno.mkdirSync(join(tmpDir, "registry", "commands"), { recursive: true });
  Deno.mkdirSync(join(tmpDir, "registry", "skills"), { recursive: true });
  Deno.env.set("J_SKILL_REGISTRY", join(tmpDir, "registry"));
});

afterEach(() => {
  Deno.env.delete("J_SKILL_REGISTRY");
  Deno.removeSync(tmpDir, { recursive: true });
});

function makeSkillDir(name: string): string {
  const dir = join(tmpDir, name);
  Deno.mkdirSync(join(dir, "commands"), { recursive: true });
  Deno.mkdirSync(join(dir, "skills"), { recursive: true });
  return dir;
}

it("importFromLocal: imports command-style skill", () => {
  const src = makeSkillDir("source");
  Deno.writeTextFileSync(
    join(src, "commands", "concise.md"),
    "---\nname: concise\ndescription: Brief.\n---\nKeep responses short.\n",
  );

  const diag = new Diagnostics();
  const result = importFromLocal(src, diag);

  assertEquals(result !== null, true);
  assertEquals(result!.skills.length, 1);
  assertEquals(result!.skills[0].name, "concise");
  assertEquals(result!.skills[0].type, "command");
  assertEquals(diag.hasErrors(), false);
});

it("importFromLocal: imports agent-skill package", () => {
  const src = makeSkillDir("source");
  Deno.mkdirSync(join(src, "skills", "diagnose"), { recursive: true });
  Deno.writeTextFileSync(
    join(src, "skills", "diagnose", "SKILL.md"),
    "---\nname: diagnose\ndescription: Debug methodically.\n---\nFollow these steps.\n",
  );

  const diag = new Diagnostics();
  const result = importFromLocal(src, diag);

  assertEquals(result !== null, true);
  assertEquals(result!.skills.length, 1);
  assertEquals(result!.skills[0].name, "diagnose");
  assertEquals(result!.skills[0].type, "agent-skill");
  assertEquals(diag.hasErrors(), false);
});

it("importFromLocal: collects ALL errors before stopping", () => {
  const src = makeSkillDir("source");
  // Two invalid command files – no name or description
  Deno.writeTextFileSync(join(src, "commands", "bad1.md"), "---\nfoo: bar\n---\nContent.\n");
  Deno.writeTextFileSync(join(src, "commands", "bad2.md"), "---\nfoo: baz\n---\nContent.\n");

  const diag = new Diagnostics();
  importFromLocal(src, diag);

  // Both files should have been processed and errors collected
  assertEquals(diag.errors.length >= 2, true);
});

it("importFromLocal: skips files without frontmatter (warning, not error)", () => {
  const src = makeSkillDir("source");
  Deno.writeTextFileSync(join(src, "commands", "plain.md"), "No frontmatter here.\n");

  const diag = new Diagnostics();
  const result = importFromLocal(src, diag);

  assertEquals(result !== null, true);
  assertEquals(result!.skills.length, 0);
  assertEquals(diag.hasErrors(), false);
  assertEquals(diag.warnings.length > 0, true);
});

it("importFromLocal: errors when source does not exist", () => {
  const diag = new Diagnostics();
  const result = importFromLocal(join(tmpDir, "nonexistent"), diag);

  assertEquals(result, null);
  assertEquals(diag.hasErrors(), true);
});

it("importFromLocal: skill name with spaces is an error", () => {
  const src = makeSkillDir("source");
  Deno.writeTextFileSync(
    join(src, "commands", "bad.md"),
    "---\nname: bad name\ndescription: Has spaces.\n---\nContent.\n",
  );

  const diag = new Diagnostics();
  importFromLocal(src, diag);
  assertEquals(diag.errors.some((e) => e.message.includes("must not contain spaces")), true);
});
