/**
 * diagnostics.ts — Collect-all-errors-then-report diagnostic accumulator.
 *
 * Rather than throwing on the first error encountered during an operation (e.g.
 * import), callers push errors and warnings into a Diagnostics instance, finish
 * processing all items, then call report() once at the end. This ensures the
 * user sees the complete set of problems in a single run.
 *
 * Output format mirrors the VSCode problem matcher convention:
 *   [file: ]error|warning: <message>
 *
 * Seam: the Diagnostic interface is intentionally minimal; extend it (e.g. with
 * line/column fields) if structured editor integration is needed later.
 */
export interface Diagnostic {
  severity: 'error' | 'warning';
  message: string;
  file?: string;
}

export class Diagnostics {
  private items: Diagnostic[] = [];

  error(message: string, file?: string): void {
    this.items.push({ severity: 'error', message, file });
  }

  warn(message: string, file?: string): void {
    this.items.push({ severity: 'warning', message, file });
  }

  get errors(): Diagnostic[] {
    return this.items.filter(d => d.severity === 'error');
  }

  get warnings(): Diagnostic[] {
    return this.items.filter(d => d.severity === 'warning');
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  report(): void {
    for (const d of this.items) {
      const prefix = d.file ? `${d.file}: ` : '';
      const level = d.severity === 'error' ? 'error' : 'warning';
      console.error(`${prefix}${level}: ${d.message}`);
    }
  }
}
