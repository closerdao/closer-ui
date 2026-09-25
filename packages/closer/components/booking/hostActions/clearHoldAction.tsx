import { useTranslations } from 'next-intl';

import type { Stay } from '../../../types/stay';
import { releaseStayModification } from '../../../utils/stays.api';
import HostReasonModal from './hostReasonModal';

interface Props {
  stayId: string;
  onDone: (stay: Stay) => void | Promise<void>;
  onClose: () => void;
}

const ClearHoldAction = ({ stayId, onDone, onClose }: Props) => {
  const t = useTranslations();
  return (
    <HostReasonModal
      title={t('host_actions_clear_hold')}
      onClose={onClose}
      onSubmit={async (reason) => {
        await onDone(await releaseStayModification(stayId, reason));
      }}
    >
      <p className="text-sm">{t('host_actions_clear_hold_explainer')}</p>
    </HostReasonModal>
  );
};

export default ClearHoldAction;
