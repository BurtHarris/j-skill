# Copilot CLI Tips for j-skill Work

This file is the working user tips reference for using GitHub Copilot CLI effectively with `j-skill`. Keep it current as patterns, commands, and preferred workflows evolve.

## Practical Copilot CLI Tips

1. **Use `/research` before local execution when the issue is already “known”.**
   
   If the task starts with “this is a known issue” or “look it up if you need to”, start with `/research` to gather the issue shape and external evidence first, then switch back to the main session for local commands and edits.

2. **Use `/ask` for side questions that would otherwise derail the main thread.**
   
   When a session branches into “could it be X?”, “what does this warning mean?”, or “how do I check Y?”, use `/ask` so the main implementation or troubleshooting thread stays coherent.

3. **Prefer a compact status packet over `continue` / `done` / `yes`.**
   
   The agent gives better next steps when you report:
   - what you ran
   - exact output or error
   - what changed
   
   Example:
   
   ```text
   Ran the import again; it created the manifest but did not list the command skill; no error output; what's the next safest check?
   ```

4. **Use `/env` and `/instructions` when switching repos or machines.**
   
   This is the fastest way to confirm which instructions, skills, agents, MCP servers, and extensions are actually loaded before assuming behavior is repo-local.

5. **Background long-running work when you already know the next independent task.**
   
   Use `ctrl+x` then `b`, or `/tasks`, when one thread is waiting on research, review, or a long-running command and you can make progress elsewhere.

## Simple `mattpocock/skills` Example

Import a public collection into the personal `j-skill` registry:

```powershell
node --experimental-strip-types src/cli.ts import mattpocock/skills
```

List imported skills:

```powershell
node --experimental-strip-types src/cli.ts list
```

Render one skill:

```powershell
node --experimental-strip-types src/cli.ts grill-me
```

Render and copy one skill:

```powershell
node --experimental-strip-types src/cli.ts grill-me --copy
```

## Storage Model Clarification

`j-skill` imports into its **own personal registry first**:

- cross-platform shorthand: `~/.agents`
- Windows canonical path: `%USERPROFILE%\\.agents`

That registry is the system of record for imported skills, manifests, and local user-authored skills.

GitHub Copilot concepts that may fit into the longer-term scope of this project include:

- **instruction files** — repository or user-scoped instruction documents that shape Copilot behavior
- **prompts** — reusable invocation text or task framing that a user may want to store, render, and apply consistently
- **agents** — named behavior bundles or task-oriented personas that may eventually consume rendered skills or exported instructions
- **skills** — reusable capability packages or instruction sets, especially where Copilot adopts structured skill discovery and management
- **plugins** — extension points that can add capabilities or integrations around Copilot workflows
- **MCP servers** — tool and data providers exposed through the Model Context Protocol, relevant if `j-skill` later helps compose behavior with available tools
- **custom instructions directories** — user or repo-level instruction folder conventions that could become explicit export targets
- **subagents or delegated tasks** — structured task handoff mechanisms that may benefit from portable behavioral overlays
- **session memory or persistent preferences** — durable Copilot behavior layers that overlap conceptually with user-owned skills
- **adapter/export manifests** — bookkeeping needed if `j-skill` later writes into Copilot-specific surfaces and must support clean uninstall or reconciliation

should be treated as **adapter or export targets**, not as the primary import location for `j-skill`.

In other words:

1. `j-skill` imports and manages user-owned skill content in its own registry
2. platform-specific conventions are layered on later through explicit adapter behavior
3. importing a skill collection must not implicitly rewrite Copilot-specific files or directories

This keeps `j-skill` portable even as Copilot’s framework evolves.
