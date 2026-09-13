/**
 * A stablecoin transfer that has been broadcast but not yet confirmed by the
 * API. Kept per credit amount so a reload during verification offers to finish
 * the purchase instead of asking for a second transfer.
 */
const storageKey = (credits: number) =>
  `closer:credits-crypto-payment-pending:${credits}`;

export type PendingCreditsCryptoPayment = {
  txHash: string;
};

export const readPendingCreditsCryptoPayment = (
  credits: number,
): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(storageKey(credits));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCreditsCryptoPayment>;
    if (typeof parsed.txHash === 'string' && parsed.txHash) {
      return parsed.txHash;
    }
    return null;
  } catch {
    return null;
  }
};

export const writePendingCreditsCryptoPayment = (
  credits: number,
  txHash: string,
) => {
  try {
    if (typeof window === 'undefined') return;
    const payload: PendingCreditsCryptoPayment = { txHash };
    window.sessionStorage.setItem(storageKey(credits), JSON.stringify(payload));
  } catch {}
};

export const clearPendingCreditsCryptoPayment = (credits: number) => {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(storageKey(credits));
  } catch {}
};
