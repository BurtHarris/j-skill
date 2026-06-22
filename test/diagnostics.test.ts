import { assertEquals } from "@std/assert";
import { Diagnostics } from "../src/diagnostics.ts";

Deno.test("Diagnostics: starts empty", () => {
  const d = new Diagnostics();
  assertEquals(d.errors.length, 0);
  assertEquals(d.warnings.length, 0);
  assertEquals(d.hasErrors(), false);
});

Deno.test("Diagnostics: records errors", () => {
  const d = new Diagnostics();
  d.error("something went wrong", "file.md");
  assertEquals(d.errors.length, 1);
  assertEquals(d.errors[0].message, "something went wrong");
  assertEquals(d.errors[0].file, "file.md");
  assertEquals(d.hasErrors(), true);
});

Deno.test("Diagnostics: records warnings", () => {
  const d = new Diagnostics();
  d.warn("deprecated field");
  assertEquals(d.warnings.length, 1);
  assertEquals(d.warnings[0].severity, "warning");
  assertEquals(d.hasErrors(), false);
});

Deno.test("Diagnostics: collects multiple errors and warnings", () => {
  const d = new Diagnostics();
  d.error("err1");
  d.error("err2");
  d.warn("warn1");
  assertEquals(d.errors.length, 2);
  assertEquals(d.warnings.length, 1);
  assertEquals(d.hasErrors(), true);
});
