const storageKey = (stayId: string) =>
  `closer:stay-crypto-payment-pending:${stayId}`;

export type PendingStayCryptoPayment = {
  txHash: string;
};

export const readPendingStayCryptoPayment = (
  stayId: string,
): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(storageKey(stayId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingStayCryptoPayment>;
    if (typeof parsed.txHash === 'string' && parsed.txHash) {
      return parsed.txHash;
    }
    return null;
  } catch {
    return null;
  }
};

export const writePendingStayCryptoPayment = (
  stayId: string,
  txHash: string,
) => {
  try {
    if (typeof window === 'undefined') return;
    const payload: PendingStayCryptoPayment = { txHash };
    window.sessionStorage.setItem(storageKey(stayId), JSON.stringify(payload));
  } catch {}
};

export const clearPendingStayCryptoPayment = (stayId: string) => {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(storageKey(stayId));
  } catch {}
};
