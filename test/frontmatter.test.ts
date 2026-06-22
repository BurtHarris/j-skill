import { assertEquals, assertFalse } from "@std/assert";
import { parseFrontmatter, validateFrontmatter } from "../src/skills/frontmatter.ts";

Deno.test("parseFrontmatter: parses name and description", () => {
  const input = `---
name: concise
description: Respond briefly and directly.
---
Keep responses short.`;
  const { frontmatter, body, hasFrontmatter } = parseFrontmatter(input);
  assertEquals(frontmatter.name, "concise");
  assertEquals(frontmatter.description, "Respond briefly and directly.");
  assertEquals(body, "Keep responses short.");
  assertEquals(hasFrontmatter, true);
});

Deno.test("parseFrontmatter: parses optional fields", () => {
  const input = `---
name: concise
description: Short responses.
aliases:
  - short
tags:
  - style
targets:
  - github-copilot
---
Body.`;
  const { frontmatter } = parseFrontmatter(input);
  assertEquals(frontmatter.aliases, ["short"]);
  assertEquals(frontmatter.tags, ["style"]);
  assertEquals(frontmatter.targets, ["github-copilot"]);
});

Deno.test("parseFrontmatter: no frontmatter returns full content as body", () => {
  const input = "Just some markdown content.";
  const { frontmatter, body, hasFrontmatter } = parseFrontmatter(input);
  assertEquals(hasFrontmatter, false);
  assertEquals(body, "Just some markdown content.");
  assertEquals(frontmatter, {});
});

Deno.test("parseFrontmatter: strips frontmatter from body", () => {
  const input = `---
name: test
description: A test skill.
---

## Instructions

Do the thing.`;
  const { body } = parseFrontmatter(input);
  assertFalse(body.includes("---"));
  assertFalse(body.includes("name: test"));
  assertEquals(body.includes("## Instructions"), true);
});

Deno.test("parseFrontmatter: preserves markdown body order", () => {
  const content = `---
name: analyze
description: Analyze things.
---
# Step 1
Do first.

# Step 2
Do second.`;
  const { body } = parseFrontmatter(content);
  const step1Idx = body.indexOf("Step 1");
  const step2Idx = body.indexOf("Step 2");
  assertEquals(step1Idx < step2Idx, true);
});

Deno.test("validateFrontmatter: valid frontmatter passes", () => {
  const { errors, warnings } = validateFrontmatter(
    { name: "concise", description: "Brief." },
    "test.md",
  );
  assertEquals(errors.length, 0);
  assertEquals(warnings.length, 0);
});

Deno.test("validateFrontmatter: missing name is an error", () => {
  const { errors } = validateFrontmatter({ description: "Brief." }, "test.md");
  assertEquals(errors.some((e) => e.includes("'name'")), true);
});

Deno.test("validateFrontmatter: missing description is an error", () => {
  const { errors } = validateFrontmatter({ name: "concise" }, "test.md");
  assertEquals(errors.some((e) => e.includes("'description'")), true);
});

Deno.test("validateFrontmatter: name with spaces is an error", () => {
  const { errors } = validateFrontmatter(
    { name: "my skill", description: "Brief." },
    "test.md",
  );
  assertEquals(errors.some((e) => e.includes("must not contain spaces")), true);
});

Deno.test("validateFrontmatter: name with underscores is valid", () => {
  const { errors } = validateFrontmatter(
    { name: "troubleshoot_v2", description: "Brief." },
    "test.md",
  );
  assertEquals(errors.length, 0);
});

Deno.test("validateFrontmatter: name with hyphens is valid", () => {
  const { errors } = validateFrontmatter(
    { name: "concise-mode", description: "Brief." },
    "test.md",
  );
  assertEquals(errors.length, 0);
});
