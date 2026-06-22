/**
 * resolvers/github.ts — GitHub Contents API fetcher.
 *
 * Provides two public functions used by the import command:
 *   fetchGitHubContents(owner, repo, path?) — list directory entries
 *   fetchGitHubFile(owner, repo, path)      — fetch and decode a single file
 *
 * Files returned by the Contents API are base64-encoded. Large files (>1 MB)
 * have encoding='none' and an empty content field; those are fetched via the
 * download_url instead.
 *
 * Uses the standard fetch() API (available in Deno and modern runtimes),
 * which handles HTTP redirects automatically.
 *
 * Seam: to add authentication (GITHUB_TOKEN), inject an Authorization header
 * into the fetchJson() call and thread the token through the public functions.
 */

interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
  sha: string;
}

async function fetchJson(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'j-skill/0.1' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

export async function fetchGitHubContents(
  owner: string,
  repo: string,
  path = ''
): Promise<GitHubContentItem[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const body = await fetchJson(url);
  return JSON.parse(body) as GitHubContentItem[];
}

export async function fetchGitHubFile(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const body = await fetchJson(url);
  const item = JSON.parse(body) as { content: string; encoding: string };
  if (item.encoding === 'base64') {
    const binaryStr = atob(item.content.replace(/\n/g, ''));
    return new TextDecoder().decode(
      Uint8Array.from(binaryStr, c => c.charCodeAt(0))
    );
  }
  if (item.encoding === 'none' && item.content === '') {
    // Large file – fall back to download_url
    const parsed = JSON.parse(body) as GitHubContentItem;
    if (parsed.download_url) {
      return fetchJson(parsed.download_url);
    }
  }
  return item.content;
}
