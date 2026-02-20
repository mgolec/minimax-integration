import { XMLParser } from 'fast-xml-parser';
import type { BankTransaction, ParseResult } from './types.js';

/**
 * Parses ISO 20022 camt.053 (Bank-to-Customer Statement) XML format.
 */
export function parseCamt053(content: string): ParseResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (tagName) => ['Ntry', 'TxDtls', 'Stmt'].includes(tagName),
  });

  const doc = parser.parse(content);
  const root = doc.Document?.BkToCstmrStmt ?? doc.BkToCstmrStmt;
  if (!root) throw new Error('Invalid camt.053 XML: missing BkToCstmrStmt root');

  const statements = Array.isArray(root.Stmt) ? root.Stmt : [root.Stmt];
  const stmt = statements[0];
  if (!stmt) throw new Error('No statement found in camt.053');

  const accountIBAN = stmt.Acct?.Id?.IBAN;
  const openingBalance = parseBalance(stmt.Bal, 'OPBD');
  const closingBalance = parseBalance(stmt.Bal, 'CLBD');
  const statementDate = stmt.CreDtTm?.slice(0, 10);

  const entries = stmt.Ntry ?? [];
  const transactions: BankTransaction[] = [];

  for (const entry of Array.isArray(entries) ? entries : [entries]) {
    const date = entry.BookgDt?.Dt ?? entry.ValDt?.Dt ?? statementDate ?? '';
    const cdtDbt = entry.CdtDbtInd; // CRDT or DBIT
    let amount = parseFloat(entry.Amt?.['#text'] ?? entry.Amt ?? '0');
    const currency = entry.Amt?.['@_Ccy'];

    if (cdtDbt === 'DBIT') amount = -amount;

    // Try to get details from TxDtls
    const txDetails = entry.NtryDtls?.TxDtls;
    const details = Array.isArray(txDetails) ? txDetails[0] : txDetails;

    const counterpartyName =
      details?.RltdPties?.Cdtr?.Nm ?? details?.RltdPties?.Dbtr?.Nm;
    const counterpartyIBAN =
      details?.RltdPties?.CdtrAcct?.Id?.IBAN ?? details?.RltdPties?.DbtrAcct?.Id?.IBAN;
    const reference =
      details?.Refs?.EndToEndId ?? details?.Refs?.AcctSvcrRef ?? entry.AcctSvcrRef;
    const description =
      details?.RmtInf?.Ustrd ?? entry.AddtlNtryInf ?? '';

    transactions.push({
      date,
      amount,
      description: Array.isArray(description) ? description.join(' ') : String(description),
      counterpartyName,
      counterpartyIBAN,
      reference,
      currency,
    });
  }

  return { transactions, accountIBAN, statementDate, openingBalance, closingBalance };
}

function parseBalance(balances: unknown, type: string): number | undefined {
  if (!balances) return undefined;
  const balArr = Array.isArray(balances) ? balances : [balances];
  for (const bal of balArr) {
    if (bal?.Tp?.CdOrPrtry?.Cd === type) {
      let amount = parseFloat(bal.Amt?.['#text'] ?? bal.Amt ?? '0');
      if (bal.CdtDbtInd === 'DBIT') amount = -amount;
      return amount;
    }
  }
  return undefined;
}
