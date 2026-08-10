import { FinanceApplication } from '../types/subscriptions';

type GetAction = {
  results?: { toJS?: () => unknown };
} | null | undefined;

export function financeApplicationListFromGetAction(
  action: GetAction,
): FinanceApplication[] {
  if (!action?.results?.toJS) {
    return [];
  }
  const raw = action.results.toJS();
  return Array.isArray(raw) ? (raw as FinanceApplication[]) : [];
}
