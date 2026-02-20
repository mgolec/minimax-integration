import { parseCsv } from './csv-parser.js';
import { parseMt940 } from './mt940-parser.js';
import { parseCamt053 } from './xml-camt053-parser.js';
import type { ParseResult, ColumnMapping } from './types.js';

export type BankStatementFormat = 'csv' | 'mt940' | 'xml';

export interface ParseOptions {
  format?: BankStatementFormat;
  csvMapping?: ColumnMapping;
  csvDelimiter?: string;
  csvSkipLines?: number;
  csvHasHeader?: boolean;
}

export function detectFormat(content: string, filename?: string): BankStatementFormat {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (ext === 'xml' || ext === 'camt053') return 'xml';
  if (ext === 'sta' || ext === 'mt940' || ext === 'swi') return 'mt940';
  if (ext === 'csv' || ext === 'txt') return 'csv';

  // Content-based detection
  const trimmed = content.trim();
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<Document')) return 'xml';
  if (trimmed.includes(':20:') && trimmed.includes(':61:')) return 'mt940';
  return 'csv';
}

export function parseBankStatement(content: string, options?: ParseOptions & { filename?: string }): ParseResult {
  const format = options?.format ?? detectFormat(content, options?.filename);

  switch (format) {
    case 'csv':
      return parseCsv(content, options?.csvMapping, {
        delimiter: options?.csvDelimiter,
        skipLines: options?.csvSkipLines,
        hasHeader: options?.csvHasHeader,
      });
    case 'mt940':
      return parseMt940(content);
    case 'xml':
      return parseCamt053(content);
    default:
      throw new Error(`Unsupported bank statement format: ${format}`);
  }
}

export { parseCsv } from './csv-parser.js';
export { parseMt940 } from './mt940-parser.js';
export { parseCamt053 } from './xml-camt053-parser.js';
export type { BankTransaction, ParseResult, ColumnMapping } from './types.js';
