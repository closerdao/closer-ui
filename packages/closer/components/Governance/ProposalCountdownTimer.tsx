import Countdown from 'react-countdown';

import { useHasMounted } from 'closer/hooks/useHasMounted';
import { useTranslations } from 'next-intl';

interface ProposalCountdownTimerProps {
  endDate: string;
  onComplete?: () => void;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Final-hours countdown. Renders as a section of the dark "voting is active"
 * card on the proposal page — it brings its own top rule and spacing, and its
 * colours assume that dark background.
 */
const ProposalCountdownTimer = ({
  endDate,
  onComplete,
}: ProposalCountdownTimerProps) => {
  const t = useTranslations();
  const hasMounted = useHasMounted();
  const endTimestamp = new Date(endDate).getTime();
  const msRemaining = endTimestamp - Date.now();

  // The remaining time is read from the clock at render, so the server and the
  // browser never agree on it. Render nothing until mount rather than ship a
  // countdown the client immediately contradicts.
  if (!hasMounted || msRemaining <= 0 || msRemaining > TWENTY_FOUR_HOURS_MS) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-white/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">
          {t('governance_countdown_title')}
        </p>
        <p className="text-xs text-gray-300">
          {t('governance_countdown_description')}
        </p>
      </div>
      <Countdown
        date={endTimestamp}
        onComplete={onComplete}
        renderer={({ hours, minutes, seconds, completed }) => {
          if (completed) {
            return (
              <p className="text-lg font-semibold text-amber-300">
                {t('governance_voting_ended')}
              </p>
            );
          }

          return (
            <div className="flex items-center gap-2 font-mono text-2xl font-bold text-white">
              <span className="rounded-lg bg-white/10 px-3 py-2">
                {String(hours).padStart(2, '0')}
              </span>
              <span className="text-gray-400">:</span>
              <span className="rounded-lg bg-white/10 px-3 py-2">
                {String(minutes).padStart(2, '0')}
              </span>
              <span className="text-gray-400">:</span>
              <span className="rounded-lg bg-white/10 px-3 py-2">
                {String(seconds).padStart(2, '0')}
              </span>
            </div>
          );
        }}
      />
    </div>
  );
};

export default ProposalCountdownTimer;
