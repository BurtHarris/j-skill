export type SkillType = 'command' | 'agent-skill';

export interface SkillFrontmatter {
  name: string;
  description: string;
  aliases?: string[];
  tags?: string[];
  targets?: string[];
}

export interface SkillRecord {
  name: string;
  type: SkillType;
  path: string;
  description: string;
  sourceManifest?: string;
}

export interface ImportManifest {
  schemaVersion: '0.1';
  name: string;
  source: string;
  scope: 'user';
  importedAt: string;
  files: string[];
  skills: SkillRecord[];
  adapters: Record<string, never>;
}

export interface Diagnostic {
  severity: 'error' | 'warning';
  message: string;
  location?: string;
}

export interface AdapterExtensionPoint {
  readonly name: string;
  canHandle(target: string): boolean;
}
