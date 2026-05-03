import type { FundHistoryItem } from '~/cores/api';

export function fundTransactionPaymentProviderLabel(item: FundHistoryItem): string {
  const r = item as FundHistoryItem & Record<string, unknown>;
  const raw = r.paymentProvider ?? r.PaymentProvider;
  if (raw == null) return '';
  const s = String(raw).trim();
  return s;
}
