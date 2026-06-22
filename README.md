# j-skill

A personal control plane for portable AI skills.

**Status**: MVP implemented. Built with [Deno](https://deno.com/) — runs TypeScript natively with no build step.

## What is j-skill?

`j-skill` is a CLI tool that lets you maintain a personal registry of AI behavioral instructions and apply them consistently across different AI platforms (GitHub Copilot, Claude, ChatGPT, Microsoft 365 Copilot, Google Gemini, and others).

**Core idea**: "AI behavior should follow the user, not the tool."

## The Problem

AI tools fragment your preferences:

- Your GitHub Copilot instructions differ from your Claude custom instructions
- Your browser chat behavior differs from your terminal agent behavior
- Onboarding new AI tools means re-entering the same preferences everywhere
- There's no portable, user-owned layer for AI behavior

## The Solution

Import AI behavioral instructions into a personal registry. Render them on-demand and paste them into any AI interface you use.

```bash
j-skill import mattpocock/skills    # Import a public skill collection once
j-skill concise --copy              # Use it anywhere, anytime
```

## Key Design Principles

1. **Security-first**: Skills are data, not code. No scripts, no daemons, no RCE.
2. **Personal-first**: Your registry is yours. Importing never modifies projects or team configs.
3. **GitHub Copilot-centric**: Designed for developer workflows, but extensible to other platforms.
4. **Simple MVP**: Import → list → render → copy. That's it for v1.

## Requirements

- [Deno](https://deno.com/) 2.0 or later

No Node.js, no npm, no build step required.

## Installation

```bash
# Clone the repo and link the binary
git clone https://github.com/BurtHarris/j-skill.git
cd j-skill
# Run directly:
deno run --allow-read --allow-write --allow-env --allow-run --allow-net src/cli.ts --help
# Or install globally:
deno install --allow-read --allow-write --allow-env --allow-run --allow-net -n j-skill src/cli.ts
```

## Usage

```bash
j-skill import <source>              # Import from GitHub owner/repo, URL, or local path
j-skill list                         # List available skills
j-skill <name>                       # Render a skill to stdout
j-skill <name> --copy                # Render and copy to clipboard
j-skill export --target copilot-chat # Export all skills to GitHub Copilot format
j-skill export --target claude-code  # Export all skills to Claude Code slash commands
```

## Development

```bash
# Run tests
deno task test

# Run the CLI directly
deno task start import ./examples
deno task start list
deno task start concise
```

## What's In This Repo

- **src/** — TypeScript source (runs natively under Deno)
- **bin/j-skill** — Deno shebang executable
- **test/** — Test suite (run with `deno task test`)
- **examples/** — Sample skill collection
- **j-skill_README.md** — Full requirements and product vision
- **AGENTS.md** — Instructions for AI agents contributing to this project
- **DESIGN.md** — Concrete implementation design decisions

## References

- [Full Product Vision](j-skill_README.md)
- [AI Agent Instructions](AGENTS.md)
- [Design Decisions](DESIGN.md)
- Inspired by: [mattpocock/skills](https://github.com/mattpocock/skills) and the emerging [Agent Skills community standard](https://github.com/mattpocock/skills)
