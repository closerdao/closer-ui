import { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

interface Props {
  /** ISO timestamp the countdown runs towards. */
  target: string;
  label?: string;
}

const getRemaining = (targetMs: number) => {
  const seconds = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
};

const QuestCountdown = ({ target, label }: Props) => {
  const t = useTranslations();
  const targetMs = useMemo(() => new Date(target).getTime(), [target]);
  // Server and client would disagree on a live clock, so start empty.
  const [remaining, setRemaining] = useState<ReturnType<
    typeof getRemaining
  > | null>(null);

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return;
    setRemaining(getRemaining(targetMs));
    const interval = setInterval(
      () => setRemaining(getRemaining(targetMs)),
      1000,
    );
    return () => clearInterval(interval);
  }, [targetMs]);

  if (!Number.isFinite(targetMs)) return null;

  const units = [
    { key: 'days', label: t('quests_countdown_days'), value: remaining?.days },
    {
      key: 'hours',
      label: t('quests_countdown_hours'),
      value: remaining?.hours,
    },
    {
      key: 'minutes',
      label: t('quests_countdown_minutes'),
      value: remaining?.minutes,
    },
    {
      key: 'seconds',
      label: t('quests_countdown_seconds'),
      value: remaining?.seconds,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 max-w-[520px] mx-auto">
        {units.map((unit) => (
          <div
            key={unit.key}
            className="bg-neutral rounded-2xl py-4 px-1 text-center"
          >
            <div className="text-3xl leading-none font-semibold tabular-nums">
              {unit.value === undefined
                ? '--'
                : String(unit.value).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-2">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
      {label && (
        <p className="text-center text-sm text-gray-500 mt-3">{label}</p>
      )}
    </div>
  );
};

export default QuestCountdown;
