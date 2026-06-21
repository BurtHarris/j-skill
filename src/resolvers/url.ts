export interface ParsedSource {
  type: 'local' | 'github' | 'github-url';
  owner?: string;
  repo?: string;
  localPath?: string;
  originalUrl?: string;
}

const GITHUB_URL_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/;
const GITHUB_SHORTHAND_RE = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/;

export function parseSource(source: string): ParsedSource | null {
  // Full GitHub HTTPS URL
  const urlMatch = GITHUB_URL_RE.exec(source);
  if (urlMatch) {
    return { type: 'github-url', owner: urlMatch[1], repo: urlMatch[2], originalUrl: source };
  }

  // Local path (absolute or relative)
  if (source.startsWith('.') || source.startsWith('/') || source.startsWith('~')) {
    return { type: 'local', localPath: source };
  }

  // GitHub owner/repo shorthand
  const shorthandMatch = GITHUB_SHORTHAND_RE.exec(source);
  if (shorthandMatch) {
    return { type: 'github', owner: shorthandMatch[1], repo: shorthandMatch[2] };
  }

  return null;
}
