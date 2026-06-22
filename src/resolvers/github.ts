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
 * Seam: replace the fetchJson/fetchText helpers with a richer HTTP client if
 * auth headers, rate-limit handling, or GITHUB_TOKEN support is needed.
 */

interface GitHubContentItem {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
  sha: string;
}

async function fetchJson(url: string): Promise<unknown> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "j-skill/0.1" },
  });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${url}`);
  }
  return resp.json();
}

async function fetchText(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "j-skill/0.1" },
  });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${url}`);
  }
  return resp.text();
}

export async function fetchGitHubContents(
  owner: string,
  repo: string,
  path = "",
): Promise<GitHubContentItem[]> {
  const url =
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  return (await fetchJson(url)) as GitHubContentItem[];
}

export async function fetchGitHubFile(
  owner: string,
  repo: string,
  path: string,
): Promise<string> {
  const url =
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const item = (await fetchJson(url)) as {
    content: string;
    encoding: string;
    download_url?: string | null;
  };
  if (item.encoding === "base64") {
    const binary = atob(item.content.replace(/\n/g, ""));
    return new TextDecoder().decode(
      Uint8Array.from(binary, (c) => c.charCodeAt(0)),
    );
  }
  if ((!item.content || item.encoding === "none") && item.download_url) {
    return fetchText(item.download_url);
  }
  return item.content;
}
