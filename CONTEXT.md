# j-skill Context

Key definitions, project context, and conceptual foundations for j-skill.

## Core Definitions

### Skill

A reusable AI behavioral instruction—a unit of consistent behavior that can be applied to any AI interface.

**Examples**:
- "Respond briefly and directly"
- "Troubleshoot step-by-step"
- "Structure all recommendations as problem → constraints → options → risks → recommendation"

**Characteristics**:
- Authored in Markdown with YAML metadata
- Renders as plain text (no code execution)
- Portable across platforms (works anywhere you can paste text)

### Import

The act of adding a skill collection to the user's personal registry. Distinct from "install" because it does not modify projects, teams, or platforms—only the user's local registry.

**Sources for import**:
- GitHub repository
- Local directory
- HTTPS URL

### Manifest

A JSON record tracking the lifecycle of an import: provenance, contents, adaptation state, and removal information.

**Purpose**:
- Enable clean removal of imported skills
- Track source and update state
- Prepare for future adapter composition
- Provide security audit trail

### Registry

The user's personal storage for imported and created skills. Location determined at implementation time (e.g., `~/.agents/`).

**Contents**:
- Command-style skills (single files)
- Agent Skills packages (directories)
- Import manifests (lifecycle metadata)

### Two Skill Types

#### Command-Style Skill

A single-file skill optimized for quick rendering and clipboard injection.

- Format: Markdown file with YAML frontmatter
- Rendering: Display file contents to stdout (without frontmatter)
- Use case: Personal instructions, quick behavioral rules

#### Agent Skills Package

A multi-file skill package following the [mattpocock/skills](https://github.com/mattpocock/skills) convention.

- Format: Directory with `SKILL.md` plus supporting files
- Rendering: Extract and display main instruction text
- Use case: Complex, documented capabilities

### Render

The process of extracting a skill's instruction text and outputting it to stdout (optionally copying to clipboard).

**Constraints**:
- No script execution
- No template evaluation
- No dynamic resolution
- Pure static text output

---

## Project Context

### The Problem

Modern AI tools fragment user preferences. A user's GitHub Copilot instructions differ from Claude, differ from ChatGPT, differ from Microsoft 365 Copilot. Onboarding a new AI tool means manually re-entering preferences everywhere.

**Today's mechanisms** are scattered and incompatible:
- GitHub Copilot: `.github/copilot-instructions.md`
- Microsoft 365 Copilot: Tenant-level instructions
- Claude: Custom instructions per conversation
- ChatGPT: System prompts at model level
- Gemini: Gem instructions
- Browser chat: Per-interface custom prompts

### The j-skill Solution

Maintain AI behavioral instructions in one personal place. Render and apply them anywhere.

**Core philosophy**: "AI behavior should follow the user, not the tool."

---

## Design Principles

### 1. Security-First

Skills are **data, not code**.

- No script execution from skills
- No daemons or background processes
- No implicit triggers
- No remote code execution
- Deterministic rendering with no side effects

Execution boundary: `local file → parse → render → stdout/clipboard`

### 2. Personal-First, Not Project-First

The registry is yours, not your team's.

- Default scope: individual user
- Importing never modifies projects or team configurations
- Users own their behavior layer; teams don't enforce it via tool defaults
- Complements the npm `skills` CLI, doesn't replace it
- `j-skill` imports into its own user registry first, even when downstream adapters later target Copilot-specific concepts such as instructions, prompts, agents, skills, or plugins

### 3. GitHub Copilot-Centric (Multi-Platform Vision)

MVP focus: developer workflows and GitHub Copilot.

Future: Adapters for other platforms (Claude, Gemini, ChatGPT, MS 365 Copilot, browser extensions).

Core engine remains platform-agnostic.

### 4. Modular Adapter Architecture

```
core registry + renderer
        ↓
adapter layer (future)
        ↓
platform-specific output
```

Adapters are optional. Core value works without them.

**Clarification**: Copilot-specific conventions are adapter targets, not the source of truth. The source of truth remains the personal `j-skill` registry.

---

## Relationships to Existing Tools

### npm `skills` CLI

**Existing tool** (mattpocock/skills): Provides ecosystem workflow for discovering, installing, removing, listing, finding, updating, syncing skills.

**j-skill differs**:
- Focuses on personal user registry (not project-wide)
- Security boundaries (data, not code)
- Manifest-driven local lifecycle
- Deterministic render/copy workflow
- GitHub Copilot–centric future adapters
- Cross-AI application (not single ecosystem)

**Relationship**: Complementary. `npm skills` distributes; `j-skill` manages personal use.

### Agent Skills Standard

**Existing format** (mattpocock/skills): Emerging package structure for reusable agent capabilities.

**j-skill usage**:
- Supports Agent Skills-compatible `SKILL.md` packages
- Does not claim to redefine that format
- Adds local registry, import manifests, rendering, clipboard workflow, adapters

**Relationship**: `j-skill` is a consumer and potential ecosystem participant.

### GitHub Copilot

**Current interaction**: Manual copy-paste of skill text into chat.

**Future adapter vision**:
- Export user skills into `.github/copilot-instructions.md`
- Avoid accidental project-wide adoption
- Require explicit user action
- Track via manifests
- Support clean install/uninstall
- Compose multiple skill sources

**Boundary**: importing into `j-skill` must not be conflated with importing into Copilot’s own directories or framework concepts. `j-skill` manages personal registry state first and only exports to Copilot through explicit, future adapter operations.

---

## Core Workflow (MVP)

```
import → list → render → copy
```

### Import

```bash
j-skill import mattpocock/skills          # Import collection from GitHub
j-skill import owner/repo                 # GitHub shorthand
j-skill import https://github.com/...     # Full URL
j-skill import ./local-skills             # Local directory
```

### List

```bash
j-skill list                              # Show available skills
```

### Render & Copy

```bash
j-skill concise                           # Render to stdout
j-skill concise --copy                    # Render and copy to clipboard
```

---

## MVP Constraints

### In Scope

- Local user registry
- Importing collections from GitHub, local paths, URLs
- Two skill types (command-style, Agent Skills packages)
- YAML frontmatter (skills community standard)
- Import manifests for lifecycle tracking
- List, render, copy primitives
- Error handling with complete error reporting
- No spaces in skill names (MVP)

### Out of Scope

- Background daemon
- Browser extension
- Automatic platform injection
- Project-level defaults
- Script or template execution
- Platform adapters (GitHub Copilot, MS 365, Gemini, etc.)

Adapters belong in vision, not MVP.

---

## Future Directions

### Adapters (Post-MVP)

Export or compose skills for platform-specific use:
- GitHub Copilot instructions export
- Microsoft 365 Copilot Studio scenarios
- Google Gems JSON export
- Browser extension command palette

### Project Scope (Future)

Optional project-level skills with explicit opt-in (e.g., `j-skill import --project`).

Rules: Never silent, always explicit, trackable cleanup.

### Lifecycle Commands (Post-MVP)

```bash
j-skill remove <collection>
j-skill update <collection>
j-skill list --json
j-skill doctor
```

### Picker UI (Future)

Terminal or OS-level UI for quick skill selection and application (not MVP).

### Distribution

Primary channels: GitHub Releases, package managers (winget, apt, brew, npm global).

---

## Toward a Standard: A Layered Model

`j-skill` proposes a layered model for portable AI behavior:

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

This layered model is the product's long-term contribution to portable AI behavior infrastructure.

---

## Vision Timeline

### Short-Term (MVP)
```text
personal registry + import + render + copy
```

### Medium-Term
```text
manifest lifecycle + remove/update + picker + browser extension
```

### Long-Term
```text
portable AI skills with adapter-based application across platforms
```

**Long-term goal**:

```text
define or import once → apply everywhere → keep the user in control
```

---

## Core Insight

**Today**: AI behavior is owned by tools.

**j-skill's shift**: AI behavior is owned by the user.

When a user defines or imports a skill, they own it. They can apply it anywhere, update it everywhere, and maintain control over their AI behavior layer across all platforms.
