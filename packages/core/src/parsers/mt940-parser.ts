import type { BankTransaction, ParseResult } from './types.js';

/**
 * Parses MT940 (SWIFT) bank statement format.
 * MT940 uses tagged fields like :20:, :25:, :60F:, :61:, :86:, :62F:
 */
export function parseMt940(content: string): ParseResult {
  const transactions: BankTransaction[] = [];
  let accountIBAN: string | undefined;
  let openingBalance: number | undefined;
  let closingBalance: number | undefined;
  let statementDate: string | undefined;

  const lines = content.split(/\r?\n/);
  let currentTransaction: Partial<BankTransaction> | null = null;
  let collectingInfo = false;
  let infoBuffer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Account identification :25:
    if (line.startsWith(':25:')) {
      accountIBAN = line.slice(4).trim().replace(/\//g, '');
    }

    // Opening balance :60F: or :60M:
    if (line.startsWith(':60F:') || line.startsWith(':60M:')) {
      const balData = line.slice(5);
      openingBalance = parseMt940Amount(balData);
    }

    // Statement line :61: - transaction summary
    if (line.startsWith(':61:')) {
      // Save previous transaction
      if (currentTransaction?.date) {
        currentTransaction.description = infoBuffer.trim();
        transactions.push(currentTransaction as BankTransaction);
      }

      const field = line.slice(4);
      currentTransaction = parseMt940Transaction(field);
      collectingInfo = false;
      infoBuffer = '';
    }

    // Information to account owner :86: - transaction details
    if (line.startsWith(':86:')) {
      collectingInfo = true;
      infoBuffer = line.slice(4);
      continue;
    }

    // Closing balance :62F: or :62M:
    if (line.startsWith(':62F:') || line.startsWith(':62M:')) {
      closingBalance = parseMt940Amount(line.slice(5));
      const dateStr = line.slice(6, 12);
      if (dateStr.length === 6) {
        statementDate = `20${dateStr.slice(0, 2)}-${dateStr.slice(2, 4)}-${dateStr.slice(4, 6)}`;
      }
    }

    // Continuation of :86: field (lines not starting with :)
    if (collectingInfo && !line.startsWith(':')) {
      infoBuffer += ' ' + line;
    } else if (line.startsWith(':') && !line.startsWith(':86:')) {
      collectingInfo = false;
    }
  }

  // Last transaction
  if (currentTransaction?.date) {
    currentTransaction.description = infoBuffer.trim();
    transactions.push(currentTransaction as BankTransaction);
  }

  return { transactions, accountIBAN, statementDate, openingBalance, closingBalance };
}

function parseMt940Transaction(field: string): Partial<BankTransaction> {
  // Format: YYMMDD[MMDD]DC[amount]...
  const dateStr = field.slice(0, 6);
  const date = `20${dateStr.slice(0, 2)}-${dateStr.slice(2, 4)}-${dateStr.slice(4, 6)}`;

  // Find D/C indicator and amount
  let offset = 6;
  // Skip optional entry date (4 digits)
  if (/^\d{4}/.test(field.slice(offset))) offset += 4;

  const dcIndicator = field[offset]; // D=debit, C=credit, RD=reverse debit, RC=reverse credit
  offset++;
  if (field[offset] === 'D' || field[offset] === 'C') offset++; // Handle RD/RC

  // Extract amount (digits + comma)
  const amountMatch = field.slice(offset).match(/^(\d+,\d*)/);
  let amount = 0;
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(',', '.'));
  }

  // D=debit (negative), C=credit (positive)
  if (dcIndicator === 'D') amount = -amount;

  return {
    date,
    amount,
    description: '',
  };
}

function parseMt940Amount(balData: string): number {
  // Format: D/CYYMMDDCURRENCY[amount]
  const dc = balData[0];
  const amountStr = balData.slice(10).replace(',', '.');
  let amount = parseFloat(amountStr);
  if (dc === 'D') amount = -amount;
  return amount;
}
