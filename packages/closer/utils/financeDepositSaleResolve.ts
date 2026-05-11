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
  const byAttr = pendingSales.find((s) =>
    Array.isArray(s.attributes)
      ? s.attributes.some((a: Record<string, unknown>) => {
          const v =
            (a as { financeApplicationId?: string }).financeApplicationId ??
            (a as { financeApplication?: string }).financeApplication;
          return v === appId;
        })
      : false,
  );
  if (byAttr) {
    return byAttr;
  }
  return pendingSales.length === 1 ? pendingSales[0] : null;
}
