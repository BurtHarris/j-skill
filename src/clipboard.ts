/**
 * clipboard.ts — Platform-specific clipboard write helper.
 *
 * Writes a string to the system clipboard using the native OS utility:
 *   - macOS  : pbcopy
 *   - Windows: clip
 *   - Linux  : xclip (falls back to xsel if xclip is not found)
 *
 * Seam: extend the else-branch to add support for additional platforms or
 * clipboard utilities (e.g., wl-copy for Wayland).
 */
import { execSync } from 'node:child_process';

export function copyToClipboard(text: string): void {
  const platform = process.platform;
  if (platform === 'darwin') {
    execSync('pbcopy', { input: text });
  } else if (platform === 'win32') {
    execSync('clip', { input: text });
  } else {
    try {
      execSync('xclip -selection clipboard', { input: text });
    } catch {
      execSync('xsel --clipboard --input', { input: text });
    }
  }
}
