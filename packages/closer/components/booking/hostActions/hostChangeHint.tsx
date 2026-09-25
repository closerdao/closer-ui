import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslations } from 'next-intl';

import type { HostChangeEntry } from '../../../types/stay';
import { hostChangeActionLabel } from './hostChangeLog.helpers';

dayjs.extend(relativeTime);

interface Props {
  latest: HostChangeEntry | null;
  onOpenHistory: () => void;
}

const HostChangeHint = ({ latest, onOpenHistory }: Props) => {
  const t = useTranslations();
  if (!latest) return null;

  return (
    <button
      type="button"
      onClick={onOpenHistory}
      className="text-left text-xs text-disabled underline-offset-2 hover:underline"
    >
      {t('host_change_hint', {
        name: latest.by?.screenname || t('host_change_someone'),
        when: dayjs(latest.at).fromNow(),
        action: hostChangeActionLabel(latest.action, t),
      })}
    </button>
  );
};

export default HostChangeHint;
