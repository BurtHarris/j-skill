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

export async function copyToClipboard(text: string): Promise<void> {
  const input = new TextEncoder().encode(text);
  const os = Deno.build.os;

  async function run(program: string, args: string[] = []): Promise<void> {
    const child = new Deno.Command(program, {
      args,
      stdin: "piped",
      stdout: "null",
      stderr: "null",
    }).spawn();
    const writer = child.stdin.getWriter();
    await writer.write(input);
    await writer.close();
    const status = await child.status;
    if (!status.success) {
      throw new Error(`${program} exited with code ${status.code}`);
    }
  }

  if (os === "darwin") {
    await run("pbcopy");
  } else if (os === "windows") {
    await run("clip");
  } else {
    try {
      await run("xclip", ["-selection", "clipboard"]);
    } catch {
      await run("xsel", ["--clipboard", "--input"]);
    }
  }
}
