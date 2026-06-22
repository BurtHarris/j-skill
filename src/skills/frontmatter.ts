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
import { load as parseYaml } from "npm:js-yaml@4";

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

export function parseFrontmatter(content: string): ParsedSkill {
  const match = FRONTMATTER_RE.exec(content);
  if (!match) {
    return { frontmatter: {}, body: content.trimEnd(), hasFrontmatter: false };
  }
  const raw = parseYaml(match[1]);
  const frontmatter = (raw != null && typeof raw === "object") ? raw as Partial<SkillFrontmatter> : {};
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
