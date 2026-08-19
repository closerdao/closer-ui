import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

import type { QuestStatus } from '../../types/quest';
import { getQuestStatusTone } from '../../utils/quests.helpers';

interface Props {
  status: QuestStatus;
  className?: string;
}

const toneStyles = {
  live: 'bg-green-50 text-success',
  upcoming: 'bg-amber-50 text-pending',
  closed: 'bg-neutral text-gray-600',
  cancelled: 'bg-red-50 text-failure',
};

const QuestStatusBadge = ({ status, className }: Props) => {
  const t = useTranslations();
  const tone = getQuestStatusTone(status);

  const label = (() => {
    switch (status) {
      case 'live':
        return t('quests_status_live');
      case 'scheduled':
        return t('quests_status_scheduled');
      case 'draft':
        return t('quests_status_draft');
      case 'locked':
        return t('quests_status_locked');
      case 'settled':
        return t('quests_status_settled');
      case 'cancelled':
        return t('quests_status_cancelled');
      default:
        return status;
    }
  })();

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
        toneStyles[tone],
        className,
      )}
    >
      {tone === 'live' && (
        <span className="w-[7px] h-[7px] rounded-full bg-success animate-pulse motion-reduce:animate-none" />
      )}
      {label}
    </span>
  );
};

export default QuestStatusBadge;
