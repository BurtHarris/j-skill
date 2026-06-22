/**
 * skills/frontmatter.ts — YAML frontmatter parser and validator for skill files.
 *
 * Skill files (.md) use a YAML frontmatter block delimited by `---` lines.
 * parseFrontmatter() extracts the YAML block and the remaining Markdown body.
 * validateFrontmatter() enforces the required fields (`name`, `description`) and
 * naming constraints (no spaces in `name`).
 *
 * Required frontmatter fields:
 *   name        — unique identifier, no spaces
 *   description — one-line summary shown by `j-skill list`
 *
 * Optional fields:
 *   aliases, tags, targets — passed through as-is; not validated at MVP.
 *
 * Seam: add new required or optional field validation inside validateFrontmatter.
 * Extend SkillFrontmatter with typed optional fields as the schema stabilises.
 */

export interface SkillFrontmatter {
  name: string;
  description: string;
  aliases?: string[];
  tags?: string[];
  targets?: string[];
  [key: string]: unknown;
}

export interface ParsedSkill {
  frontmatter: Partial<SkillFrontmatter>;
  body: string;
  hasFrontmatter: boolean;
}

const FRONTMATTER_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?([\s\S]*)$/;

/**
 * Minimal YAML parser for skill frontmatter. Handles the subset of YAML
 * used in skill files: scalar string values, block sequences (- item), and
 * flow sequences ([a, b, c]). This avoids any external YAML library dependency.
 */
function parseYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('#')) { i++; continue; }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) { i++; continue; }

    const key = trimmed.slice(0, colonIdx).trim();
    const rest = trimmed.slice(colonIdx + 1).trim();

    if (rest === '') {
      // Block sequence: collect indented `- item` lines
      const items: string[] = [];
      i++;
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.startsWith('- ')) { items.push(t.slice(2).trim()); i++; }
        else if (t === '') { i++; }
        else { break; }
      }
      result[key] = items.length > 0 ? items : null;
    } else if (rest.startsWith('[') && rest.endsWith(']')) {
      // Flow sequence: [a, b, c]
      result[key] = rest.slice(1, -1).split(',').map(s => s.trim()).filter(s => s.length > 0);
    } else {
      // Scalar — strip surrounding quotes
      const v = rest;
      result[key] = (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))
        ? v.slice(1, -1)
        : v;
      i++;
    }
  }

  return result;
}

export function parseFrontmatter(content: string): ParsedSkill {
  const match = FRONTMATTER_RE.exec(content);
  if (!match) {
    return { frontmatter: {}, body: content.trimEnd(), hasFrontmatter: false };
  }
  const raw = parseYaml(match[1]);
  const frontmatter = (raw != null && typeof raw === 'object') ? raw as Partial<SkillFrontmatter> : {};
  const body = match[2].trimEnd();
  return { frontmatter, body, hasFrontmatter: true };
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

const NAME_RE = /^[^\s]+$/;

export function validateFrontmatter(
  frontmatter: Partial<SkillFrontmatter>,
  filePath: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!frontmatter.name) {
    errors.push(`${filePath}: missing required field 'name' in frontmatter`);
  } else if (!NAME_RE.test(frontmatter.name)) {
    errors.push(`${filePath}: skill name '${frontmatter.name}' must not contain spaces`);
  }

  if (!frontmatter.description) {
    errors.push(`${filePath}: missing required field 'description' in frontmatter`);
  }

  return { errors, warnings };
}
