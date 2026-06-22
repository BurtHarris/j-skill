# j-skill Agent Instructions

## Project Vision

**j-skill** is a personal control plane for portable AI skills—a CLI tool that allows users to maintain a personal registry of AI behavioral instructions and inject them into any AI interface (GitHub Copilot, Claude, Gemini, ChatGPT, etc.).

**Core principle**: "AI behavior should follow the user, not the tool."

## Implementation Philosophy

### 1. Security-First Model
- **Skills are data, not code.** Never execute scripts or templates.
- Execution boundary: `local file → render → stdout/clipboard`
- Guarantees: no script execution, no daemons, no RCE, no background processes, no implicit triggers
- Implications: All operations must be deterministic and side-effect-free.

### 2. Personal-First Design
- Default registry lives at `~/.agents/`, not in projects or team configs
- Importing a skill collection never modifies repositories or shared settings
- Users own their behavior layer; teams don't enforce it via tool defaults
- Complements (does not replace) the npm `skills` CLI ecosystem

### 3. GitHub Copilot-Centric (But Multi-Platform)
- Primary focus: GitHub Copilot and developer workflows
- Future: Adapters for other platforms (Claude, Gemini, ChatGPT, MS 365 Copilot)
- Core engine should remain platform-agnostic

## MVP Scope

### Two Skill Types
1. **Commands**: Single `.md` files with YAML frontmatter in `~/.agents/commands/`
   - Examples: `concise.md`, `troubleshoot.md`
2. **Agent Skills packages**: Directories with `SKILL.md` in `~/.agents/skills/`
   - Multi-file skills with dependencies and manifests

### Planned CLI Commands
```bash
j-skill import <source>        # GitHub owner/repo, local path, or HTTPS URL (based on GitHub/npm conventions)
j-skill list                   # List available skills
j-skill <name>                 # Render to stdout
j-skill <name> --copy          # Render and copy to clipboard
```

### Local Registry Structure
```
~/.agents/
├── commands/
│   ├── concise.md              # User skill
│   └── troubleshoot.md
├── skills/
│   ├── diagnose/
│   │   ├── SKILL.md
│   │   └── [related files]
│   └── [other skills]
└── manifests/
    └── collection.json         # Lifecycle tracking
```

### Manifest Tracking
Each import creates a JSON manifest recording:
- Source (GitHub owner/repo, local path, URL)
- Scope (personal, project-scoped)
- Files and metadata
- Adapter state (for future platform integration)

## Implementation Constraints

### Must Do
- Parse YAML frontmatter (based on [skills community standard](https://github.com/mattpocock/skills))
- Preserve Markdown formatting in output
- Write rendered output to stdout (or copy to clipboard with `--copy`)
- Track all imports in manifests for reproducibility
- Support importing from GitHub, local paths, and HTTPS URLs following GitHub/npm conventions
- Collect ALL errors and warnings during import, terminate only after complete error set is reported
- Enforce naming constraints: no spaces in skill names or collection identifiers

### Must NOT Do
- Execute any scripts or templates (e.g., no `eval`, `exec`, or interpolation)
- Modify the clipboard without explicit `--copy` flag
- Inject into AI applications automatically
- Create background daemons or watchers
- Modify project or team configurations
- Make assumptions about platform adapters at MVP

## Tooling Best Practices for Agents

When working on this project, use these tools strategically:

### File Editing
- **Multiple independent edits**: Use `multi_replace_string_in_file` tool to batch edits in one operation instead of sequential single-file edits
- **Large context**: Include 3-5 lines of surrounding code to make replacements unambiguous
- **Avoid sequential calls**: Never call edit tools multiple times when one batched call will do

### Searching & Discovery
- **Semantic search first**: Use `semantic_search` when you need to find relevant code without knowing exact keywords or structure
- **Specific patterns**: Use `grep_search` when you know the exact string, function name, or keyword you're looking for
- **File discovery**: Use `file_search` with glob patterns to locate files by name/extension pattern
- **Parallelize searches**: Run independent searches in parallel batches rather than sequentially

### Reading Files
- **Large chunks**: Read entire sections or files at once (e.g., lines 1-150) rather than multiple small reads
- **Plan ahead**: Identify all sections you need before making read calls; read them in parallel batches
- **Context matters**: Read surrounding code, not just the target section

### General Efficiency
- **Batch independent operations**: Never call the same tool type multiple times sequentially when parallel calls are possible
- **Minimize tool calls**: Combine related operations; gather all context before acting
- **No unnecessary documentation**: Don't create markdown summaries or change logs unless explicitly requested

## Development Approach

- **Runtime**: [Deno](https://deno.com/) 2.x — runs TypeScript natively, no build step required
- **Standard library**: `https://deno.land/std@0.224.0/` (path, fs, assert, testing/bdd, cli)
- **YAML**: `npm:js-yaml@4` (via Deno's npm compatibility)
- **Testing**: `deno task test` — runs `deno test --allow-read --allow-write --allow-env test/`
- **Running**: `deno task start <args>` or `deno run --allow-read --allow-write --allow-env --allow-run --allow-net src/cli.ts <args>`
- **Key source modules**: `src/cli.ts` (entry point), `src/commands/`, `src/registry/`, `src/resolvers/`, `src/skills/`, `src/exporters/`
- **No Node.js**: Do not use `node:` imports, `process.*`, or npm packages requiring Node APIs

## Out of MVP Scope
- Background daemon or service
- Browser extension or UI injection
- Automatic platform detection and injection
- Project-level skill defaults
- Script execution or template evaluation
- Remote code execution of any kind

## Key References
- [j-skill_README.md](j-skill_README.md) — Full product positioning and design rationale
