import type { FundHistoryItem, FundRefundRequestResponseDto } from '~/cores/api';

export function readFundTxRecord(item: FundHistoryItem): Record<string, unknown> {
  return item as FundHistoryItem & Record<string, unknown>;
}

export function getFundTransactionId(item: FundHistoryItem): number {
  const r = readFundTxRecord(item);
  const tid = r.transactionId ?? r.TransactionId ?? r.id ?? r.Id;
  const n = Number(tid);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function isApprovedStatus(statusRaw: string): boolean {
  const s = statusRaw.toUpperCase();
  return (
    s === 'APPROVED' ||
    s === 'PAID' ||
    s === 'COMPLETED' ||
    s === 'SUCCESS' ||
    s === 'CONFIRMED'
  );
}

export function isEligibleRefundOriginalTransaction(item: FundHistoryItem): boolean {
  const r = readFundTxRecord(item);
  const txType = String(r.transactionType ?? r.TransactionType ?? '').toUpperCase();
  const status = String(item.status ?? r.Status ?? '').toUpperCase();
  const isContribution =
    item.isMemberContribution === true ||
    r.isMemberContribution === true ||
    r.IsMemberContribution === true;
  if (!isContribution || !isApprovedStatus(status)) return false;
  if (!txType) return true;
  return txType === 'INCOME';
}

export function sumRefundedAmountForOriginalFromItems(
  items: FundHistoryItem[],
  originalTransactionId: number,
): number {
  if (originalTransactionId < 1) return 0;
  return items.reduce((sum, item) => {
    const r = readFundTxRecord(item);
    const forId = Number(r.refundForTransactionId ?? r.RefundForTransactionId ?? 0);
    if (forId !== originalTransactionId) return sum;
    const txType = String(r.transactionType ?? r.TransactionType ?? '').toUpperCase();
    if (txType && txType !== 'EXPENSE') return sum;
    const amt = Number(item.amount);
    return sum + (Number.isFinite(amt) ? amt : 0);
  }, 0);
}

export function sumRefundRequestAmountForOriginal(
  requests: FundRefundRequestResponseDto[],
  originalTransactionId: number,
): number {
  if (originalTransactionId < 1) return 0;
  return requests.reduce((sum, row) => {
    if (row.originalTransactionId !== originalTransactionId) return sum;
    const u = String(row.status).toUpperCase();
    if (u !== 'PENDING' && u !== 'COMPLETED') return sum;
    const amt = Number(row.amount);
    return sum + (Number.isFinite(amt) ? amt : 0);
  }, 0);
}
