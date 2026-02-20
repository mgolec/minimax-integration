import { parse } from 'csv-parse/sync';
import type { BankTransaction, ParseResult, ColumnMapping } from './types.js';

const DEFAULT_MAPPING: ColumnMapping = {
  date: 0,
  amount: 1,
  description: 2,
  counterpartyName: 3,
  counterpartyIBAN: 4,
  reference: 5,
};

export function parseCsv(
  content: string,
  mapping: ColumnMapping = DEFAULT_MAPPING,
  options?: { delimiter?: string; skipLines?: number; hasHeader?: boolean },
): ParseResult {
  const delimiter = options?.delimiter ?? ';';
  const hasHeader = options?.hasHeader ?? true;

  const records: string[][] = parse(content, {
    delimiter,
    relaxColumnCount: true,
    skipEmptyLines: true,
  });

  const startIdx = (options?.skipLines ?? 0) + (hasHeader ? 1 : 0);
  const header = hasHeader ? records[options?.skipLines ?? 0] : undefined;

  const transactions: BankTransaction[] = [];

  for (let i = startIdx; i < records.length; i++) {
    const row = records[i];
    if (!row || row.length === 0) continue;

    const getValue = (col: number | string | undefined): string | undefined => {
      if (col === undefined) return undefined;
      if (typeof col === 'number') return row[col]?.trim();
      // Column name lookup
      if (header) {
        const idx = header.findIndex((h) => h.trim().toLowerCase() === (col as string).toLowerCase());
        if (idx >= 0) return row[idx]?.trim();
      }
      return undefined;
    };

    const dateStr = getValue(mapping.date);
    if (!dateStr) continue;

    let amount: number;
    if (mapping.credit !== undefined && mapping.debit !== undefined) {
      const credit = parseFloat(getValue(mapping.credit)?.replace(/[^\d.,-]/g, '').replace(',', '.') || '0');
      const debit = parseFloat(getValue(mapping.debit)?.replace(/[^\d.,-]/g, '').replace(',', '.') || '0');
      amount = credit - debit;
    } else {
      const amountStr = getValue(mapping.amount)?.replace(/[^\d.,-]/g, '').replace(',', '.') || '0';
      amount = parseFloat(amountStr);
    }

    if (isNaN(amount)) continue;

    transactions.push({
      date: normalizeDate(dateStr),
      amount,
      description: getValue(mapping.description) ?? '',
      counterpartyName: getValue(mapping.counterpartyName),
      counterpartyIBAN: getValue(mapping.counterpartyIBAN),
      reference: getValue(mapping.reference),
      currency: getValue(mapping.currency),
    });
  }

  return { transactions };
}

function normalizeDate(dateStr: string): string {
  // Try DD.MM.YYYY (Croatian format)
  const dotMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) return `${dotMatch[3]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[1].padStart(2, '0')}`;

  // Try DD/MM/YYYY
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  return dateStr;
}
