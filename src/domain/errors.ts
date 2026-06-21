import type { Diagnostic } from './types.ts';

export class DiagnosticError extends Error {
  public readonly diagnostics: Diagnostic[];

  public constructor(message: string, diagnostics: Diagnostic[]) {
    super(message);
    this.name = 'DiagnosticError';
    this.diagnostics = diagnostics;
  }
}

export class DiagnosticCollector {
  private readonly diagnostics: Diagnostic[] = [];

  public add(severity: Diagnostic['severity'], message: string, location?: string): void {
    this.diagnostics.push({ severity, message, location });
  }

  public error(message: string, location?: string): void {
    this.add('error', message, location);
  }

  public warning(message: string, location?: string): void {
    this.add('warning', message, location);
  }

  public hasErrors(): boolean {
    return this.diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  }

  public all(): Diagnostic[] {
    return [...this.diagnostics];
  }

  public throwIfAnyErrors(message: string): void {
    if (this.hasErrors()) {
      throw new DiagnosticError(message, this.all());
    }
  }
}
