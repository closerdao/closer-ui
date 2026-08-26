const storageKey = (stayId: string) =>
  `closer:stay-token-stake-pending:${stayId}`;

export type PendingStayTokenStake = {
  transactionId: string;
  nightsKey: string;
  completedNightCount: number;
};

export const readPendingStayTokenStake = (
  stayId: string,
  nightsKey: string,
): PendingStayTokenStake | null => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(storageKey(stayId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingStayTokenStake>;
    if (
      typeof parsed.transactionId === 'string' &&
      parsed.nightsKey === nightsKey
    ) {
      const completedNightCount = Number(parsed.completedNightCount);
      return {
        transactionId: parsed.transactionId,
        nightsKey,
        completedNightCount:
          Number.isSafeInteger(completedNightCount) && completedNightCount >= 0
            ? completedNightCount
            : 0,
      };
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
  completedNightCount = 0,
) => {
  try {
    if (typeof window === 'undefined') return;
    const payload: PendingStayTokenStake = {
      transactionId,
      nightsKey,
      completedNightCount,
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
