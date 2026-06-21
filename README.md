# j-skill

A personal control plane for portable AI skills.

**Status**: Working prototype on `copilot-cli`; `main` remains the design baseline.

## Long-Lived Development Branches

- **`copilot-cli`** — Long-lived branch for exercising GitHub Copilot CLI workflows, validating tool capabilities on this machine, and running tool-specific experiments without changing the main design baseline.

## Current Prototype

The `copilot-cli` branch now includes a first runnable Node.js + TypeScript prototype for the MVP workflow:

```bash
node --experimental-strip-types src/cli.ts import <source>
node --experimental-strip-types src/cli.ts list
node --experimental-strip-types src/cli.ts <skill>
node --experimental-strip-types src/cli.ts <skill> --copy
```

Implemented in this branch:

- local registry under `~/.agents` (Windows canonical path: `%USERPROFILE%\.agents`)
- command skill resolution before package skill resolution
- local and GitHub collection import
- manifest persistence
- frontmatter parsing with naming validation
- stdout rendering and explicit clipboard copy

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

## What's In This Repo

- **j-skill_README.md** — Full requirements and product vision
- **AGENTS.md** — Instructions for AI agents contributing to this project
- **DESIGN.md** — Concrete implementation design decisions (registry layout, file structure, manifest format, etc.)
- **tips.md** — User workflow tips for Copilot CLI and `j-skill`

## Status

This project still contains the core requirements and design docs, and `copilot-cli` now carries an executable prototype aligned to them:
- What the tool should do (requirements ✓)
- How it should behave (behavior spec ✓)
- Where things go and how they're stored (design decisions ✓ for the current prototype)
- First end-to-end implementation slice (prototype ✓)

Active branch note:
- `main` remains the design and requirements baseline
- `copilot-cli` is reserved for long-term Copilot CLI and related tool capability experiments

Further work can harden the implementation, expand diagnostics, and add future adapter-facing seams without changing the user-owned registry model.

The current design now resolves a key boundary explicitly: **imports land in the `j-skill` user registry first**, while Copilot-specific instructions, prompts, agents, skills, and plugins remain future adapter/export surfaces rather than the primary storage location.

## Next Steps

1. Harden the prototype into a production-ready CLI package
2. Expand test coverage around import edge cases and diagnostics
3. Add adapter extension points without compromising MVP safety
4. Decide when to merge implementation learnings back into `main`

## References

- [Full Product Vision](j-skill_README.md)
- [AI Agent Instructions](AGENTS.md)
- [Design Decisions](DESIGN.md)
- Inspired by: [mattpocock/skills](https://github.com/mattpocock/skills) and the emerging [Agent Skills community standard](https://github.com/mattpocock/skills)
