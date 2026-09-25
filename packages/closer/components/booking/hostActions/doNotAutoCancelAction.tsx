import { useTranslations } from 'next-intl';

import type { Stay } from '../../../types/stay';
import { exemptStayFromAutoCancel } from '../../../utils/stays.api';
import HostReasonModal from './hostReasonModal';

interface Props {
  stayId: string;
  onDone: (stay: Stay) => void | Promise<void>;
  onClose: () => void;
}

const DoNotAutoCancelAction = ({ stayId, onDone, onClose }: Props) => {
  const t = useTranslations();

  return (
    <HostReasonModal
      title={t('host_actions_do_not_auto_cancel')}
      onClose={onClose}
      onSubmit={async (reason) => {
        await onDone(await exemptStayFromAutoCancel(stayId, reason));
      }}
    >
      <p className="text-sm">{t('host_actions_do_not_auto_cancel_intro')}</p>
    </HostReasonModal>
  );
};

export default DoNotAutoCancelAction;
