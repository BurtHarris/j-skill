## 1) Vision Note

### Working Thesis

j-skill is a personal control plane for portable AI skills.

Its core idea is simple: AI behavior should follow the user, not the tool. A user should be able to define or import a skill once, keep it in a user-owned registry, and export or apply it across different AI systems without rewriting the same behavior in each platform.

### Product Shape

The product starts from a deliberately small unit: a simple skill.

For M0, the primary target is the lightweight, portable, Matt Pocock–style skill concept: a small skill artifact that can be imported, listed, rendered, copied, and exported. The canonical form is owned by j-skill rather than by any external platform.

The product is not initially centered on full custom agents, background automation, or platform-native orchestration. Instead, it starts with a portable skill unit that can later participate in richer compositions.

### Canonical Model

j-skill should maintain a canonical YAML + Markdown representation of a skill.

That canonical representation is the system of record. External ecosystems are treated as:

- import sources
- export targets
- adapter surfaces

This allows j-skill to remain stable even when platform-specific formats evolve.

### Registry Model

j-skill manages skills in a personal, user-owned registry. Imports should land in the j-skill registry first, not directly in any vendor-specific storage location.

This preserves:

- portability
- explicit user control
- provenance tracking
- clean export/uninstall behavior
- reduced coupling to rapidly changing AI platforms

### Adapter Model

j-skill should support adapters that convert between the canonical YAML/Markdown representation and the target platform’s required schema or file layout.

Examples of export targets include:

- GitHub Copilot customization surfaces
- Microsoft 365 Copilot declarative-agent style surfaces
- Gemini Gems–style saved assistant surfaces
- future agent/package/plugin systems

The adapter model works in both directions:

- Export adapters lower canonical j-skills into platform-native forms.
- Import adapters detect incoming structures and map them into the canonical model.

### Import Philosophy

Imports may come from looser or partially structured formats.

Examples:

- Markdown skill files
- multi-file skill packages
- agent-related file families
- plugin or manifest-driven bundles
- UI-authored assistants exported through limited metadata

Import should therefore include:

1. format detection
2. schema mapping
3. provenance recording
4. lossiness warnings where needed

### M0 Scope

M0 focuses on:

- a simple canonical skill format
- import of lightweight skill-like packages
- a personal registry
- render/copy/list primitives
- export adapters to major AI UI surfaces

M0 does not need to fully model every target platform’s richest agent concepts.

The goal is to establish the portable foundation first.

### Long-Term Direction

In the longer term, a simple skill may become one component inside a richer packaged custom agent.

That means the architecture should leave room for composition later:

- one or more skills
- optional knowledge bindings
- optional tool/action bindings
- optional target-specific metadata
- agent/package distribution details

But those richer compositions should build on the simple skill atom rather than replace it.

### Strategic Positioning

j-skill differs from platform-native custom assistants by treating a skill as:

- portable
- user-owned
- adapter-friendly
- composable
- independent from any one assistant UI

Platform-native assistants may be a destination. j-skill is the layer that makes them portable.

---

## 2) Project Glossary

### Skill

A reusable behavioral instruction artifact that can be applied across AI systems.

In M0, this is the primary unit of value.

### Simple Skill

A lightweight skill artifact, close in spirit to Matt Pocock–style skills. Usually a single portable definition with instructions and metadata, rather than a full hosted agent.

### Canonical Format

The internal j-skill source-of-truth representation, likely YAML + Markdown. This is the stable model used for storage, rendering, import normalization, and export.

### Registry

The local, user-owned store of imported and authored skills managed by j-skill.

### Adapter

A conversion layer between the canonical j-skill format and a target platform’s native representation.

### Import Adapter

A component that detects an incoming format and maps it into the canonical j-skill model.

### Export Adapter

A component that lowers a canonical j-skill into a target platform’s required files, manifests, or schema.

### Manifest

A structured metadata document that describes a skill, package, source, lifecycle, or export state.

### Canonical Manifest

The structured metadata representation used by j-skill internally to track a skill or import, independent of vendor-specific manifests.

### Platform Manifest

A target-specific manifest required by a destination ecosystem, such as a declarative agent manifest or plugin manifest.

### YAML + Markdown Model

A design approach in which structured metadata lives in YAML and human-authored behavioral content lives in Markdown. This may be implemented as frontmatter or as multi-document content.

### Multi-Document Format

A file approach that combines multiple YAML or Markdown documents in one logical artifact, potentially separated by YAML document markers. Useful for expressing structured sections without requiring a rigid JSON-only manifest.

### Provenance

Metadata describing where imported content came from, when it was imported, and how it was mapped.

### Lossy Mapping

A conversion where source information cannot be perfectly represented in the destination format, or vice versa.

### Knowledge Binding

A reference from a skill or future agent package to supporting documents, files, URLs, or other knowledge sources.

### Tool Binding

A reference from a skill or future agent package to callable tools, plugins, APIs, MCP servers, or action surfaces.

### Package

A future higher-level construct made of one or more skills plus optional knowledge, tool bindings, and platform metadata.

### Agent

A richer assistant construct offered by a target platform. In j-skill thinking, an agent is often a destination or composition target rather than the canonical M0 unit.

### Skill Package

A portable grouping of one or more skills and related resources.

### Skill Atom

An informal term for the smallest portable unit in the system: the simple skill.

### File Family

A set of related files that together define customization behavior in a platform, such as instructions, agents, prompts, and related metadata.

### Format Detection

The import-stage process of identifying the structure or ecosystem of incoming content.

### Schema Mapping

The transformation from one format’s fields and concepts into another format’s fields and concepts.

### Greenfield

The current project state: early, unconstrained, and not yet burdened by legacy compatibility or a large existing feature set.

---

## 3) Greenfield Guidance Note

### Purpose of This Note

This note is intended to keep the project focused while it is still early.

It should guide decisions without prematurely expanding scope.

### Primary Rule

Protect M0.

When in doubt, choose the design that preserves a small, coherent MVP centered on simple portable skills.

### What Must Stay True

The following principles should remain stable during early development:

- j-skill owns the canonical format
- the registry is personal and user-owned
- imports normalize into the registry first
- exports happen explicitly through adapters
- skills are data, not code
- the first unit is a simple skill, not a full custom agent

### What M0 Should Prove

M0 should prove that j-skill can:

1. define a simple canonical skill
2. import lightweight skill-like sources
3. store them in a user-owned registry
4. render/list/copy them reliably
5. export them into multiple target ecosystems

If those five things work cleanly, the foundations are strong.

### What To Avoid Right Now

Avoid taking on complexity that belongs to a later packaging or agent-composition phase.

Examples of likely distractions:

- full agent packaging as a first-class MVP concept
- deep runtime execution models
- automatic injection into AI tools
- daemon/background behavior
- ambitious workflow orchestration
- over-modeling every target platform’s richest schema
- trying to unify all plugin/action systems in M0

These may matter later, but they should not reshape the M0 core.

### Acceptable Architecture Tweaks

Architecture may still evolve at this stage, especially if changes improve:

- clarity of the canonical skill model
- separation between canonical data and adapter logic
- provenance tracking
- import/export lossiness handling
- future package composition without complicating M0

A good early tweak is one that simplifies today while preserving tomorrow.

### Recommended Architectural Biases

Prefer:

- simple canonical objects
- explicit lifecycle tracking
- explicit adapter boundaries
- additive evolution over premature abstraction
- portability over deep coupling to any one vendor surface

### Suggested Layering

Keep the architecture mentally separated into four layers:

1. Canonical skill layer - The portable YAML + Markdown skill definition.

2. Registry and manifest layer - Storage, provenance, lifecycle, and indexing.

3. Adapter layer - Import/export mapping to external ecosystems.

4. Future composition layer - Packages, agent bundles, tool bindings, and richer exports.

M0 should live mainly in layers 1–3.

### Design Smell Warnings

Treat the following as early warning signs:

- the canonical model starts to look like one vendor’s schema
- M0 needs target-specific fields in the core object to function
- skill rendering depends on a specific platform UI
- import becomes a raw file copy instead of normalization
- export begins to mutate the registry source of truth
- package/agent composition becomes required for basic use

### Preferred Decision Heuristic

When choosing between two designs, prefer the one that better answers:

“Does this make a simple skill more portable, more understandable, and easier to adapt?”

If not, it probably belongs after M0.

### Near-Term Outcome

At the end of the greenfield phase, the project should ideally have:

- one clear canonical skill shape
- one clear registry shape
- one clear manifest/provenance shape
- a small import pipeline
- a small export adapter interface
- at least a few credible export targets

That is enough to justify the broader vision without prematurely building the entire ecosystem.