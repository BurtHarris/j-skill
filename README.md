# j-skill

A personal control plane for portable AI skills.

**Status**: Requirements gathering phase. Implementation pending.

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
5. **Canonical ownership**: j-skill owns the YAML schema details for canonical skills and maps external formats through adapters.

## Current Planning Priorities

1. **Priority input**: simple skills are the first-class import and normalization target.
2. **Priority output**: GitHub Copilot is the first export destination to optimize.
3. **MCP interface mode**: support MCP-style Copilot integration only as an optional, explicitly invoked interface with no required always-on daemon.

## What's In This Repo

- **j-skill_README.md** — Full requirements and product vision
- **AGENTS.md** — Instructions for AI agents contributing to this project
- **DESIGN.md** — Concrete implementation design decisions (registry layout, file structure, manifest format, etc.)

## Status

This project is in **requirements gathering and design phase**. We're defining:
- What the tool should do (requirements ✓)
- How it should behave (behavior spec ✓)
- Where things go and how they're stored (design decisions, ongoing)

No implementation code exists yet. Before coding begins, we'll finalize the registry structure, manifest format, and other implementation choices.

## Next Steps

1. Validate requirements with potential users
2. Finalize registry and data structure design
3. Choose technology stack (likely Node.js/TypeScript)
4. Begin MVP implementation

## References

- [Full Product Vision](j-skill_README.md)
- [AI Agent Instructions](AGENTS.md)
- [Design Decisions](DESIGN.md)
- Inspired by: [mattpocock/skills](https://github.com/mattpocock/skills) and the emerging [Agent Skills community standard](https://github.com/mattpocock/skills)
