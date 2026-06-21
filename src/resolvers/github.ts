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
 * HTTP 301/302 redirects are followed manually because Node's built-in `https`
 * module does not follow redirects automatically.
 *
 * Seam: httpsGet is a private helper; replace it with a fetch-based
 * implementation (Node 18+) if a richer HTTP client is needed (e.g., auth
 * headers, rate-limit handling, GITHUB_TOKEN support).
 */
import { get } from 'node:https';
import { IncomingMessage } from 'node:http';

interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
  sha: string;
}

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    get(
      { hostname: opts.hostname, path: opts.pathname + opts.search, headers: { 'User-Agent': 'j-skill/0.1' } },
      (res: IncomingMessage) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          resolve(httpsGet(res.headers.location!));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        res.on('error', reject);
      }
    ).on('error', reject);
  });
}

export async function fetchGitHubContents(
  owner: string,
  repo: string,
  path = ''
): Promise<GitHubContentItem[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const body = await httpsGet(url);
  return JSON.parse(body) as GitHubContentItem[];
}

export async function fetchGitHubFile(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const body = await httpsGet(url);
  const item = JSON.parse(body) as { content: string; encoding: string };
  if (item.encoding === 'base64') {
    return Buffer.from(item.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  }
  if (item.encoding === 'none' && item.content === '') {
    // Large file – fall back to download_url
    const parsed = JSON.parse(body) as GitHubContentItem;
    if (parsed.download_url) {
      return httpsGet(parsed.download_url);
    }
  }
  return item.content;
}
