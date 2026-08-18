import Countdown from 'react-countdown';

import { useTranslations } from 'next-intl';

interface ProposalCountdownTimerProps {
  endDate: string;
  onComplete?: () => void;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const ProposalCountdownTimer = ({
  endDate,
  onComplete,
}: ProposalCountdownTimerProps) => {
  const t = useTranslations();
  const endTimestamp = new Date(endDate).getTime();
  const msRemaining = endTimestamp - Date.now();

  if (msRemaining <= 0 || msRemaining > TWENTY_FOUR_HOURS_MS) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">
            {t('governance_countdown_title')}
          </p>
          <p className="text-xs text-amber-800">
            {t('governance_countdown_description')}
          </p>
        </div>
        <Countdown
          date={endTimestamp}
          onComplete={onComplete}
          renderer={({ hours, minutes, seconds, completed }) => {
            if (completed) {
              return (
                <p className="text-lg font-semibold text-amber-900">
                  {t('governance_voting_ended')}
                </p>
              );
            }

            return (
              <div className="flex items-center gap-2 font-mono text-2xl font-bold text-amber-950">
                <span className="rounded-lg bg-white px-3 py-2 shadow-sm">
                  {String(hours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="rounded-lg bg-white px-3 py-2 shadow-sm">
                  {String(minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="rounded-lg bg-white px-3 py-2 shadow-sm">
                  {String(seconds).padStart(2, '0')}
                </span>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default ProposalCountdownTimer;
