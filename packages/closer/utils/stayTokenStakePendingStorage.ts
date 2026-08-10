const storageKey = (stayId: string) => `closer:stay-token-stake-pending:${stayId}`;

export type PendingStayTokenStake = {
  transactionId: string;
  nightsKey: string;
};

export const readPendingStayTokenStake = (
  stayId: string,
  nightsKey: string,
): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(storageKey(stayId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingStayTokenStake>;
    if (
      typeof parsed.transactionId === 'string' &&
      parsed.nightsKey === nightsKey
    ) {
      return parsed.transactionId;
    }
    return null;
  } catch {
    return null;
  }
};

export const writePendingStayTokenStake = (
  stayId: string,
  transactionId: string,
  nightsKey: string,
) => {
  try {
    if (typeof window === 'undefined') return;
    const payload: PendingStayTokenStake = {
      transactionId,
      nightsKey,
    };
    window.sessionStorage.setItem(storageKey(stayId), JSON.stringify(payload));
  } catch {}
};

export const clearPendingStayTokenStake = (stayId: string) => {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(storageKey(stayId));
  } catch {}
};
