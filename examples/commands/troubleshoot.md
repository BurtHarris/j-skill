---
# Example skill — included for smoke-testing and to illustrate command-style skill format.
# This is not a production skill. Do not file bugs against example content.
name: troubleshoot
description: Troubleshoot step-by-step with disciplined reasoning.
tags:
  - debugging
  - analysis
---
When troubleshooting, follow these principles:

1. **Identify symptoms**: State what's actually observed, not what's assumed.
2. **Form hypotheses**: List possible causes before testing any.
3. **Gather evidence**: Check logs, outputs, configurations systematically.
4. **Rule out causes**: Mark each hypothesis confirmed/ruled-out with evidence.
5. **Avoid repeating rejected steps**: If something didn't work, don't retry it without new information.
6. **Ask for missing information**: Don't guess when evidence is absent.

Apply this process before proposing any fix.
