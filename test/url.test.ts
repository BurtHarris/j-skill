import { assertEquals } from "@std/assert";
import { parseSource } from "../src/resolvers/url.ts";

Deno.test("parseSource: parses GitHub HTTPS URL", () => {
  const result = parseSource("https://github.com/mattpocock/skills");
  assertEquals(result, {
    type: "github-url",
    owner: "mattpocock",
    repo: "skills",
    originalUrl: "https://github.com/mattpocock/skills",
  });
});

Deno.test("parseSource: parses GitHub HTTPS URL with .git suffix", () => {
  const result = parseSource("https://github.com/owner/repo.git");
  assertEquals(result?.type, "github-url");
  assertEquals(result?.owner, "owner");
  assertEquals(result?.repo, "repo");
});

Deno.test("parseSource: parses GitHub shorthand owner/repo", () => {
  const result = parseSource("mattpocock/skills");
  assertEquals(result, {
    type: "github",
    owner: "mattpocock",
    repo: "skills",
  });
});

Deno.test("parseSource: parses relative local path", () => {
  const result = parseSource("./my-skills");
  assertEquals(result, { type: "local", localPath: "./my-skills" });
});

Deno.test("parseSource: parses absolute local path", () => {
  const result = parseSource("/home/user/skills");
  assertEquals(result, { type: "local", localPath: "/home/user/skills" });
});

Deno.test("parseSource: parses tilde-prefixed local path", () => {
  const result = parseSource("~/my-skills");
  assertEquals(result, { type: "local", localPath: "~/my-skills" });
});

Deno.test("parseSource: returns null for unrecognized source", () => {
  const result = parseSource("not-a-valid-source!@#");
  assertEquals(result, null);
});

Deno.test("parseSource: single word is not recognized (no slash)", () => {
  const result = parseSource("someword");
  assertEquals(result, null);
});
