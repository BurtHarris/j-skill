S j-skill Requirements

**For context, definitions, design principles, and project background, see [CONTEXT.md](CONTEXT.md).**

This document specifies what j-skill must do (requirements and behavioral specs).

---

## MVP Scope

For complete MVP scope (in/out), see [CONTEXT.md § MVP Constraints](CONTEXT.md#mvp-constraints).

**Core workflow**: `import → list → render → copy`

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

Import specification is based on GitHub and npm project conventions.

MVP should support:

```bash
j-skill import ./local-skills                # Local directory
j-skill import owner/repo                    # GitHub shorthand (GitHub only, MVP)
j-skill import https://github.com/owner/repo # Full GitHub URL
```

Future support may include other platforms. See [DESIGN.md](DESIGN.md) for platform prefix convention proposals.

### Import Unit

The default import unit is a collection. A collection may contain many skills.

Example:

```bash
j-skill import mattpocock/skills
```

This imports a skill collection into the local user registry, not into the current project.

### Import Behavior

Import should:

- resolve the source (GitHub, local directory, or URL)
- discover compatible skills according to npm/GitHub project conventions
- validate skill manifests and YAML frontmatter
- copy or materialize skills into the local registry
- create an import manifest
- avoid modifying projects or target AI tools
- avoid executing source content

### Error Handling During Import

Error handling follows a collect-all, fail-once pattern designed for VSCode integration:

- **Collection phase**: Process entire import manifest, collecting all errors and warnings
- **Reporting phase**: Report complete error set in VSCode-processable format (diagnostics)
- **Termination**: Errors (not warnings) terminate the import operation after all errors are collected
- **Examples of errors**: Invalid YAML frontmatter, missing required fields (name, description), naming constraint violations (spaces in skill names), inaccessible sources, malformed manifests
- **Examples of warnings**: Deprecated frontmatter fields, unrecognized targets, non-critical metadata issues

This approach allows developers to fix all issues at once rather than one per iteration.

---

## Registry and Manifest Design

The implementation will maintain a local user registry with:
- Storage for imported skills
- Lifecycle tracking via import manifests
- Support for future adapter state

See [DESIGN.md](DESIGN.md) for concrete decisions on registry structure, manifest format, and file organization.

---

## Skill Formats

`j-skill` supports two skill forms, both using YAML frontmatter and Markdown content:

### Command-Style Skills

Single-file skills optimized for personal use and clipboard injection. Rendered directly as-is.

### Agent Skills-Compatible Packages

Multi-file packages following the [mattpocock/skills](https://github.com/mattpocock/skills) format. Include supporting files and may reference other resources.

**MVP constraint**: Render only the static Markdown instructions. Do not execute scripts, invoke tools, or dynamically resolve references. See [DESIGN.md](DESIGN.md) for concrete file naming and organization decisions.

---

## Frontmatter

YAML frontmatter for skills is based on the [skills community standard](https://github.com/mattpocock/skills) established by the `mattpocock/skills` project.

MVP should support at least:

```yaml
---
name: concise
description: Respond briefly and directly.
---
```

Recommended future fields (from skills standard):

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

**Naming constraint (MVP)**: Skill names and collection identifiers must not contain spaces. Examples: `concise-mode`, `troubleshoot_v2` are valid; `concise mode` is not.

MVP rendering strips frontmatter before output.

---

## Skill Resolution

When rendering a skill by name, the implementation should have a defined resolution order that prefers command-style skills (optimized for personal use) over package-style skills. See [DESIGN.md](DESIGN.md) for the concrete precedence rules.

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

See [CONTEXT.md § Relationships to Existing Tools](CONTEXT.md#relationships-to-existing-tools) for detailed positioning relative to Agent Skills and npm `skills` CLI.

---

## Future Adapter Vision

See [CONTEXT.md § Future Directions](CONTEXT.md#future-directions) for post-MVP adapters (GitHub Copilot, MS 365 Copilot, Gemini/Gems, browser extension, picker UI).

---

## Related Documentation

- [CONTEXT.md](CONTEXT.md) — Definitions, design principles, project context, relationships to other tools
- [DESIGN.md](DESIGN.md) — Implementation design decisions (registry location, file structure, manifest format)
- [AGENTS.md](AGENTS.md) — Instructions for AI agents contributing to this project
- [README.md](README.md) — Quick project overview

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

## Summary

`j-skill` starts with a minimal, secure MVP:

```text
import → list → render → copy
```

It grows toward a broader standard for portable, manifest-tracked, user-owned AI behavior across platforms.

The MVP should remain small enough to build quickly while preserving the architecture needed for future adapters (GitHub Copilot, MS 365 Copilot, Gemini, browser extension) and cross-AI skill portability.

See [CONTEXT.md § Future Directions](CONTEXT.md#future-directions) for the complete vision.

---

