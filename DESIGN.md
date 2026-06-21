# j-skill Design Decisions

This document captures implementation-specific design choices made during the requirements phase. These are decisions about *how* to build j-skill, not *what* it should do (see [j-skill_README.md](j-skill_README.md) for requirements).

## Local Registry Structure

The user registry will live under a personal directory:

```text
~/.agents/
├── commands/
│   ├── concise.md
│   └── troubleshoot.md
├── skills/
│   ├── diagnose/
│   │   ├── SKILL.md
│   │   └── [related files]
│   └── [other skills]
└── manifests/
    └── [import manifests]
```

**Rationale**: Flat structure at `~/.agents/` makes the registry discoverable without modification to shell profiles or path configuration. Subdirectories organize the two skill types clearly.

## Skill File Naming

- **Command-style skills**: `~/.agents/commands/<name>.md`
  - Example: `concise.md`, `troubleshoot_v2.md`
  - Single Markdown file with YAML frontmatter
  
- **Agent Skills packages**: `~/.agents/skills/<name>/SKILL.md`
  - Example: `diagnose/SKILL.md`, `structured-analysis/SKILL.md`
  - Directory containing `SKILL.md` plus supporting files

**Rationale**: Clear naming convention prevents ambiguity; `.md` extensions indicate Markdown content; `SKILL.md` follows the [mattpocock/skills](https://github.com/mattpocock/skills) convention.

## Resolution Order

When rendering a skill by name:

1. `~/.agents/commands/<name>.md` (first)
2. `~/.agents/skills/<name>/SKILL.md` (second)

**Rationale**: Command-style skills are optimized for personal use and clipboard injection, so they take precedence. Allows users to override imported agent skills with personal commands.

## Import Manifest Format

Each import creates a manifest in `~/.agents/manifests/`:

```json
{
  "schemaVersion": "0.1",
  "name": "mattpocock/skills",
  "source": "https://github.com/mattpocock/skills",
  "scope": "user",
  "importedAt": "2026-06-20T00:00:00Z",
  "files": [
    "commands/concise.md",
    "skills/diagnose/SKILL.md"
  ],
  "skills": [
    {
      "name": "concise",
      "type": "command",
      "path": "commands/concise.md"
    },
    {
      "name": "diagnose",
      "type": "agent-skill",
      "path": "skills/diagnose/SKILL.md"
    }
  ],
  "adapters": {}
}
```

**Rationale**: 
- Enables clean import/removal without manual file deletion
- Tracks provenance for security audits
- Reserves `adapters` field for future platform integration (GitHub Copilot export, etc.)
- Schema versioning allows future format evolution

## Platform Import Sources (MVP)

```bash
j-skill import ./local-skills                # Local directory
j-skill import owner/repo                    # GitHub shorthand (GitHub only, MVP)
j-skill import https://github.com/owner/repo # Full GitHub URL
```

**Rationale**: GitHub shorthand matches npm/yarn conventions. Full URLs provide explicit control. Local paths enable development iteration.

## Future: Platform Prefix Syntax

When GitLab/Gitea/other platforms are supported, use prefix syntax:

```bash
j-skill import gitlab:owner/repo
j-skill import gitea:instance.com/owner/repo
```

**Rationale**: Unambiguous platform identification without URL parsing complexity.

## Manifest Lifecycle (MVP Concepts)

- **Import**: Create manifest at `~/.agents/manifests/<collection-id>.json`
- **List**: Read manifests to discover available skills
- **Remove**: Delete manifest and associated files
- **Update**: Preserve manifest, update skills in registry

**Rationale**: Manifest-driven lifecycle enables reliable cleanup, versioning, and future adapter composition.

## Design Notes

These choices are **not locked**. Before implementation begins, the team should:

- Validate registry location; consider Windows (Program Files?), macOS (standard `.agents`?), Linux conventions
- Confirm directory structure matches discovery expectations
- Finalize manifest schema with consideration for error reporting integration
- Consider import idempotency (re-import same collection—overwrite manifest? Merge? Error?)
- Decide manifest naming strategy (ID-based vs. source-based vs. collision avoidance)

