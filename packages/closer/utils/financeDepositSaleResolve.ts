import { TokenSale } from '../types/api';
import { FinanceApplication } from '../types/subscriptions';

export function resolveDepositTokenSaleForFinanceApplication(
  application: FinanceApplication,
  pendingSales: TokenSale[],
): TokenSale | null {
  if (pendingSales.length === 0) {
    return null;
  }
  const appId = application._id;
  const memo = application.memoCode?.trim();
  if (memo) {
    const byMemo = pendingSales.find(
      (s) => (s.memoCode || '').trim() === memo,
    );
    if (byMemo) {
      return byMemo;
    }
  }
  const byAttr = pendingSales.find((s) => {
    if (!Array.isArray(s.attributes)) return false;
    return s.attributes.some((a) => {
      if (!a || typeof a !== 'object') return false;
      const attr = a as {
        financeApplicationId?: string;
        financeApplication?: string;
      };
      const v = attr.financeApplicationId ?? attr.financeApplication;
      return v === appId;
    });
  });
  if (byAttr) {
    return byAttr;
  }
  return pendingSales.length === 1 ? pendingSales[0] : null;
}
