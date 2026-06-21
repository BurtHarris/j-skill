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
