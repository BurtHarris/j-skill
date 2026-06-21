# j-skill

A personal control plane for portable AI skills.

`j-skill` is a tool for importing and managing Agent Skills into a variety of AI ecosystems, including those that do not explicitly support skills.  It is designed for individual users who want relatively consistent AI behavior across tools such as Microsoft 365 Copilot, GitHub Copilot, Google Gemini / Gems, ChatGPT, Claude, and browser-based AI interfaces.

This is inspired by many sources, including `npx skills`, used by mattpo/skills
---

## Product Purpose

AI tools fragment user preferences and behavioral instructions. A user may want the same behavior everywhere:

- be concise
- troubleshoot step-by-step
- compare options
- structure recommendations
- avoid speculation
- ask for missing information
- follow personal writing or coding preferences

Today those behaviors are scattered across tool-specific mechanisms: Microsoft 365 Copilot instructions, GitHub Copilot repository configuration, Gemini Gems, coding-agent skills, browser chat prompts, and other custom instruction surfaces.

`j-skill` proposes a personal layer where AI behavior is owned by the user and applied wherever needed.

```text
AI behavior should follow the user, not the tool.
```

---

## Positioning

`j-skill` is not an agent runtime, not a replacement for Agent Skills, and not a replacement for the existing `skills` CLI ecosystem.

It complements them by focusing on:

- personal-first skill management
- security modeling and reduced supply-chain risk
- deterministic local rendering
- clipboard-based application
- manifest-based lifecycle tracking
- GitHub Copilot–centric and multi-adapter architecture
- browser UI injection as a future interaction model

---

## Differentiators

### 1. Security-First Model

`j-skill` treats skills as data, not code.

The core execution boundary is:

```text
local file → render → stdout / clipboard
```

MVP guarantees:

- no script execution from skills
- no background daemon
- no implicit triggers
- no automatic UI control
- no remote code execution during normal use
- no dependency on repeated `npx` execution
- no hidden prompt mutation

This is intended to reduce runtime and supply-chain risk compared with repeated remote package execution, background text expansion engines, or opaque agent-native behavior.

### 2. Personal-First, Not Project-First

`j-skill` defaults to the individual user.

The default registry is:

```text
~/.agents/
```

Importing a skill collection should not automatically modify a repository, project, or team configuration. A user may import a public skill collection for personal use without making it part of a shared project default.

Default behavior:

```text
imported skills belong to the user
```

Not:

```text
imported skills become project policy
```

### 3. GitHub Copilot–Centric Orientation

Many current skill workflows are Claude-centric or agent-runtime-centric. `j-skill` should place GitHub Copilot and repository-aware developer workflows near the center of future adapter design, while still supporting other platforms.

Future GitHub Copilot work should support:

- explicit repo integration
- reproducible generated configuration
- manifest-tracked install and uninstall
- clean composition of multiple skill sources
- separation of user-level skills from project-level policy

### 4. Modular Adapter Architecture

`j-skill` separates the core engine from platform integration.

```text
core registry + renderer
        ↓
adapter layer
        ↓
platform-specific output
```

Potential adapters:

- GitHub Copilot
- Microsoft 365 Copilot
- Google Gemini / Gems
- browser chat UIs
- future agent platforms

Adapters should be optional. The core should remain useful without any adapter.

### 5. Browser Injection Model

Many AI tools are browser-based. `j-skill` should support a future injection model:

```text
render skill → select target UI → inject or paste
```

MVP supports the simpler boundary:

```text
render skill → copy to clipboard → user pastes
```

Future browser extension architecture:

```text
browser extension → native host → j-skill CLI → local registry
```

The browser extension should not own skill parsing or direct filesystem access. The native local tool remains the trusted renderer.

---

## MVP Scope

The MVP should prove this focused workflow:

```text
import → list → render → copy
```

### In Scope

- local user registry
- importing skill collections
- importing local directories
- command-style single-file skills
- Agent Skills-compatible `SKILL.md` support
- manifest records for imports
- listing available skills
- rendering a skill to stdout
- copying rendered output to clipboard
- compliant YAML frontmatter in generated examples
- strict no-code-execution security boundary

### Out of Scope

- background daemon
- browser extension
- picker UI
- automatic UI injection
- remote hosted registry
- automatic publishing into AI platforms
- script or tool execution from skills
- project-level default installation
- GitHub Copilot adapter implementation
- Microsoft 365 Copilot adapter implementation
- Google Gems adapter implementation

Adapters belong in the vision, not the first MVP.

---

## Command Model

Initial MVP commands:

```bash
j-skill import <source>
j-skill list
j-skill <skill>
j-skill <skill> --copy
```

Optional near-term commands:

```bash
j-skill remove <name>
j-skill update <name>
j-skill init
j-skill list --json
```

The terse skill invocation is intentional:

```bash
j-skill concise
```

means:

```text
resolve local skill named "concise" and render it to stdout
```

Clipboard support is explicit:

```bash
j-skill concise --copy
```

means:

```text
render local skill named "concise" and copy the rendered text to clipboard
```

---

## Import Model

`import` is preferred over `install` because it better matches the personal-first model. `install` can imply modifying tools, agents, projects, or platform configuration. `import` means bringing skills into the user’s personal local registry.

### Import Sources

MVP should support:

```bash
j-skill import ./local-skills
j-skill import owner/repo
j-skill import https://github.com/owner/repo
```

Future support may include GitLab and generic Git URLs.

### Import Unit

The default import unit is a collection. A collection may contain many skills.

Example:

```bash
j-skill import mattpocock/skills
```

This imports a skill collection into the local user registry, not into the current project.

### Import Behavior

Import should:

- resolve the source
- discover compatible skills
- copy or materialize them into the local registry
- create a manifest
- avoid modifying projects or target AI tools
- avoid executing source content

---

## Local Registry

The user registry lives under:

```text
~/.agents/
├── commands/
├── skills/
└── manifests/
```

### commands/

Single-file command-style skills, optimized for fast rendering, clipboard use, and injection into AI chat surfaces.

```text
~/.agents/commands/concise.md
```

### skills/

Agent Skills-compatible package directories.

```text
~/.agents/skills/diagnose/SKILL.md
```

### manifests/

Import manifests for lifecycle tracking.

```text
~/.agents/manifests/<collection-id>.json
```

The manifest layer enables:

- clean removal
- update tracking
- source provenance
- composition
- future adapter state
- reproducible platform export

---

## Manifest Model

Every import should create a manifest.

Minimum useful manifest:

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

MVP may implement a smaller manifest, but should preserve the concept.

---

## Skill Formats

`j-skill` supports two skill forms.

### Command-Style Skill

Command-style skills are single Markdown files with YAML frontmatter.

Path:

```text
~/.agents/commands/<name>.md
```

Example:

```markdown
---
name: concise
description: Respond briefly and directly.
---

Respond briefly.

For yes/no questions, answer with exactly one of:
- Yes
- No
- I don't know
- It depends
```

Command-style skills are primary for MVP because they are simple, personal, and injection-ready.

### Agent Skills-Compatible Package

Agent Skills-compatible packages use a directory with `SKILL.md`.

Path:

```text
~/.agents/skills/<name>/SKILL.md
```

Example:

```markdown
---
name: troubleshoot
description: Enforce disciplined step-by-step troubleshooting.
---

Troubleshoot step by step.

First identify:
- observed behavior
- expected behavior
- recent changes
- available evidence

Do not guess before asking for missing evidence.
```

MVP should render only the static Markdown instructions. It should not execute scripts, invoke tools, or dynamically resolve references.

---

## Frontmatter

All generated examples should include valid YAML frontmatter.

MVP should support at least:

```yaml
---
name: concise
description: Respond briefly and directly.
---
```

Recommended future fields:

```yaml
---
name: concise
description: Respond briefly and directly.
aliases:
  - short
tags:
  - style
  - response
targets:
  - github-copilot
  - m365-copilot
  - gemini-gems
---
```

MVP rendering strips frontmatter before output.

---

## Resolution Order

When rendering a skill by name, MVP resolution order is:

```text
1. ~/.agents/commands/<name>.md
2. ~/.agents/skills/<name>/SKILL.md
```

Command-style skills take precedence because they are optimized for personal rendering and injection.

Future versions may add explicit project scope, but user scope remains the default.

---

## Rendering Rules

When running:

```bash
j-skill concise
```

`j-skill` must:

- resolve the skill locally
- read the matching Markdown file
- parse YAML frontmatter
- strip YAML frontmatter from output
- preserve the Markdown body order
- write rendered text to stdout
- perform no side effects

It must not:

- execute scripts
- evaluate templates
- call shell commands from skill content
- load arbitrary referenced files
- modify the clipboard unless `--copy` is supplied
- inject text into applications
- modify project files

---

## Clipboard Rules

When running:

```bash
j-skill concise --copy
```

`j-skill` should:

- render the skill exactly as `j-skill concise` would
- copy that rendered text to the system clipboard
- optionally still print to stdout, depending on implementation choice

Clipboard behavior must be explicit and user-triggered.

No skill content should be able to control clipboard behavior.

---

## Example Scenarios

### Consistent Concise Mode Across Tools

A `concise` skill can be rendered and pasted into Microsoft 365 Copilot, GitHub Copilot Chat, Gemini, ChatGPT, or Claude.

```bash
j-skill concise --copy
```

Outcome:

```text
The same concise behavior is available everywhere.
```

### Structured Analysis

An `analyze` skill can force a consistent structure:

```text
problem → constraints → options → risks → recommendation
```

Use:

```bash
j-skill analyze --copy
```

### Troubleshooting Discipline

A `troubleshoot` skill can make an assistant slow down, identify evidence, ask for missing information, and avoid repeating rejected steps.

Use:

```bash
j-skill troubleshoot --copy
```

### Import a Public Skill Collection

```bash
j-skill import mattpocock/skills
```

Then use imported skills locally:

```bash
j-skill diagnose
j-skill tdd
```

Outcome:

```text
A public skill collection becomes available for personal use without modifying a project.
```

---

## Relationship to Existing Tools

### Agent Skills

Agent Skills define an emerging package shape for reusable agent capabilities. `j-skill` should support Agent Skills-compatible `SKILL.md` packages, but should not claim to redefine that existing format.

`j-skill` adds a local user registry, import manifests, deterministic rendering, clipboard workflow, and future adapters.

### npm `skills` CLI

The npm `skills` CLI already provides a broad ecosystem workflow for adding, using, removing, listing, finding, updating, initializing, and syncing skills.

`j-skill` should not duplicate that project without differentiation.

`j-skill` differs by focusing on:

- personal user registry
- security boundaries
- manifest-driven local lifecycle
- deterministic render/copy
- GitHub Copilot–centric future adapters
- browser-based UI injection model
- cross-AI use outside a single agent ecosystem

The relationship should be complementary.

Potential future interoperability:

```text
skills CLI imports/distributes collections
j-skill manages local personal use and cross-AI application
```

---

## Adapter Vision

Adapters are not MVP, but the architecture should anticipate them.

### GitHub Copilot

GitHub Copilot should be a priority adapter target.

Future goals:

- export user skills into GitHub Copilot-compatible instruction files
- avoid accidental project-wide adoption
- require explicit user action for repo modification
- track adapter output in manifests
- support clean uninstall
- support composition of multiple skill sources

GitHub Copilot may require manifest-driven lifecycle management because generated configuration may need to be merged, updated, or removed safely.

Example future adapter manifest concept:

```json
{
  "adapter": "github-copilot",
  "target": ".github/copilot-instructions.md",
  "skills": [
    {
      "name": "concise",
      "source": "commands/concise.md"
    }
  ]
}
```

### Microsoft 365 Copilot

Microsoft 365 Copilot is a separate platform from GitHub Copilot.

Future support may include:

- rendering user skills for paste into Microsoft 365 Copilot chat
- exporting instruction text for Copilot Studio scenarios
- preserving personal-first behavior
- avoiding silent publishing or tenant-wide mutation

MVP support is manual paste via render/copy.

### Google Gemini / Gems

Google Gems are a natural adapter target.

Future support may include:

```bash
j-skill export gem concise
```

Potential output:

```json
{
  "name": "concise",
  "description": "Respond briefly and directly.",
  "instructions": "Respond briefly.\n\nFor yes/no questions..."
}
```

MVP support is manual paste via render/copy.

---

## Browser Extension Direction

A future browser extension may provide a command-palette experience for browser-based AI tools.

Target workflow:

```text
Ctrl + / → choose skill → inject into active AI text box
```

Likely architecture:

```text
browser extension → native messaging host → j-skill CLI → local registry
```

Security boundary:

- extension owns UI
- native host owns local access
- `j-skill` owns parsing and rendering
- skill files remain local
- no direct browser filesystem access

This enables browser-based use without turning `j-skill` into a background automation engine.

---

## Picker Direction

A picker is a future UI surface, not part of the MVP core.

Picker concept:

```text
single hotkey → type/filter → choose skill → render/copy/inject
```

Possible implementations:

- terminal UI
- PowerToys launcher workflow
- browser extension overlay
- OS-native launcher integration

The picker should be an adapter over core primitives:

```bash
j-skill list
j-skill <skill>
```

The CLI should remain deterministic and minimal.

---

## Project vs User Scope

User scope is the default.

MVP registry:

```text
~/.agents/
```

Project scope may be added later, but must be explicit.

Potential future project registry:

```text
./.agents/
```

Rules for future project support:

- never modify a project silently
- require explicit command or confirmation
- keep project skills separate from user skills
- track project changes in manifests
- support clean removal

The default remains personal use.

---

## Lifecycle Direction

MVP implements import, list, render, and copy.

Future lifecycle commands may include:

```bash
j-skill remove <collection-or-skill>
j-skill update <collection-or-skill>
j-skill list --json
j-skill doctor
```

`remove` should use manifests to delete only files created by a specific import.

`update` should use manifests to determine source and changed files.

`doctor` should validate registry consistency.

---

## Distribution Direction

Preferred distribution:

```text
1. GitHub Releases
2. winget
3. npm global install
4. npx only as optional bootstrap
```

Security rationale:

- GitHub Releases can provide versioned binaries
- winget is natural for Windows-first installation
- npm global install is useful for developers
- repeated `npx` execution should not be the primary workflow

The tool should not depend on repeated remote code execution during normal use.

---

## MVP Acceptance Criteria

MVP is successful when:

1. A user can initialize a local registry.
2. A user can import a local or GitHub skill collection.
3. A manifest records what was imported.
4. A user can list available skills.
5. A user can render a skill to stdout.
6. A user can copy a rendered skill to the clipboard.
7. Rendered output strips YAML frontmatter.
8. Skill execution performs no code execution.
9. No project files are modified by default.
10. The workflow is useful with at least three AI tools by manual paste.

Example validation:

```bash
j-skill import ./examples
j-skill list
j-skill concise
j-skill concise --copy
```

Then paste into Microsoft 365 Copilot, GitHub Copilot Chat, Gemini, ChatGPT, or Claude.

---

## Non-Goals

`j-skill` is not:

- an agent runtime
- a prompt execution engine
- a background text expander
- a browser automation tool
- a replacement for Agent Skills
- a replacement for the npm `skills` CLI
- a project configuration manager by default
- a silent installer into AI platforms

---

## Toward a Standard

`j-skill` proposes a layered model for portable AI behavior.

```text
1. Skill Definition
   YAML frontmatter + Markdown content

2. Skill Collection
   importable groups, usually repos

3. Local Registry
   user-owned filesystem layout

4. Manifest Layer
   lifecycle tracking, provenance, clean removal

5. Renderer
   deterministic local text generation

6. Adapter Layer
   platform-specific transformations

7. Interaction Layer
   clipboard, picker, browser extension, launcher
```

This layered model is the product’s long-term contribution.

---

## Vision

Short-term:

```text
personal registry + import + render + copy
```

Medium-term:

```text
manifest lifecycle + remove/update + picker + browser extension
```

Long-term:

```text
portable AI skills with adapter-based application across platforms
```

The long-term goal is:

```text
define or import once → apply everywhere → keep the user in control
```

---

## Key Insight

Today:

```text
AI behavior is owned by tools.
```

`j-skill` shifts that to:

```text
AI behavior is owned by the user.
```

---

## Summary

`j-skill` starts with a minimal, secure MVP:

```text
import → list → render → copy
```

It grows toward a broader standard:

```text
portable, manifest-tracked, user-owned AI behavior across platforms
```

The MVP should remain small enough to build quickly while preserving the architecture needed for GitHub Copilot adapters, Microsoft 365 Copilot usage, Google Gems export, browser injection, and future cross-AI skill portability.
