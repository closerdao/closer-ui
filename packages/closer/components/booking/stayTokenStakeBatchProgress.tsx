import { useTranslations } from 'next-intl';

export type StayTokenStakeBatchProgressProps = {
  completedNights: number;
  totalNights: number;
  requiresMultipleTransactions: boolean;
  phase?: 'idle' | 'preparing' | 'awaiting-wallet' | 'confirming';
};

export function StayTokenStakeBatchProgress({
  completedNights,
  totalNights,
  requiresMultipleTransactions,
  phase = 'idle',
}: StayTokenStakeBatchProgressProps) {
  const t = useTranslations();

  if (!requiresMultipleTransactions) return null;

  return (
    <div
      className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm space-y-1"
      role="status"
      aria-live="polite"
    >
      <p className="font-semibold text-gray-900">
        {t('stay_create_stake_multiple_transactions')}
      </p>
      <p className="text-gray-700">
        {t('stay_create_stake_batch_progress', {
          completed: completedNights,
          total: totalNights,
        })}
      </p>
      {phase === 'awaiting-wallet' && (
        <p className="text-gray-600">
          {t('stay_create_stake_batch_confirm_wallet')}
        </p>
      )}
      {phase === 'confirming' && (
        <p className="text-gray-600">
          {t('stay_create_stake_batch_confirming')}
        </p>
      )}
    </div>
  );
}
