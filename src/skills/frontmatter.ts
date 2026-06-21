import fs from "node:fs/promises";
import { DiagnosticError } from '../domain/errors.ts';
import type { Diagnostic, SkillFrontmatter } from '../domain/types.ts';

export interface ParsedSkillDocument {
  frontmatter: SkillFrontmatter;
  body: string;
}

export async function parseSkillFile(filePath: string): Promise<ParsedSkillDocument> {
  const content = await fs.readFile(filePath, 'utf8');
  return parseSkillText(content, filePath);
}

export function parseSkillText(content: string, location = '<memory>'): ParsedSkillDocument {
  const diagnostics: Diagnostic[] = [];
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    throw new DiagnosticError('Skill file must start with YAML frontmatter.', [
      { severity: 'error', message: 'Missing YAML frontmatter.', location },
    ]);
  }

  const [, rawFrontmatter, body] = match;
  const parsed = parseSimpleYamlFrontmatter(rawFrontmatter, diagnostics, location);
  const name = typeof parsed?.name === 'string' ? parsed.name.trim() : '';
  const description = typeof parsed?.description === 'string' ? parsed.description.trim() : '';

  if (!name) {
    diagnostics.push({
      severity: 'error',
      message: 'Missing required frontmatter field "name".',
      location,
    });
  }

  if (!description) {
    diagnostics.push({
      severity: 'error',
      message: 'Missing required frontmatter field "description".',
      location,
    });
  }

  if (/\s/.test(name)) {
    diagnostics.push({
      severity: 'error',
      message: 'Skill names must not contain spaces.',
      location,
    });
  }

  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    throw new DiagnosticError(`Invalid skill file: ${location}`, diagnostics);
  }

  return {
    frontmatter: {
      name,
      description,
      aliases: stringArray(parsed?.aliases),
      tags: stringArray(parsed?.tags),
      targets: stringArray(parsed?.targets),
    },
    body: body.replace(/^\r?\n/, ''),
  };
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value.filter((entry): entry is string => typeof entry === 'string');
  return normalized.length > 0 ? normalized : undefined;
}

function parseSimpleYamlFrontmatter(
  rawFrontmatter: string,
  diagnostics: Diagnostic[],
  location: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = rawFrontmatter.split(/\r?\n/);
  let currentArrayKey: string | null = null;

  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }

    const arrayEntry = line.match(/^\s*-\s*(.+)\s*$/);
    if (arrayEntry) {
      if (currentArrayKey === null) {
        diagnostics.push({
          severity: 'error',
          message: `Array entry "${arrayEntry[1]}" does not belong to a key.`,
          location,
        });
        continue;
      }

      const current = result[currentArrayKey];
      if (Array.isArray(current)) {
        current.push(stripQuotes(arrayEntry[1].trim()));
      }
      continue;
    }

    const keyValue = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!keyValue) {
      diagnostics.push({
        severity: 'error',
        message: `Unsupported frontmatter line: ${line}`,
        location,
      });
      continue;
    }

    const [, key, rawValue = ''] = keyValue;
    const trimmedValue = rawValue.trim();
    if (trimmedValue.length === 0) {
      result[key] = [];
      currentArrayKey = key;
      continue;
    }

    result[key] = stripQuotes(trimmedValue);
    currentArrayKey = null;
  }

  return result;
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith('\'') && value.endsWith('\''))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
