---
# Example skill — included for smoke-testing and to illustrate agent-skill package format.
# This is not a production skill. Do not file bugs against example content.
name: diagnose
description: Debug methodically using evidence-based reasoning.
tags:
  - debugging
  - analysis
targets:
  - github-copilot
---
# Diagnose

Use this skill to systematically diagnose issues in code or systems.

## Process

1. **Clarify the problem**: Understand the actual failure before investigating.
2. **Reproduce the issue**: Confirm the problem is reproducible.
3. **Isolate the scope**: Identify what's in scope and what's not.
4. **Form hypotheses**: List potential causes ranked by likelihood.
5. **Test hypotheses**: Gather evidence systematically.
6. **Confirm the root cause**: Verify the fix addresses the root cause, not just the symptom.

## Constraints

- Do not repeat steps that have already been ruled out.
- Always ask for missing information rather than guessing.
- State assumptions explicitly.
