/**
 * cli.ts — Entry point for the j-skill CLI.
 *
 * Dispatches to the appropriate command implementation based on the first
 * positional argument. Uses @std/cli parseArgs for flag parsing.
 *
 * Subcommands:
 *   import <source>                   — import a skill collection
 *   list                              — list available skills
 *   export [skills...] --target <t>   — export to a platform format
 *   <name> [--copy]                   — render a named skill (default)
 *
 * Seam: add new sub-commands by importing from src/commands/ and adding a
 * case in the switch below.
 */
import { parseArgs } from "@std/cli";
import { runImport } from "./commands/import.ts";
import { runList } from "./commands/list.ts";
import { runRender } from "./commands/render.ts";
import { runExport } from "./commands/export.ts";

const VERSION = "0.1.0";

function printHelp(): void {
  console.log(`j-skill ${VERSION} — A personal control plane for portable AI skills.

Usage:
  j-skill import <source>                Import from GitHub owner/repo, HTTPS URL, or local path
  j-skill list                           List available skills
  j-skill export [skills...] --target    Export skills to a platform format
  j-skill <name> [--copy]               Render a skill to stdout (optionally copy)

Options:
  --target <target>   Export target: copilot-chat, claude-code
  --output <path>     Output path or directory for export
  --copy              Copy rendered output to clipboard
  --version, -v       Print version
  --help, -h          Show this help`);
}

const args = Deno.args;

if (args.length === 0) {
  printHelp();
  Deno.exit(0);
}

const subcommand = args[0];

if (subcommand === "--help" || subcommand === "-h") {
  printHelp();
  Deno.exit(0);
}

if (subcommand === "--version" || subcommand === "-v") {
  console.log(VERSION);
  Deno.exit(0);
}

switch (subcommand) {
  case "import": {
    const source = args[1];
    if (!source) {
      console.error("error: missing required argument <source>");
      Deno.exit(1);
    }
    await runImport(source);
    break;
  }

  case "list": {
    runList();
    break;
  }

  case "export": {
    const parsed = parseArgs(args.slice(1), {
      string: ["target", "output"],
      "--": false,
    });
    const skillNames = parsed._.map(String);
    const target = parsed["target"];
    const output = parsed["output"];
    if (!target) {
      console.error("error: option --target <target> is required");
      Deno.exit(1);
    }
    await runExport(skillNames, { target, output });
    break;
  }

  default: {
    const parsed = parseArgs(args, { boolean: ["copy"] });
    const skillName = String(parsed._[0] ?? subcommand);
    const copy = Boolean(parsed["copy"]);
    await runRender(skillName, { copy });
    break;
  }
}
