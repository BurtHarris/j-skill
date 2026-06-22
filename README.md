# j-skill

A personal control plane for portable AI skills.

**Status**: MVP implemented. Built with [Deno](https://deno.com/) — distributed as a self-contained compiled binary (no runtime required).

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

For end users who install the **pre-compiled binary** from GitHub Releases: **none** — the binary is self-contained.

For contributors who want to run from source or hack on the code:

- [Deno](https://deno.com/) 2.0 or later

## Installation

### Pre-compiled binary (recommended)

Download the latest binary for your platform from the [GitHub Releases page](https://github.com/BurtHarris/j-skill/releases):

| Platform | File |
|----------|------|
| Windows x64 | `j-skill-windows-x64.exe` |
| macOS Apple Silicon | `j-skill-macos-arm64` |
| macOS Intel | `j-skill-macos-x64` |
| Linux x64 | `j-skill-linux-x64` |
| Linux ARM64 | `j-skill-linux-arm64` |

Place the binary on your `PATH` (rename to `j-skill` on macOS/Linux and mark it executable: `chmod +x j-skill`).

### Winget (Windows)

Once a release is published to the [winget-pkgs](https://github.com/microsoft/winget-pkgs) community repository:

```powershell
winget install BurtHarris.j-skill
```

### Run from source (contributors)

```bash
# Clone the repo and run directly
git clone https://github.com/BurtHarris/j-skill.git
cd j-skill
deno task start --help

# Or compile a local binary
deno task compile       # outputs dist/j-skill (current platform)
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

# Run the CLI directly (from source)
deno task start import ./examples
deno task start list
deno task start concise

# Compile a binary for the current platform
deno task compile       # outputs dist/j-skill

# Lint and format
deno task lint
deno task fmt
```

### VS Code

Open the folder in VS Code and accept the prompt to install the recommended extension (**Deno** — `denoland.vscode-deno`).

- **F5** — launches the CLI with the debugger attached (prompts you to set CLI args in `.vscode/launch.json`)
- **Test CodeLens** — run or debug individual tests directly from the editor
- **Debug Tests** launch config — runs the full test suite under the debugger

## What's In This Repo

- **src/** — TypeScript source (runs natively under Deno)
- **bin/j-skill** — Deno shebang executable (run from source)
- **test/** — Test suite (run with `deno task test`)
- **examples/** — Sample skill collection
- **.vscode/** — VS Code settings, debug configs, and recommended extensions
- **.github/workflows/release.yml** — CI workflow: compiles binaries and publishes GitHub Releases on version tags
- **j-skill_README.md** — Full requirements and product vision
- **AGENTS.md** — Instructions for AI agents contributing to this project
- **DESIGN.md** — Concrete implementation design decisions

## References

- [Full Product Vision](j-skill_README.md)
- [AI Agent Instructions](AGENTS.md)
- [Design Decisions](DESIGN.md)
- Inspired by: [mattpocock/skills](https://github.com/mattpocock/skills) and the emerging [Agent Skills community standard](https://github.com/mattpocock/skills)
